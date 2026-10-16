# English Pagefind matching

The engine uses indexed words beginning with the query term and retains Pagefind's English stemming. It rejects inverse-prefix matches and requires every word in a multiword query to match. Unknown tokens therefore produce no results without disabling autocomplete, ranking, filters, or quoted searches.

The build integration replaces only the English WebAssembly engine after Starlight generates its index. It verifies the Pagefind version, sealed artifact checksum, and the generated module's import/export interface before replacing the file. Other language engines remain untouched.

The artifact uses Pagefind 1.5.2 at the immutable upstream commit recorded in `../../vendor/pagefind/manifest.json`. `../../vendor/pagefind/pagefind-1.5.2.patch` contains both corrections and their Rust regression tests; the upstream license is retained. The adjacent generated bindings exercise the actual WebAssembly module in Node tests against a real Pagefind index.

To reproduce the artifact, use the recorded Rust compiler, the `wasm32-unknown-unknown` target, Python 3.15, and the matching wasm-bindgen CLI:

```sh
WASM_BINDGEN_BIN=/path/to/wasm-bindgen node src/search/rebuild-engine.mjs
```

Build paths are remapped to synthetic source and dependency roots before sealing the artifact.

The rebuild verifies the pinned source patch and Cargo lock, runs the native regressions, and requires the resulting artifact to match its recorded checksum. The published package includes the sealed engine; ordinary documentation builds require no Rust toolchain.
