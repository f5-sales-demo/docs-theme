import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sanitizePagefindAttribution } from './sanitize-generated-output.mjs';

const command = process.argv[2];

if (command !== 'build' && command !== 'dev' && command !== 'preview') {
  throw new Error('Expected the Astro command to be "build", "dev", or "preview".');
}

const docsSource = new URL('../docs/', import.meta.url);
const contentTarget = new URL('../src/content/docs/', import.meta.url);
const astroBin = fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url));

await rm(contentTarget, { recursive: true, force: true });
await cp(docsSource, contentTarget, { recursive: true });

let child;
const cleanupContent = () => rmSync(contentTarget, { recursive: true, force: true });
const forwardSignal = (signal) => {
  cleanupContent();
  child?.kill(signal);
};
const handleInterrupt = () => forwardSignal('SIGINT');
const handleTerminate = () => forwardSignal('SIGTERM');
const handleHangup = () => forwardSignal('SIGHUP');

process.once('SIGINT', handleInterrupt);
process.once('SIGTERM', handleTerminate);
process.once('SIGHUP', handleHangup);
process.once('exit', cleanupContent);

try {
  const exitCode = await new Promise((resolve, reject) => {
    child = spawn(process.execPath, [astroBin, command, ...process.argv.slice(3)], {
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (signal === 'SIGINT') resolve(130);
      else if (signal === 'SIGTERM') resolve(143);
      else if (signal === 'SIGHUP') resolve(129);
      else resolve(code ?? 1);
    });
  });

  if (command === 'build' && exitCode === 0) {
    const result = await sanitizePagefindAttribution();
    console.log(`Sanitized ${result.replacements} Pagefind contact fields across ${result.filesChanged} files.`);
  }

  if (exitCode !== 0) process.exitCode = exitCode;
} finally {
  process.off('SIGINT', handleInterrupt);
  process.off('SIGTERM', handleTerminate);
  process.off('SIGHUP', handleHangup);
  process.off('exit', cleanupContent);
  await rm(contentTarget, { recursive: true, force: true });
}
