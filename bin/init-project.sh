#!/usr/bin/env bash
# Scaffold AGENTS.md, CLAUDE.md, standards/, docs/ skeleton, and crew.json
# into the current project. Run from the root of an empty (or new) project.
#
# Usage:
#   bash /path/to/crew-plugin/bin/init-project.sh          # team mode (full circuit)
#   bash /path/to/crew-plugin/bin/init-project.sh --solo   # solo mode (minimal structure)
#
# Modes are written explicitly into crew.json — the plugin has no hidden
# defaults: a repo without crew.json behaves exactly like v0.19.1.

set -euo pipefail

MODE="team"
if [ "${1:-}" = "--solo" ]; then
  MODE="solo"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATES="$PLUGIN_ROOT/templates"
TARGET="$(pwd)"
PLUGIN_VERSION="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
  "$PLUGIN_ROOT/.claude-plugin/plugin.json" | head -1)"
PLUGIN_VERSION="${PLUGIN_VERSION:-unknown}"

if [ "$TARGET" = "$PLUGIN_ROOT" ]; then
  echo "Refusing to scaffold into the plugin itself. cd to your project first." >&2
  exit 1
fi

echo "Scaffolding into: $TARGET (mode: $MODE)"

copy_if_absent() {
  local src="$1" dest="$2"
  if [ -e "$dest" ]; then
    echo "  skip (exists): ${dest#$TARGET/}"
  else
    cp "$src" "$dest"
    echo "  wrote:        ${dest#$TARGET/}"
  fi
}

write_crew_json() {
  local dest="$TARGET/crew.json"
  if [ -e "$dest" ]; then
    echo "  skip (exists): crew.json — run /crew:setup to declare what is missing"
    return
  fi
  # Every value explicit: this file IS the project's policy, visible and versioned.
  # `configuredWith` is state, not policy: which plugin version last configured
  # this project. Nobody interprets it to decide behavior — it exists so the
  # session can tell you when a REQUIRED migration landed since then.
  # Only capabilities whose target this scaffold actually creates are seeded:
  # `design.memory` and `testing.guide`. Everything else (where the app runs,
  # the component registry, how renders are captured, which e2e harness) is
  # declared by /crew:setup, which ASKS — the scaffold never guesses a tool.
  # Consequence worth knowing: a declared `testing` section turns the
  # verification table into a closure gate. That is the intent for a project
  # starting today; delete the section to opt out.
  cat > "$dest" <<EOF
{
  "mode": "$MODE",
  "metrics": true,
  "quality": "advise",
  "ceilings": {},
  "configuredWith": "$PLUGIN_VERSION",
  "design": {
    "memory": "docs/design"
  },
  "testing": {
    "guide": "docs/guides/testing.md"
  }
}
EOF
  echo "  wrote:        crew.json"
}

mkdir -p "$TARGET/standards"
mkdir -p "$TARGET/docs/decisions"
mkdir -p "$TARGET/docs/work"
# Design memory ships in both modes: a solo developer builds interface too, and
# without declared memory every UI role degrades to "not contrasted against
# anything". Four files, structure only — the taste is the project's to write.
mkdir -p "$TARGET/docs/design"
# Same argument for the testing guide: a solo developer verifies work too, and
# without a declared strategy every plan either invents a harness or hides the
# cost of building one. Ships empty — the levels and the tooling are the
# project's to write.
mkdir -p "$TARGET/docs/guides"

copy_if_absent "$TEMPLATES/AGENTS.md"                       "$TARGET/AGENTS.md"
copy_if_absent "$TEMPLATES/CLAUDE.md"                       "$TARGET/CLAUDE.md"
copy_if_absent "$TEMPLATES/standards/code-quality.md"      "$TARGET/standards/code-quality.md"
copy_if_absent "$TEMPLATES/docs/decisions/README.md"        "$TARGET/docs/decisions/README.md"
copy_if_absent "$TEMPLATES/docs/decisions/0000-template.md" "$TARGET/docs/decisions/0000-template.md"
copy_if_absent "$TEMPLATES/docs/work/README.md"             "$TARGET/docs/work/README.md"
copy_if_absent "$TEMPLATES/docs/design/README.md"           "$TARGET/docs/design/README.md"
copy_if_absent "$TEMPLATES/docs/design/references.md"       "$TARGET/docs/design/references.md"
copy_if_absent "$TEMPLATES/docs/design/approved.md"         "$TARGET/docs/design/approved.md"
copy_if_absent "$TEMPLATES/docs/design/rejected.md"         "$TARGET/docs/design/rejected.md"
copy_if_absent "$TEMPLATES/docs/guides/testing.md"          "$TARGET/docs/guides/testing.md"
copy_if_absent "$TEMPLATES/docs/guides/testing.es.md"       "$TARGET/docs/guides/testing.es.md"

if [ "$MODE" = "team" ]; then
  mkdir -p "$TARGET/docs/briefs"
  mkdir -p "$TARGET/docs/stories"
  mkdir -p "$TARGET/docs/requirements"
  mkdir -p "$TARGET/docs/proposals"

  copy_if_absent "$TEMPLATES/docs/INDEX.md"                   "$TARGET/docs/INDEX.md"
  copy_if_absent "$TEMPLATES/docs/AGENTS.md"                  "$TARGET/docs/AGENTS.md"
  copy_if_absent "$TEMPLATES/docs/MAINTAINING.md"             "$TARGET/docs/MAINTAINING.md"
  copy_if_absent "$TEMPLATES/docs/DEVIATIONS.md"              "$TARGET/docs/DEVIATIONS.md"
  copy_if_absent "$TEMPLATES/docs/briefs/README.md"           "$TARGET/docs/briefs/README.md"
  copy_if_absent "$TEMPLATES/docs/stories/README.md"          "$TARGET/docs/stories/README.md"
  copy_if_absent "$TEMPLATES/docs/requirements/README.md"     "$TARGET/docs/requirements/README.md"
  copy_if_absent "$TEMPLATES/docs/proposals/README.md"        "$TARGET/docs/proposals/README.md"
  copy_if_absent "$TEMPLATES/docs/guides/delivery-circuit.md" "$TARGET/docs/guides/delivery-circuit.md"
  copy_if_absent "$TEMPLATES/docs/guides/delivery-circuit.es.md" "$TARGET/docs/guides/delivery-circuit.es.md"
fi

write_crew_json

# Authoritative quality gate at commit time: covers agents and humans alike.
# Respects an existing pre-commit hook (append, never overwrite).
install_pre_commit() {
  local hooks_dir="$TARGET/.git/hooks"
  local hook="$hooks_dir/pre-commit"
  local line="bash \"$PLUGIN_ROOT/bin/check-quality.sh\" || exit 1  # crew quality gate"
  if [ ! -d "$TARGET/.git" ]; then
    echo "  skip (no .git): pre-commit quality gate — run 'git init' and re-run this script"
    return
  fi
  mkdir -p "$hooks_dir"
  if [ -e "$hook" ]; then
    if grep -q "check-quality.sh" "$hook" 2>/dev/null; then
      echo "  skip (exists): .git/hooks/pre-commit already runs the crew quality gate"
    else
      printf '\n%s\n' "$line" >> "$hook"
      echo "  appended:     crew quality gate to existing .git/hooks/pre-commit"
    fi
  else
    printf '#!/usr/bin/env bash\n%s\n' "$line" > "$hook"
    chmod +x "$hook"
    echo "  wrote:        .git/hooks/pre-commit (crew quality gate)"
  fi
}
install_pre_commit

echo
echo "Next steps:"
echo "  1. Edit AGENTS.md — replace {PROJECT_NAME}, {STACK}, layout, and commands."
if [ "$MODE" = "team" ]; then
  echo "  2. Write docs/spec.md."
  echo "  3. Install the plugin in this project: /plugin install crew"
  echo "  4. Test activation: /crew:sys, /crew:ux, /crew:da, etc."
  echo "  5. Fill docs/guides/testing.md — levels, harness, adoption bar. It ships empty."
  echo "  6. Run /crew:setup — it asks what this project can do (where it runs,"
  echo "     its component registry, how renders are captured, which e2e harness)"
  echo "     and writes only what you confirm. Nothing is assumed."
else
  echo "  2. Review crew.json — metrics/quality are on with sane values; flip them if unwanted."
  echo "  3. Install the plugin in this project: /plugin install crew"
  echo "  4. Run /crew:setup to declare what this project can do (optional, asks before writing)."
fi
