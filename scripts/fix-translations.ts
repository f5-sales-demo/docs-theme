#!/usr/bin/env npx tsx
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ECOSYSTEM_ROOT = path.resolve(import.meta.dirname, '..', '..');
const LOCALES = ['fr', 'es', 'de', 'pt-br', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ar', 'it', 'hi', 'th'];
const CONCURRENCY = 8;

const LOCALE_NAMES: Record<string, string> = {
  fr: 'Français', es: 'Español', de: 'Deutsch', 'pt-br': 'Português (Brasil)',
  ja: '日本語', ko: '한국어', 'zh-cn': '简体中文', 'zh-tw': '繁體中文',
  ar: 'العربية', it: 'Italiano', hi: 'हिन्दी', th: 'ไทย',
};

function collectFiles(dir: string): string[] {
  const r: string[] = [];
  if (!fs.existsSync(dir)) return r;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...collectFiles(f));
    else if (/\.mdx?$/.test(e.name)) r.push(f);
  }
  return r;
}

function isLikelyEnglish(t: string): boolean {
  if (!t || t.length < 3) return false;
  const a = t.replace(/[^a-zA-Z]/g, '');
  return a.length / Math.max(t.replace(/\s/g, '').length, 1) > 0.85;
}

function computeSourceHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

interface TranslationJob {
  repo: string;
  enFile: string;
  relPath: string;
  locale: string;
  reason: 'missing' | 'untranslated';
}

function discoverJobs(repos: string[]): TranslationJob[] {
  const jobs: TranslationJob[] = [];
  for (const repo of repos) {
    const enDir = path.join(ECOSYSTEM_ROOT, repo, 'docs', 'en');
    if (!fs.existsSync(enDir)) continue;
    for (const ef of collectFiles(enDir)) {
      const rel = path.relative(enDir, ef);
      const enRaw = fs.readFileSync(ef, 'utf-8');
      const { data: enFm } = matter(enRaw);
      for (const loc of LOCALES) {
        const lf = path.join(ECOSYSTEM_ROOT, repo, 'docs', loc, rel);
        if (!fs.existsSync(lf)) {
          jobs.push({ repo, enFile: ef, relPath: rel, locale: loc, reason: 'missing' });
          continue;
        }
        const { data: lfm } = matter(fs.readFileSync(lf, 'utf-8'));
        const enT = enFm.title?.trim?.() || '';
        const lT = (typeof lfm.title === 'string' ? lfm.title.trim() : '');
        if (enT && lT && lT === enT && isLikelyEnglish(lT)) {
          jobs.push({ repo, enFile: ef, relPath: rel, locale: loc, reason: 'untranslated' });
          continue;
        }
        const enS = (typeof enFm.sidebar?.label === 'string' ? enFm.sidebar.label.trim() : '');
        const lS = (typeof lfm.sidebar?.label === 'string' ? lfm.sidebar.label.trim() : '');
        if (enS && lS && lS === enS && isLikelyEnglish(lS)) {
          jobs.push({ repo, enFile: ef, relPath: rel, locale: loc, reason: 'untranslated' });
          continue;
        }
        if (lfm.i18n?.translator === 'machine' && lfm.i18n?.sourceHash !== computeSourceHash(enRaw)) {
          jobs.push({ repo, enFile: ef, relPath: rel, locale: loc, reason: 'stale' as 'untranslated' });
        }
      }
    }
  }
  return jobs;
}

async function translateOne(job: TranslationJob): Promise<boolean> {
  const { getGlossary } = await import('../src/i18n/glossary.ts');
  const { buildTranslationPrompt } = await import('../src/i18n/prompt.ts');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');

  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const client = new Anthropic({ apiKey });

  const enRaw = fs.readFileSync(job.enFile, 'utf-8');
  const { data: enFm } = matter(enRaw);
  const targetPath = path.join(ECOSYSTEM_ROOT, job.repo, 'docs', job.locale, job.relPath);

  const glossary = getGlossary(job.locale);
  const localeName = LOCALE_NAMES[job.locale] || job.locale;
  const systemPrompt = buildTranslationPrompt(localeName, job.locale, glossary);
  const sourceLength = enRaw.length;

  let translated: string;
  let attempts = 0;
  while (true) {
    attempts++;
    try {
      const stream = client.messages.stream({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: Math.max(4096, Math.ceil(sourceLength * 2.5)),
        system: systemPrompt,
        messages: [{ role: 'user', content: enRaw }],
      });
      const response = await stream.finalMessage();
      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock?.type !== 'text') throw new Error('No text block');
      translated = textBlock.text;
      break;
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 429 && attempts < 5) {
        await new Promise((r) => setTimeout(r, 2 ** attempts * 1000));
        continue;
      }
      console.error(`  ✗ ${job.repo}/${job.locale}/${job.relPath}: ${error.message}`);
      return false;
    }
  }

  let translatedFm: Record<string, unknown>;
  let translatedBody: string;
  try {
    const parsed = matter(translated);
    translatedFm = parsed.data;
    translatedBody = parsed.content;
  } catch {
    console.error(`  ✗ ${job.repo}/${job.locale}/${job.relPath}: YAML parse error in translated output`);
    return false;
  }
  const sourceHash = computeSourceHash(enRaw);

  const merged = { ...enFm };
  if (translatedFm.title) merged.title = translatedFm.title;
  if (translatedFm.description) merged.description = translatedFm.description;
  if (translatedFm.sidebar?.label) {
    merged.sidebar = { ...merged.sidebar, label: translatedFm.sidebar.label };
  }
  if (translatedFm.hero) {
    merged.hero = { ...merged.hero };
    if (translatedFm.hero.tagline) merged.hero.tagline = translatedFm.hero.tagline;
    if (translatedFm.hero.title) merged.hero.title = translatedFm.hero.title;
    if (translatedFm.hero.actions) {
      merged.hero.actions = merged.hero.actions?.map(
        (action: Record<string, unknown>, i: number) => ({
          ...action,
          text: translatedFm.hero.actions?.[i]?.text || action.text,
        }),
      );
    }
  }
  merged.i18n = { sourceHash, translator: 'machine' };

  const output = matter.stringify(translatedBody, merged);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, output, 'utf-8');
  return true;
}

async function runWithConcurrency(jobs: TranslationJob[], concurrency: number) {
  let completed = 0;
  let succeeded = 0;
  let failed = 0;
  const total = jobs.length;

  async function worker(queue: TranslationJob[]) {
    while (queue.length > 0) {
      const job = queue.shift()!;
      const ok = await translateOne(job);
      completed++;
      if (ok) {
        succeeded++;
        console.log(`  ✓ [${completed}/${total}] ${job.repo}/${job.locale}/${job.relPath}`);
      } else {
        failed++;
      }
    }
  }

  const queue = [...jobs];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker(queue));
  await Promise.all(workers);

  return { succeeded, failed, total };
}

// --- main ---
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const targetRepos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const repos = targetRepos.length > 0
  ? targetRepos
  : fs.readdirSync(ECOSYSTEM_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(ECOSYSTEM_ROOT, e.name, 'docs', 'en')))
      .map((e) => e.name)
      .sort();

console.log(`Scanning ${repos.length} repo(s) for translation gaps...`);
const jobs = discoverJobs(repos);

if (jobs.length === 0) {
  console.log('All translations are complete!');
  process.exit(0);
}

const missing = jobs.filter((j) => j.reason === 'missing').length;
const untranslated = jobs.filter((j) => j.reason === 'untranslated').length;
console.log(`Found ${jobs.length} translations needed: ${missing} missing files, ${untranslated} untranslated frontmatter`);
console.log(`Running with concurrency=${CONCURRENCY}...\n`);

const { succeeded, failed, total } = await runWithConcurrency(jobs, CONCURRENCY);
console.log(`\nDone: ${succeeded}/${total} succeeded, ${failed} failed`);
if (failed > 0) process.exit(1);
