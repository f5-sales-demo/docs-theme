#!/usr/bin/env bash
# Repository-level regression: published content must satisfy the managed PII gate.
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_ROOT"

failure=0

if ! bash scripts/check-pii.sh --scope head --mode enforce; then
  failure=1
fi

for locale_file in docs/*/environment-variables.mdx; do
  if [ "$(grep -Fc 'docs_site: "https://example.com"' "$locale_file")" -ne 1 ] ||
    [ "$(grep -Fc 'docs_home: "https://example.com/home/"' "$locale_file")" -ne 1 ]; then
    echo "::error file=${locale_file}::environment examples are missing reserved-domain values"
    failure=1
  fi
done

if [ "$failure" -ne 0 ]; then
  exit 1
fi

echo "content privacy tests passed"
