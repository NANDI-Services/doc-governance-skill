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
AGENTS_TEMPLATE="$SCRIPT_DIR/templates/AGENTS.append.md"
SKILLS_BASE="$REPO_ROOT/.ai/skills"

die() {
  echo "[${SKILL_NAME}] ERROR: $*" >&2
  exit 1
}

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

is_within_repo_root() {
  local target="$1"
  local resolved_repo
  local resolved_target

  resolved_repo="$(cd "$REPO_ROOT" && pwd -P)"
  resolved_target="$(cd "$target" && pwd -P)"
  [ "$resolved_target" = "$resolved_repo/.ai/skills" ]
}

[ -f "$AGENTS_TEMPLATE" ] || die "Missing template file: $AGENTS_TEMPLATE"
grep -Fq "$MARKER_START" "$AGENTS_TEMPLATE" || die "Template missing start marker: $MARKER_START"
grep -Fq "$MARKER_END" "$AGENTS_TEMPLATE" || die "Template missing end marker: $MARKER_END"
if command -v sha256sum >/dev/null 2>&1; then
  echo "[${SKILL_NAME}] AGENTS template SHA256: $(sha256sum "$AGENTS_TEMPLATE" | awk '{print $1}')"
fi

mkdir -p "$SKILLS_BASE" || die "Failed to create install base: $SKILLS_BASE"
is_within_repo_root "$SKILLS_BASE" || die "Unsafe install base path detected (possible symlink escape): $SKILLS_BASE"
[ ! -L "$AGENTS_FILE" ] || die "AGENTS.md is a symlink; refusing to modify: $AGENTS_FILE"

rm -rf "$DEST_DIR" || die "Failed to reset destination: $DEST_DIR"
mkdir -p "$DEST_DIR" || die "Failed to create destination: $DEST_DIR"
cp "$SCRIPT_DIR/SKILL.md" "$DEST_DIR/SKILL.md" || die "Failed to copy SKILL.md"
cp -R "$SCRIPT_DIR/templates" "$DEST_DIR/" || die "Failed to copy templates"

if [ ! -f "$AGENTS_FILE" ]; then
  cat > "$AGENTS_FILE" <<'AGENTS' || die "Failed to create AGENTS.md"
# AGENTS.md
AGENTS
fi

if grep -Fq "$MARKER_START" "$AGENTS_FILE"; then
  remove_existing_block "$AGENTS_FILE"
fi

if [ -s "$AGENTS_FILE" ] && [ "$(tail -c1 "$AGENTS_FILE" 2>/dev/null || true)" != "" ]; then
  printf '\n' >> "$AGENTS_FILE"
fi
cat "$AGENTS_TEMPLATE" >> "$AGENTS_FILE" || die "Failed to append AGENTS block"

echo "Installed $SKILL_NAME into $DEST_DIR"
echo "AGENTS.md updated: $AGENTS_FILE"
