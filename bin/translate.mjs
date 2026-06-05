#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const args = process.argv.slice(2);
  const staged = args.includes('--staged');
  const localeFlag = args.indexOf('--locale');
  const singleLocale = localeFlag !== -1 ? args[localeFlag + 1] : null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[docs-translate] ANTHROPIC_API_KEY not set — skipping translation.');
    process.exit(0);
  }

  const { f5xcDefaultLocales } = await import('@f5xc-salesdemos/docs-theme/src/i18n/locales.ts');
  const { translateFile } = await import('@f5xc-salesdemos/docs-theme/src/i18n/translator.ts');

  const contentDir = process.env.CONTENT_DIR || 'src/content/docs';
  const resolvedContentDir = path.resolve(process.cwd(), contentDir);

  let activeLocales = { ...f5xcDefaultLocales };
  delete activeLocales.en;

  if (singleLocale) {
    if (!activeLocales[singleLocale]) {
      console.error(`[docs-translate] Unknown locale: ${singleLocale}`);
      process.exit(1);
    }
    activeLocales = { [singleLocale]: activeLocales[singleLocale] };
  }

  let englishFiles;
  if (staged) {
    const stagedOutput = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
      encoding: 'utf-8',
    });
    englishFiles = stagedOutput
      .split('\n')
      .filter((f) => f.trim())
      .filter((f) => /\.mdx?$/.test(f))
      .filter((f) => {
        const rel = path.relative(contentDir, f);
        return rel.startsWith('en/') || rel.startsWith('en\\');
      })
      .map((f) => path.resolve(process.cwd(), f));
  } else {
    const enDir = path.join(resolvedContentDir, 'en');
    if (!fs.existsSync(enDir)) {
      console.warn(`[docs-translate] No en/ directory found at ${enDir}`);
      process.exit(0);
    }
    englishFiles = collectFiles(enDir);
  }

  if (englishFiles.length === 0) {
    console.log('[docs-translate] No English files to translate.');
    process.exit(0);
  }

  console.log(
    `[docs-translate] Translating ${englishFiles.length} file(s) to ${Object.keys(activeLocales).length} locale(s)...`,
  );

  const translated = [];

  for (const filePath of englishFiles) {
    for (const [code, config] of Object.entries(activeLocales)) {
      try {
        const result = await translateFile(filePath, code, config.label, {
          apiKey,
          contentDir: resolvedContentDir,
        });
        if (result) {
          translated.push(result);
          console.log(`  ✓ ${path.relative(process.cwd(), result)}`);
        }
      } catch (err) {
        console.warn(`  ✗ ${code}/${path.relative(resolvedContentDir, filePath)}: ${err.message}`);
      }
    }
  }

  if (staged && translated.length > 0) {
    const relativePaths = translated.map((f) => path.relative(process.cwd(), f));
    execFileSync('git', ['add', ...relativePaths]);
    console.log(`[docs-translate] Staged ${translated.length} translated file(s).`);
  }
}

function collectFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (/\.mdx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

main().catch((err) => {
  console.error('[docs-translate] Fatal error:', err.message);
  process.exit(1);
});
