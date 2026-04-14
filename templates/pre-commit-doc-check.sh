#!/usr/bin/env bash
set -euo pipefail

# Lightweight reminder hook. Non-blocking by default.
CHANGED=$(git diff --cached --name-only)

[ -n "$CHANGED" ] || exit 0

IMPACT_PATTERN='(^|/)(src|app|cmd|internal|pkg|lib|api|infra|deploy|docker|helm|terraform|ansible|scripts|\.github/workflows)(/|$)|(^|/)(Makefile|Dockerfile|docker-compose\.ya?ml|compose\.ya?ml|package\.json|requirements\.txt|poetry\.lock|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle|Gemfile|composer\.json|\.env(\.example|\.local)?)$'
DOC_PATTERN='(^|/)(README\.md|AGENTS\.md|CONTRIBUTING\.md|SECURITY\.md|CHANGELOG\.md|ARCHITECTURE\.md|OPERATIONS\.md|TROUBLESHOOTING\.md|API\.md|CODE_OF_CONDUCT\.md|docs/)'

if echo "$CHANGED" | grep -Eq "$IMPACT_PATTERN"; then
  if ! echo "$CHANGED" | grep -Eq "$DOC_PATTERN"; then
    echo "[repo-doc-governance] Warning: meaningful repo changes detected without doc updates."
    echo "[repo-doc-governance] Run the doc impact review before committing if documentation impact exists."
  fi
fi
