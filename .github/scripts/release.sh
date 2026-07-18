#!/usr/bin/env bash
# CI-only. Runs on ubuntu-latest via .github/workflows/release.yml.
# Uses GNU sed (-i without suffix). Not portable to macOS BSD sed as-is.
set -euo pipefail

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
LAST_VERSION="${LAST_TAG#v}"
IFS='.' read -r MAJOR MINOR PATCH <<< "$LAST_VERSION"

CURRENT_VERSION=$(grep -m1 '^version:' SKILL.md | awk '{print $2}')

# Commits since last tag, excluding prior release commits to avoid noise.
COMMITS=$(git log "${LAST_TAG}..HEAD" --format='%s' 2>/dev/null | grep -v '^chore(release):' || true)
if [ -z "$COMMITS" ]; then
  echo "No user commits since $LAST_TAG. Nothing to release."
  exit 0
fi

BUMP="patch"
if echo "$COMMITS" | grep -qF '[major]' || echo "$COMMITS" | grep -q 'BREAKING CHANGE'; then
  BUMP="major"
elif echo "$COMMITS" | grep -qF '[minor]'; then
  BUMP="minor"
fi

case "$BUMP" in
  major) NEW_MAJOR=$((MAJOR+1)); NEW_MINOR=0; NEW_PATCH=0 ;;
  minor) NEW_MAJOR=$MAJOR; NEW_MINOR=$((MINOR+1)); NEW_PATCH=0 ;;
  patch) NEW_MAJOR=$MAJOR; NEW_MINOR=$MINOR; NEW_PATCH=$((PATCH+1)) ;;
esac
NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"

# Honor a manually-pinned higher version in SKILL.md (e.g. first release under this pipeline).
HIGHER=$(printf '%s\n%s\n' "$CURRENT_VERSION" "$NEW_VERSION" | sort -V | tail -1)
if [ "$HIGHER" = "$CURRENT_VERSION" ] && [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
  echo "SKILL.md version ($CURRENT_VERSION) > auto-bump ($NEW_VERSION). Honoring SKILL.md."
  NEW_VERSION="$CURRENT_VERSION"
fi

NEW_TAG="v$NEW_VERSION"
TODAY=$(date -u +%Y-%m-%d)

# If tag already exists (idempotent re-run), stop cleanly.
if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
  echo "Tag $NEW_TAG already exists. Skipping."
  exit 0
fi

echo "Releasing $NEW_TAG (bump: $BUMP, from $LAST_TAG)"

sed -i "s/^version: .*/version: $NEW_VERSION/" SKILL.md
sed -i "s/const TOOL_VERSION = '[^']*';/const TOOL_VERSION = '$NEW_VERSION';/" bin/audit.js

ENTRY_BODY=$(echo "$COMMITS" | sed 's/^/- /')

# Idempotent: if CHANGELOG already has this version (manual bump upstream),
# skip the prepend. sed on SKILL.md and bin/audit.js is already idempotent.
if grep -q "^## \[$NEW_VERSION\]" CHANGELOG.md; then
  echo "CHANGELOG already has [$NEW_VERSION] entry. Skipping prepend."
else
  {
    echo "# Changelog"
    echo ""
    echo "## [$NEW_VERSION] - $TODAY"
    echo ""
    echo "$ENTRY_BODY"
    tail -n +2 CHANGELOG.md
  } > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md
fi

git add SKILL.md bin/audit.js CHANGELOG.md
if git diff --cached --quiet; then
  echo "Version files and CHANGELOG already at $NEW_VERSION. Tagging existing HEAD."
else
  git commit -m "chore(release): $NEW_TAG [skip ci]"
  git push origin HEAD:main
fi
git tag -a "$NEW_TAG" -m "Release $NEW_VERSION"
git push origin "$NEW_TAG"

gh release create "$NEW_TAG" \
  --title "$NEW_TAG" \
  --notes "$ENTRY_BODY"
