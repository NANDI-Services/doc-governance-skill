#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="repo-doc-governance"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT="$git_root"
else
  REPO_ROOT="$PWD"
fi

DEST_DIR="$REPO_ROOT/.ai/skills/$SKILL_NAME"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"
MARKER_START="<!-- ${SKILL_NAME}:start -->"
MARKER_END="<!-- ${SKILL_NAME}:end -->"

mkdir -p "$DEST_DIR"
cp "$SCRIPT_DIR/SKILL.md" "$DEST_DIR/SKILL.md"
cp -R "$SCRIPT_DIR/templates" "$DEST_DIR/"

if [ ! -f "$AGENTS_FILE" ]; then
  cat > "$AGENTS_FILE" <<'AGENTS'
# AGENTS.md
AGENTS
fi

if ! grep -q "$MARKER_START" "$AGENTS_FILE"; then
  cat >> "$AGENTS_FILE" <<AGENTSBLOCK

$MARKER_START
## Installed Skill: repo-doc-governance

Before closing any meaningful task, run the `repo-doc-governance` skill.

Apply it after code, config, workflow, architecture, security, contributor-process, CI/CD, API, release, or ops changes.

Do not invoke it for cosmetic-only, comments-only, typo-only, or non-behavioral refactors.

The skill decides whether to update documents such as:
- README.md
- AGENTS.md
- CONTRIBUTING.md
- SECURITY.md
- CHANGELOG.md
- ARCHITECTURE.md
- OPERATIONS.md
- TROUBLESHOOTING.md
- API.md
- docs/**

Always end with the exact minimal report required by the skill.
$MARKER_END
AGENTSBLOCK
fi

echo "Installed $SKILL_NAME into $DEST_DIR"
echo "AGENTS.md updated: $AGENTS_FILE"
