#!/usr/bin/env bash
set -euo pipefail

# Determine the GitHub org from git remote or argument
if [ $# -ge 1 ]; then
  ORG="$1"
else
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
  ORG=$(echo "$REMOTE_URL" | sed -E 's|.*github\.com[:/]([^/]+)/.*|\1|')
fi

if [ -z "$ORG" ]; then
  echo "Usage: $0 [github-org-name]" >&2
  echo "Could not detect org from git remote." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEST="$REPO_ROOT/assets/github-avatar.png"

echo "Fetching avatar for GitHub org: $ORG"
curl -fsSL "https://github.com/${ORG}.png?size=200" -o "$DEST"
echo "Saved to $DEST"
