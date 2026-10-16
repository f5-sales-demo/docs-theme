import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const vendor = new URL('../../vendor/pagefind/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', vendor), 'utf8'));
const checksum = (bytes) => createHash('sha256').update(bytes).digest('hex');
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options });
  if (result.error || result.status !== 0) throw result.error || new Error(`${command} failed: ${result.stderr}`);
  return result.stdout;
};
const wasmBindgen = process.env.WASM_BINDGEN_BIN || 'wasm-bindgen';
if (run('rustc', ['--version']).trim() !== manifest.rustCompiler) throw new Error('Use the recorded Rust compiler');
if (run(wasmBindgen, ['--version']).trim() !== `wasm-bindgen ${manifest.wasmBindgenVersion}`)
  throw new Error('Use the recorded wasm-bindgen version');
const patch = await readFile(new URL('pagefind-1.5.2.patch', vendor));
if (checksum(patch) !== manifest.patchSha256) throw new Error('Source patch integrity mismatch');
const workspace = await mkdtemp(path.join(os.tmpdir(), 'pagefind-engine-source-'));
try {
  const source = path.join(workspace, 'source');
  run('git', ['clone', '--quiet', '--no-checkout', 'https://github.com/Pagefind/pagefind.git', source]);
  run('git', ['checkout', '--detach', manifest.upstreamCommit], { cwd: source });
  run('git', ['apply', fileURLToPath(new URL('pagefind-1.5.2.patch', vendor))], { cwd: source });
  const cargoFile = path.join(source, 'pagefind_web/Cargo.toml');
  const cargoHome = process.env.CARGO_HOME || path.join(os.homedir(), '.cargo');
  const remap = [`--remap-path-prefix=${source}=/pagefind`, `--remap-path-prefix=${cargoHome}=/cargo`];
  const cargoEnvironment = { ...process.env, CARGO_ENCODED_RUSTFLAGS: remap.join('\u001f') };

  if (checksum(await readFile(path.join(source, 'pagefind_web/Cargo.lock'))) !== manifest.cargoLockSha256)
    throw new Error('Cargo lock integrity mismatch');
  run(
    'cargo',
    ['test', '--manifest-path', cargoFile, '--locked', '--release', '--features', 'en', 'forward_prefix_tests'],
    { env: cargoEnvironment },
  );
  run(
    'cargo',
    [
      'build',
      '--manifest-path',
      cargoFile,
      '--locked',
      '--release',
      '--features',
      'en',
      '--target',
      'wasm32-unknown-unknown',
    ],
    { env: cargoEnvironment },
  );
  const output = path.join(workspace, 'bindings');
  run(wasmBindgen, [
    path.join(source, 'pagefind_web/target/wasm32-unknown-unknown/release/pagefind_web.wasm'),
    '--target',
    'no-modules',
    '--out-dir',
    output,
  ]);
  const packet = path.join(workspace, 'wasm.en.pagefind');
  run('python3', [
    '-c',
    'import gzip,pathlib,sys; pathlib.Path(sys.argv[2]).write_bytes(gzip.compress(b"pagefind_dcd"+pathlib.Path(sys.argv[1]).read_bytes(),compresslevel=9,mtime=0))',
    path.join(output, 'pagefind_web_bg.wasm'),
    packet,
  ]);
  const bytes = await readFile(packet);
  if (checksum(bytes) !== manifest.sha256) throw new Error(`Rebuilt engine differs: ${checksum(bytes)}`);
  await writeFile(new URL('wasm.en.pagefind', vendor), bytes);
  const bindings = await readFile(path.join(output, 'pagefind_web.js'), 'utf8');
  await writeFile(new URL('pagefind-bindings.cjs', vendor), `${bindings}\nmodule.exports = wasm_bindgen;\n`);
  console.log(`Reproduced Pagefind ${manifest.pagefindVersion} engine sha256:${manifest.sha256}`);
} finally {
  await rm(workspace, { recursive: true, force: true });
}
