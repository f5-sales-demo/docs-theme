import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { buildTranslationPrompt } from './prompt.ts';

export interface TranslateOptions {
  apiKey: string;
  model?: string;
  contentDir: string;
}

export function computeSourceHash(content: string): string {
  return createHash('sha256').update(content).digest('hex').slice(0, 12);
}

export function needsTranslation(englishContent: string, targetPath: string): boolean {
  if (!fs.existsSync(targetPath)) return true;

  const targetRaw = fs.readFileSync(targetPath, 'utf-8');
  const { data: targetFrontmatter } = matter(targetRaw);

  if (targetFrontmatter.i18n?.translator !== 'machine') {
    return false;
  }

  const currentHash = computeSourceHash(englishContent);
  return targetFrontmatter.i18n.sourceHash !== currentHash;
}

export async function translateFile(
  englishPath: string,
  localeCode: string,
  localeName: string,
  options: TranslateOptions,
): Promise<string | null> {
  const englishRaw = fs.readFileSync(englishPath, 'utf-8');
  const { data: frontmatter } = matter(englishRaw);

  const relativePath = path.relative(path.join(options.contentDir, 'en'), englishPath);
  const targetPath = path.join(options.contentDir, localeCode, relativePath);

  if (!needsTranslation(englishRaw, targetPath)) {
    return null;
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: options.apiKey });

  const systemPrompt = buildTranslationPrompt(localeName, localeCode);
  const sourceLength = englishRaw.length;

  let translated: string;
  let attempts = 0;
  const maxAttempts = 3;

  while (true) {
    attempts++;
    try {
      const stream = client.messages.stream({
        model: options.model || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: Math.max(4096, Math.ceil(sourceLength * 2.5)),
        system: systemPrompt,
        messages: [{ role: 'user', content: englishRaw }],
      });
      const response = await stream.finalMessage();

      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock?.type !== 'text') {
        throw new Error('No text block in API response');
      }
      translated = textBlock.text;
      break;
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 429 && attempts < maxAttempts) {
        const delay = 2 ** attempts * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      console.warn(`[translate] Failed to translate ${relativePath} to ${localeCode}: ${error.message}`);
      return null;
    }
  }

  const { data: translatedFrontmatter, content: translatedBody } = matter(translated);
  const sourceHash = computeSourceHash(englishRaw);

  const mergedFrontmatter = { ...frontmatter };
  if (translatedFrontmatter.title) mergedFrontmatter.title = translatedFrontmatter.title;
  if (translatedFrontmatter.description) mergedFrontmatter.description = translatedFrontmatter.description;
  if (translatedFrontmatter.sidebar?.label) {
    mergedFrontmatter.sidebar = { ...mergedFrontmatter.sidebar, label: translatedFrontmatter.sidebar.label };
  }
  if (translatedFrontmatter.hero) {
    mergedFrontmatter.hero = { ...mergedFrontmatter.hero };
    if (translatedFrontmatter.hero.tagline) mergedFrontmatter.hero.tagline = translatedFrontmatter.hero.tagline;
    if (translatedFrontmatter.hero.title) mergedFrontmatter.hero.title = translatedFrontmatter.hero.title;
    if (translatedFrontmatter.hero.actions) {
      mergedFrontmatter.hero.actions = mergedFrontmatter.hero.actions?.map((action: Record<string, unknown>, i: number) => ({
        ...action,
        text: translatedFrontmatter.hero.actions?.[i]?.text || action.text,
      }));
    }
  }

  mergedFrontmatter.i18n = { sourceHash, translator: 'machine' };

  const output = matter.stringify(translatedBody, mergedFrontmatter);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, output, 'utf-8');

  return targetPath;
}
