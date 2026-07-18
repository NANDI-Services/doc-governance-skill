# Changelog

## [0.2.0] - 2026-07-18

- fix: update release workflow to use RELEASE_TOKEN instead of GITHUB_TOKEN
- fix: add 'graphify-out/' to .gitignore to prevent tracking of generated output
- feat: implement automated release pipeline with version bumping and changelog updates
- Add initial documentation for Agent Roadmap Sync Rules and ROADMAP
- Refactor skill name to 'doc-governance-skill' across documentation and scripts for consistency

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions after
v0.2.0 are appended automatically by `.github/workflows/release.yml` on
every push to `main`.

Bump strategy on auto-release:

- Default: patch bump.
- Include `[minor]` in any commit message since the last tag to force a minor bump.
- Include `[major]` (or `BREAKING CHANGE`) to force a major bump.
- Include `[skip release]` in the HEAD commit message to skip the workflow entirely.

## [0.2.0] - 2026-07-17

### Added
- Dual-mode executables: `bin/audit.js` seals a documentation baseline to `.doc-governance/map.md` with the current `git HEAD` SHA; `bin/update.js` diffs the working tree against the sealed SHA and emits a `DOC_GOVERNANCE_UPDATE:` punch list with three severity tiers (Critical reserved / Warning code drift / Info map staleness).
- `bin/lib/scan.js` shared scanner: extracts H1 title, H1-H3 heading tree, and code references (backtick paths + fenced blocks with `path=`) from every `*.md` in the repo, in deterministic order.
- Non-blocking staleness check in `templates/pre-commit-doc-check.sh` warns when `.md` files changed since the sealed SHA.
- New `SKILL.md` sections: `Audit Mode`, `Update Mode`, and a `Drift Categories Monitored` table.
- `README.md`: `Positioning vs Alternatives` and `Two-Mode Operation` sections with concrete commands and example output.
- `RELEASE_CHECKLIST.md`: `Dual-Mode Executables (v0.2+)` validation block.
- `ROADMAP.md`: `Deferred Backlog (v0.3+)` section listing explicit out-of-scope items for v0.2.
- Automated release pipeline: `.github/workflows/release.yml` + `.github/scripts/release.sh` bump version, prepend changelog, tag, and publish a GitHub release on every push to `main`.

### Changed
- `install.sh` and `install.ps1` now copy `bin/` alongside `SKILL.md` and `templates/` into `.ai/skills/doc-governance-skill/`.
- `templates/AGENTS.append.md` documents both modes inside the managed marker block.
- `SKILL.md` frontmatter declares `version: 0.2.0`.

## [0.1.0] - 2026-07-17

### Added
- Initial release: declarative `SKILL.md` with routing table (README/AGENTS/SECURITY/CHANGELOG/ARCHITECTURE/OPERATIONS/TROUBLESHOOTING/API/docs) and minimal three-line completion block.
- `install.sh` / `install.ps1` / `uninstall.sh` with marker-delimited `AGENTS.md` block management.
- `templates/AGENTS.append.md` and non-blocking `templates/pre-commit-doc-check.sh` reminder hook.
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, and `RELEASE_CHECKLIST.md` publication scaffolding.
- `ROADMAP.md` with product north star, exit criteria, and RoadmapSmith-managed phased backlog.
