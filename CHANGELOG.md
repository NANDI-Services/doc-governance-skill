# Changelog

## [0.5.1] - 2026-07-19

- docs: clarify the two-step installation process and its purpose in README.md

## [0.5.0] - 2026-07-18

### Fixed
- `claude plugin install NANDI-Services/doc-governance-skill` (the "canonical" one-liner introduced in v0.4.0) never worked. Claude Code's [`plugin install` CLI](https://code.claude.com/docs/en/plugins-reference#plugin-install) only resolves plugin names against configured marketplaces — a bare `owner/repo` reference is never accepted. The real install is a two-step flow: `claude plugin marketplace add <owner>/<repo>` (requires `.claude-plugin/marketplace.json` in the repo) then `claude plugin install <plugin>@<marketplace>`.

### Added
- `.claude-plugin/marketplace.json`: self-referencing single-plugin marketplace named `nandi-services`, with one entry (`doc-governance-skill`, `source: "./"`) pointing at the same tree. Makes `claude plugin marketplace add NANDI-Services/doc-governance-skill` actually succeed against this repo.

### Changed
- `README.md`: Quick Start, Installation, ES palette paragraph, Validate Discovery, and Lessons Learned all rewritten around the two-step install (`marketplace add` then `install doc-governance-skill@nandi-services`).
- `CLAUDE.md` Dual Distribution section retitled "two-step install, both surfaces"; keeps the auto-register mechanism intact (Claude Code v2.1.142+ still auto-loads root `SKILL.md` as a single-skill plugin after install).
- `SKILL.md` Root Invocation Behavior updated so the agent no longer instructs users to run the broken one-liner.

## [0.4.0] - 2026-07-18

### Changed
- Installation unified into a single canonical command: `claude plugin install NANDI-Services/doc-governance-skill`. Registers both plugin (literal `/doc-governance-skill:update` sub-slash) and skill (`/doc-governance-skill` auto-registered from root `SKILL.md`).
- `README.md` Installation section rewritten around the single command. `npx skills add` documented as fallback. `install.sh`/`install.ps1` relabeled as "Team bundling (optional)".
- `CLAUDE.md` Dual Distribution reflects the auto-register mechanism (Claude Code v2.1.142+): a plugin with `SKILL.md` at root, no `skills/` dir, and no `skills` manifest field is auto-loaded as a single-skill plugin.
- `SKILL.md` Root Invocation Behavior updated to describe the new install topology.
- `.github/scripts/release.sh` made CHANGELOG-idempotent: skips prepend when the version entry already exists (allows manual bumps without duplicate entries), and skips the release commit when nothing is staged.

### Removed
- `commands/doc-governance-skill.md` — content was duplicated with `SKILL.md`'s `## Root Invocation Behavior` section and it collided with the plugin auto-register of the root `SKILL.md`. The root slash is now sourced from `SKILL.md` alone.

## [0.3.1] - 2026-07-18

- Merge branch 'main' of https://github.com/NANDI-Services/doc-governance-skill
- feat: enhance documentation and installation scripts for dual distribution as skill and plugin

## [0.3.0] - 2026-07-18

- chore: re-seal doc-governance baseline
- feat: auto-bootstrap baseline in update mode + doc-governance fixes [minor]

## [0.2.3] - 2026-07-18

- docs: add CLAUDE.md for guidance on repository usage and conventions

## [0.2.2] - 2026-07-18

- docs: add 'Lessons Learned' section to README

## [0.2.1] - 2026-07-18

- fix: add missing skills.sh badge to README

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
