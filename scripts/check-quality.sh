#!/usr/bin/env bash
# Authoritative code-quality gate over the staged files. Thin wrapper around
# scripts/check-staged.js so it can be installed as .git/hooks/pre-commit and run
# in CI. Pass --all to check every tracked file instead of the staged set.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/check-staged.js" "$@"
