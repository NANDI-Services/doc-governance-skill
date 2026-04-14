#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="repo-doc-governance"
if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT="$git_root"
else
  REPO_ROOT="$PWD"
fi

DEST_DIR="$REPO_ROOT/.ai/skills/$SKILL_NAME"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"
MARKER_START="<!-- ${SKILL_NAME}:start -->"
MARKER_END="<!-- ${SKILL_NAME}:end -->"

rm -rf "$DEST_DIR"

if [ -f "$AGENTS_FILE" ] && grep -q "$MARKER_START" "$AGENTS_FILE"; then
  perl -0pi -e "s|\n?$MARKER_START.*?$MARKER_END\n?||s" "$AGENTS_FILE"
fi

echo "Uninstalled $SKILL_NAME"
