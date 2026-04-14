#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="repo-doc-governance"
die() {
  echo "[${SKILL_NAME}] ERROR: $*" >&2
  exit 1
}

if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  REPO_ROOT="$git_root"
else
  REPO_ROOT="$PWD"
fi

DEST_DIR="$REPO_ROOT/.ai/skills/$SKILL_NAME"
AGENTS_FILE="$REPO_ROOT/AGENTS.md"
MARKER_START="<!-- ${SKILL_NAME}:start -->"
MARKER_END="<!-- ${SKILL_NAME}:end -->"

remove_existing_block() {
  local file_path="$1"
  local tmp_file
  tmp_file="$(mktemp)"

  awk -v start="$MARKER_START" -v end="$MARKER_END" '
    $0 == start { in_block = 1; next }
    $0 == end { in_block = 0; next }
    !in_block { print }
  ' "$file_path" > "$tmp_file"

  mv "$tmp_file" "$file_path"
}

if [ -d "$DEST_DIR" ]; then
  rm -rf "$DEST_DIR" || die "Failed to remove installed skill directory: $DEST_DIR"
fi

if [ -f "$AGENTS_FILE" ] && grep -Fq "$MARKER_START" "$AGENTS_FILE"; then
  remove_existing_block "$AGENTS_FILE"
fi

echo "Uninstalled $SKILL_NAME"
