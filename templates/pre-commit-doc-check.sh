#!/usr/bin/env bash
set -euo pipefail

# Lightweight reminder hook. Non-blocking by default.
CHANGED=$(git diff --cached --name-only)

if echo "$CHANGED" | grep -Eq '(^|/)(src|app|cmd|internal|pkg|lib|api|infra|deploy|docker|helm|terraform|ansible|scripts|Makefile|Dockerfile|compose|\.github/workflows)/|(^|/)(package\.json|requirements\.txt|poetry\.lock|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle|Gemfile|composer\.json|\.env\.example)$'; then
  if ! echo "$CHANGED" | grep -Eq '(^|/)(README\.md|AGENTS\.md|CONTRIBUTING\.md|SECURITY\.md|CHANGELOG\.md|ARCHITECTURE\.md|OPERATIONS\.md|TROUBLESHOOTING\.md|API\.md|docs/)'; then
    echo "[repo-doc-governance] Warning: meaningful repo changes detected without doc updates."
    echo "[repo-doc-governance] Run the doc impact review before committing if documentation impact exists."
  fi
fi
