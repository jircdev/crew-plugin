#!/usr/bin/env bash
# Scaffold AGENTS.md, CLAUDE.md, standards/, docs/ skeleton, and crew.json
# into the current project. Run from the root of the project.
#
# Usage:
#   bash /path/to/crew-plugin/scripts/init-project.sh            # team mode (full circuit)
#   bash /path/to/crew-plugin/scripts/init-project.sh --solo     # solo mode (minimal structure)
#   bash /path/to/crew-plugin/scripts/init-project.sh --dry-run  # show what would be written
#   bash /path/to/crew-plugin/scripts/init-project.sh --json     # machine-readable report
#
# Thin wrapper: the scaffold lives in init-project.js, which also records every
# file it writes in .crew/install-state.json (used by /crew:doctor, repair and
# uninstall). Existing files are never overwritten.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/init-project.js" "$@"
