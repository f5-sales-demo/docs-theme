#!/usr/bin/env npx tsx
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ECOSYSTEM_ROOT = path.resolve(import.meta.dirname, '..', '..');
const LOCALES = ['fr', 'es', 'de', 'pt-br', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ar', 'it', 'hi', 'th'];

interface Issue {
  repo: string;
  locale: string;
  file: string;
  type: 'missing' | 'stale' | 'untranslated-title' | 'untranslated-sidebar-label';
  detail?: string;
}

function computeSourceHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

function collectFiles(dir: string, ext = /\.mdx?$/): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...collectFiles(full, ext));
    else if (entry.isFile() && ext.test(entry.name)) results.push(full);
  }
  return results;
}

const TECHNICAL_TERMS = new Set([
  'sdk',
  'api',
  'cli',
  'mcp',
  'tui',
  'hooks',
  'rpc',
  'repl',
  'pty',
  'f5xc-devcontainer',
  'f5xc-firecrawl',
  'osint framework',
  'salesforce',
  'configuration',
  'extensions',
  'plugins',
  'installation',
  'marketplace',
  'secrets',
  'compaction',
  'architecture',
  'theming',
  'theme',
]);

function isLikelyEnglish(text: string): boolean {
  if (!text || text.length < 3) return false;
  if (TECHNICAL_TERMS.has(text.toLowerCase())) return false;
  if (/^[a-z0-9][-a-z0-9]*$/.test(text)) return false;
  if (/^[A-Z0-9 _-]+$/.test(text) && text.length < 15) return false;
  const ascii = text.replace(/[^a-zA-Z]/g, '');
  return ascii.length / Math.max(text.replace(/\s/g, '').length, 1) > 0.85;
}

function auditRepo(repoName: string): Issue[] {
  const docsDir = path.join(ECOSYSTEM_ROOT, repoName, 'docs');
  const enDir = path.join(docsDir, 'en');
  if (!fs.existsSync(enDir)) return [];

  const enFiles = collectFiles(enDir);
  const issues: Issue[] = [];

  for (const enFile of enFiles) {
    const relPath = path.relative(enDir, enFile);
    const enRaw = fs.readFileSync(enFile, 'utf-8');
    const enHash = computeSourceHash(enRaw);
    const { data: enFm } = matter(enRaw);

    for (const locale of LOCALES) {
      const localeFile = path.join(docsDir, locale, relPath);

      if (!fs.existsSync(localeFile)) {
        issues.push({ repo: repoName, locale, file: relPath, type: 'missing' });
        continue;
      }

      const localeRaw = fs.readFileSync(localeFile, 'utf-8');
      const { data: localeFm } = matter(localeRaw);

      if (localeFm.i18n?.translator === 'machine' && localeFm.i18n?.sourceHash !== enHash) {
        issues.push({
          repo: repoName,
          locale,
          file: relPath,
          type: 'stale',
          detail: `stored=${localeFm.i18n.sourceHash} current=${enHash}`,
        });
      }

      const enDesc = typeof enFm.description === 'string' ? enFm.description.trim() : '';
      const localeDesc = typeof localeFm.description === 'string' ? localeFm.description.trim() : '';
      const descWasTranslated = enDesc && localeDesc && localeDesc !== enDesc;

      const enTitle = typeof enFm.title === 'string' ? enFm.title.trim() : '';
      const localeTitle = typeof localeFm.title === 'string' ? localeFm.title.trim() : '';
      if (enTitle && localeTitle && localeTitle === enTitle && isLikelyEnglish(localeTitle) && !descWasTranslated) {
        issues.push({
          repo: repoName,
          locale,
          file: relPath,
          type: 'untranslated-title',
          detail: `title="${localeTitle}"`,
        });
      }

      const enSidebarLabel = typeof enFm.sidebar?.label === 'string' ? enFm.sidebar.label.trim() : '';
      const localeSidebarLabel = typeof localeFm.sidebar?.label === 'string' ? localeFm.sidebar.label.trim() : '';
      if (
        enSidebarLabel &&
        localeSidebarLabel &&
        localeSidebarLabel === enSidebarLabel &&
        isLikelyEnglish(localeSidebarLabel) &&
        !descWasTranslated
      ) {
        issues.push({
          repo: repoName,
          locale,
          file: relPath,
          type: 'untranslated-sidebar-label',
          detail: `sidebar.label="${localeSidebarLabel}"`,
        });
      }
    }
  }

  return issues;
}

function discoverRepos(): string[] {
  const repos: string[] = [];
  for (const entry of fs.readdirSync(ECOSYSTEM_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const enDir = path.join(ECOSYSTEM_ROOT, entry.name, 'docs', 'en');
    if (fs.existsSync(enDir)) repos.push(entry.name);
  }
  return repos.sort();
}

// --- main ---
const repos = discoverRepos();
const allIssues: Issue[] = [];
const summary: { repo: string; enFiles: number; missing: number; stale: number; untranslated: number }[] = [];

for (const repo of repos) {
  const issues = auditRepo(repo);
  allIssues.push(...issues);

  const enDir = path.join(ECOSYSTEM_ROOT, repo, 'docs', 'en');
  const enCount = collectFiles(enDir).length;
  const missing = issues.filter((i) => i.type === 'missing').length;
  const stale = issues.filter((i) => i.type === 'stale').length;
  const untranslated = issues.filter(
    (i) => i.type === 'untranslated-title' || i.type === 'untranslated-sidebar-label',
  ).length;

  summary.push({ repo, enFiles: enCount, missing, stale, untranslated });
}

// Print summary table
console.log('\n=== TRANSLATION AUDIT SUMMARY ===\n');
console.log(
  'Repo'.padEnd(30) +
    'EN Files'.padStart(10) +
    'Missing'.padStart(10) +
    'Stale'.padStart(10) +
    'Untranslated'.padStart(14),
);
console.log('-'.repeat(74));

let totalMissing = 0,
  totalStale = 0,
  totalUntranslated = 0;
for (const s of summary) {
  if (s.missing + s.stale + s.untranslated === 0) continue;
  console.log(
    s.repo.padEnd(30) +
      String(s.enFiles).padStart(10) +
      String(s.missing).padStart(10) +
      String(s.stale).padStart(10) +
      String(s.untranslated).padStart(14),
  );
  totalMissing += s.missing;
  totalStale += s.stale;
  totalUntranslated += s.untranslated;
}
console.log('-'.repeat(74));
console.log(
  'TOTAL'.padEnd(30) +
    String(`${repos.length} repos`).padStart(10) +
    String(totalMissing).padStart(10) +
    String(totalStale).padStart(10) +
    String(totalUntranslated).padStart(14),
);

// Print detailed issues grouped by type
if (allIssues.length > 0) {
  console.log('\n=== MISSING FILES (no translation exists) ===\n');
  const missingByRepo = new Map<string, Map<string, string[]>>();
  for (const i of allIssues.filter((x) => x.type === 'missing')) {
    if (!missingByRepo.has(i.repo)) missingByRepo.set(i.repo, new Map());
    const byFile = missingByRepo.get(i.repo)!;
    if (!byFile.has(i.file)) byFile.set(i.file, []);
    byFile.get(i.file)?.push(i.locale);
  }
  for (const [repo, files] of missingByRepo) {
    console.log(`  ${repo}/`);
    for (const [file, locales] of files) {
      if (locales.length === LOCALES.length) {
        console.log(`    ${file} — ALL locales missing`);
      } else {
        console.log(`    ${file} — missing: ${locales.join(', ')}`);
      }
    }
  }

  const staleIssues = allIssues.filter((x) => x.type === 'stale');
  if (staleIssues.length > 0) {
    console.log('\n=== STALE TRANSLATIONS (English source changed) ===\n');
    const staleByRepo = new Map<string, Map<string, string[]>>();
    for (const i of staleIssues) {
      if (!staleByRepo.has(i.repo)) staleByRepo.set(i.repo, new Map());
      const byFile = staleByRepo.get(i.repo)!;
      if (!byFile.has(i.file)) byFile.set(i.file, []);
      byFile.get(i.file)?.push(i.locale);
    }
    for (const [repo, files] of staleByRepo) {
      console.log(`  ${repo}/`);
      for (const [file, locales] of files) {
        if (locales.length === LOCALES.length) {
          console.log(`    ${file} — ALL locales stale`);
        } else {
          console.log(`    ${file} — stale: ${locales.join(', ')}`);
        }
      }
    }
  }

  const untranslatedIssues = allIssues.filter(
    (x) => x.type === 'untranslated-title' || x.type === 'untranslated-sidebar-label',
  );
  if (untranslatedIssues.length > 0) {
    console.log('\n=== UNTRANSLATED FRONTMATTER (English text in non-English locale) ===\n');
    const untByRepo = new Map<string, { file: string; locale: string; type: string; detail?: string }[]>();
    for (const i of untranslatedIssues) {
      if (!untByRepo.has(i.repo)) untByRepo.set(i.repo, []);
      untByRepo.get(i.repo)?.push(i);
    }
    for (const [repo, items] of untByRepo) {
      console.log(`  ${repo}/`);
      const byFile = new Map<string, { locale: string; type: string; detail?: string }[]>();
      for (const item of items) {
        if (!byFile.has(item.file)) byFile.set(item.file, []);
        byFile.get(item.file)?.push(item);
      }
      for (const [file, entries] of byFile) {
        const locales = [...new Set(entries.map((e) => e.locale))];
        const types = [...new Set(entries.map((e) => e.type))];
        if (locales.length === LOCALES.length) {
          console.log(`    ${file} — ALL locales, ${types.join(' + ')}`);
        } else {
          console.log(`    ${file} — ${locales.join(', ')} — ${types.join(' + ')}`);
        }
      }
    }
  }
}

console.log(`\nTotal issues: ${allIssues.length}`);
