#!/usr/bin/env bash
# Scaffold AGENTS.md, CLAUDE.md, .cursor/rules/, and docs/ skeleton into the current project.
# Run from the root of an empty (or new) project.
#
# Usage:
#   bash /path/to/crew-plugin/bin/init-project.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES="$PLUGIN_ROOT/templates"
TARGET="$(pwd)"

if [ "$TARGET" = "$PLUGIN_ROOT" ]; then
  echo "Refusing to scaffold into the plugin itself. cd to your project first." >&2
  exit 1
fi

echo "Scaffolding into: $TARGET"

mkdir -p "$TARGET/.cursor/rules"
mkdir -p "$TARGET/docs/briefs"
mkdir -p "$TARGET/docs/decisions"
mkdir -p "$TARGET/docs/stories"
mkdir -p "$TARGET/docs/requirements"
mkdir -p "$TARGET/docs/proposals"
mkdir -p "$TARGET/docs/guides"
mkdir -p "$TARGET/docs/work"

copy_if_absent() {
  local src="$1" dest="$2"
  if [ -e "$dest" ]; then
    echo "  skip (exists): ${dest#$TARGET/}"
  else
    cp "$src" "$dest"
    echo "  wrote:        ${dest#$TARGET/}"
  fi
}

copy_if_absent "$TEMPLATES/AGENTS.md"                       "$TARGET/AGENTS.md"
copy_if_absent "$TEMPLATES/CLAUDE.md"                       "$TARGET/CLAUDE.md"
copy_if_absent "$TEMPLATES/.cursor/rules/general.mdc"       "$TARGET/.cursor/rules/general.mdc"
copy_if_absent "$TEMPLATES/.cursor/rules/communication.mdc" "$TARGET/.cursor/rules/communication.mdc"
copy_if_absent "$TEMPLATES/.cursor/rules/code-quality.mdc"  "$TARGET/.cursor/rules/code-quality.mdc"
copy_if_absent "$TEMPLATES/docs/INDEX.md"                   "$TARGET/docs/INDEX.md"
copy_if_absent "$TEMPLATES/docs/AGENTS.md"                  "$TARGET/docs/AGENTS.md"
copy_if_absent "$TEMPLATES/docs/MAINTAINING.md"             "$TARGET/docs/MAINTAINING.md"
copy_if_absent "$TEMPLATES/docs/DEVIATIONS.md"              "$TARGET/docs/DEVIATIONS.md"
copy_if_absent "$TEMPLATES/docs/decisions/README.md"        "$TARGET/docs/decisions/README.md"
copy_if_absent "$TEMPLATES/docs/decisions/0000-template.md" "$TARGET/docs/decisions/0000-template.md"
copy_if_absent "$TEMPLATES/docs/briefs/README.md"           "$TARGET/docs/briefs/README.md"
copy_if_absent "$TEMPLATES/docs/stories/README.md"          "$TARGET/docs/stories/README.md"
copy_if_absent "$TEMPLATES/docs/requirements/README.md"     "$TARGET/docs/requirements/README.md"
copy_if_absent "$TEMPLATES/docs/proposals/README.md"        "$TARGET/docs/proposals/README.md"
copy_if_absent "$TEMPLATES/docs/guides/delivery-circuit.md" "$TARGET/docs/guides/delivery-circuit.md"
copy_if_absent "$TEMPLATES/docs/work/README.md"             "$TARGET/docs/work/README.md"

echo
echo "Stack-specific rule examples available in:"
echo "  $TEMPLATES/.cursor/rules-stack-examples/"
echo "Copy the ones you need into .cursor/rules/ and adapt."
echo
echo "Next steps:"
echo "  1. Edit AGENTS.md — replace {PROJECT_NAME}, {STACK}, layout, and commands."
echo "  2. Write docs/spec.md."
echo "  3. Install the plugin in this project: /plugin install crew"
echo "  4. Test activation: /crew:sys, /crew:ux, /crew:da, etc."
