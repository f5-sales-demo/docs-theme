import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import matter from 'gray-matter';

const ECOSYSTEM_ROOT = path.resolve(import.meta.dirname, '..', '..');

const jobs = [
  { repo: 'docs-theme', file: 'style-enhancement-guide.mdx', locales: ['ja', 'ko', 'zh-cn', 'zh-tw', 'hi'] },
];

const LOCALE_NAMES: Record<string, string> = {
  ja: '日本語',
  ko: '한국어',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  hi: 'हिन्दी',
};

const client = new Anthropic();

for (const job of jobs) {
  const enPath = path.join(ECOSYSTEM_ROOT, job.repo, 'docs', 'en', job.file);
  const enRaw = fs.readFileSync(enPath, 'utf-8');
  const { data: enFm } = matter(enRaw);
  const sourceHash = createHash('sha256').update(enRaw).digest('hex').slice(0, 12);

  for (const loc of job.locales) {
    console.log(`Translating ${job.file} → ${loc}...`);
    try {
      const stream = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: Math.max(4096, Math.ceil(enRaw.length * 2.5)),
        system: `You are a technical documentation translator. Translate the given markdown to ${LOCALE_NAMES[loc]}.
CRITICAL YAML RULES:
- In frontmatter, ALWAYS wrap title and description values in single quotes: title: '翻訳されたタイトル'
- This prevents YAML parsing errors from colons or special characters
Translate all prose, headings, lists, and admonitions. Keep code blocks, CSS properties, URLs, and component names unchanged.
Output ONLY the translated markdown file with frontmatter fences.`,
        messages: [{ role: 'user', content: enRaw }],
      });
      const resp = await stream.finalMessage();
      const text = resp.content[0].type === 'text' ? resp.content[0].text : '';
      let translatedFm: Record<string, unknown>;
      let translatedBody: string;
      try {
        const parsed = matter(text);
        translatedFm = parsed.data;
        translatedBody = parsed.content;
      } catch {
        console.error(`  ✗ ${loc}: YAML parse error`);
        continue;
      }
      const merged = { ...enFm };
      if (translatedFm.title) merged.title = translatedFm.title;
      if (translatedFm.description) merged.description = translatedFm.description;
      merged.i18n = { sourceHash, translator: 'machine' };
      const output = matter.stringify(translatedBody, merged);
      const outPath = path.join(ECOSYSTEM_ROOT, job.repo, 'docs', loc, job.file);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, output);
      console.log(`  ✓ ${loc}`);
    } catch (err: unknown) {
      console.error(`  ✗ ${loc}: ${(err as Error).message}`);
    }
  }
}
console.log('Done');
