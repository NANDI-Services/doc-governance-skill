# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

An installable skill (`doc-governance-skill`) for the skills.sh ecosystem. It routes doc-impact decisions after meaningful code changes. `SKILL.md` at the root is the canonical behavior spec — everything else exists to install, execute, or publish it.

## Two-Mode Runtime

The runtime is two Node scripts under `bin/`, no npm dependencies, no `package.json`.

- **Audit** — `node bin/audit.js`: scans every `*.md` (skipping `.git`, `node_modules`, `dist`, `build`, `.next`, `target`, `vendor`, `.venv`, `venv`, `.doc-governance`, `.ai`), extracts title / H1–H3 headings / code refs, writes `.doc-governance/map.md` sealed with `git rev-parse HEAD`. Heavy, once-per-baseline. Commit the map.
- **Update** — `node bin/update.js`: reads sealed SHA from the map, runs `git diff --name-only <sha>` (working-tree — catches committed + uncommitted), matches changed paths against `code_refs` per doc, emits a `DOC_GOVERNANCE_UPDATE:` report. Exit 1 if any Warning. Overrides: `--since <ref>`, `--files a,b,c`, or stdin (`git diff --name-only | update.js`).

Shared scanner: `bin/lib/scan.js` (heading + backtick-path + fenced `path=` extraction).

## Install Scripts

`install.sh` (bash) and `install.ps1` (PowerShell) copy `SKILL.md`, `templates/`, `bin/`, `commands/` (guarded), and `.claude-plugin/` (guarded) into `<repo>/.ai/skills/doc-governance-skill/`, then insert the block from `templates/AGENTS.append.md` into the consumer's `AGENTS.md` between `<!-- repo-doc-governance:start -->` / `:end` markers. Both must stay idempotent. `uninstall.sh` reverses.

## Dual Distribution (two-step install, both surfaces)

The canonical install is `marketplace add` + `install` — Claude Code's `plugin install` CLI resolves plugin names from configured marketplaces only, never from a bare `owner/repo` reference ([plugins-reference](https://code.claude.com/docs/en/plugins-reference#plugin-install)). This repo publishes `.claude-plugin/marketplace.json` (`name: nandi-services`) so both commands target the same tree:

```bash
claude plugin marketplace add NANDI-Services/doc-governance-skill
claude plugin install doc-governance-skill@nandi-services
```

Once installed, the same tree exposes both surfaces because a Claude Code plugin with a `SKILL.md` at the root, no `skills/` subdirectory, and no `skills` manifest field is auto-loaded as a single-skill plugin (Claude Code v2.1.142+, [plugins reference](https://code.claude.com/docs/en/plugins-reference#skills)). Result after install:

- `/doc-governance-skill:review` → literal sub-slash from `commands/review.md`. Thin wrapper for the root full-flow (audit + update + routing + optional re-seal).
- `/doc-governance-skill:update` → literal sub-slash from `commands/update.md`. Drift check only.
- Root `SKILL.md` is also auto-loaded and remains invocable by intent phrasing ("review docs impact", "corré doc-governance-skill") in addition to the literal `:review` slash — same code path.
- **Do NOT name a commands file after the plugin itself.** Files under `commands/<x>.md` in a plugin ALWAYS produce namespaced `/<plugin>:<x>` slashes. A `commands/doc-governance-skill.md` produces the ugly collision `/doc-governance-skill:doc-governance-skill` (verified end-to-end in v0.5.2 → reverted). Choose semantic names for sub-commands (`review.md`, `update.md`, etc.).
- **There is no way to expose an unqualified `/doc-governance-skill` slash from the plugin path** — that slash only exists via the skills.sh install (`npx skills add ...`), which registers as a user-scope skill. The plugin path gives namespaced sub-slashes; skills.sh gives the unqualified slash.

The canonical behavior spec is `SKILL.md`. Both `commands/review.md` and the intent path read the SKILL.md's `## Root Invocation Behavior` — no duplication.

Fallback distribution: `npx skills add NANDI-Services/doc-governance-skill` still works and keeps the skills.sh leaderboard alive, but registers only the skill (no literal sub-slash). Document it as a fallback, not the recommended path.

Team-bundling distribution: `install.sh` / `install.ps1` copy the skill into a specific `<repo>/.ai/skills/doc-governance-skill/` and patch that repo's `AGENTS.md`. Different use case entirely, not an alternative to the user-level install.

## Release Pipeline

`.github/workflows/release.yml` runs `.github/scripts/release.sh` on every push to `main` (unless the commit message contains `[skip release]` or starts with `chore(release):`). Uses `RELEASE_TOKEN` (not `GITHUB_TOKEN`) so the release commit can trigger downstream workflows.

Bump rules from commit messages since last tag:
- `[major]` or `BREAKING CHANGE` → major
- `[minor]` → minor
- otherwise → patch

If `SKILL.md`'s manually-pinned `version:` is higher than the auto-bump, the pinned version wins. The script updates three places in lockstep: `SKILL.md` `version:`, `bin/audit.js` `TOOL_VERSION`, and `CHANGELOG.md`. **When bumping versions manually, update all three.**

## Conventions

- **Node-only, zero deps.** Do not add `package.json` or `node_modules`. Use `execFileSync` (never `execSync` with shell-interpolated refs) and validate git refs with `isSafeGitRef` before passing them.
- **`ponytail:` comments mark deliberate simplifications** with the upgrade path (e.g. `// ponytail: last-writer-wins map file. Add flock if concurrent audit becomes real.`). Preserve them.
- **`.doc-governance/map.md` is the shared baseline** — always commit after re-audit.
- **`templates/AGENTS.append.md` is a trust boundary** — content installs into every consumer's `AGENTS.md`. Review changes carefully.

## Common Tasks

- Validate a release candidate: run through `RELEASE_CHECKLIST.md`.
- Test install idempotence: `./install.sh && ./install.sh && ./uninstall.sh && ./uninstall.sh`.
- Reproduce the update-mode warning path: touch a code file referenced by any doc, `node bin/update.js`, expect exit 1.

## Skills.sh Publishing (fallback path)

Discovery on skills.sh is telemetry-driven: only `npx skills add <owner>/doc-governance-skill` fires the indexing event. Search/leaderboard visibility follows install counts, not manual registration. Since v0.5 the canonical README install is the two-step `claude plugin marketplace add` + `claude plugin install <name>@nandi-services` (fixes the bogus one-liner from v0.4 that never worked), so skills.sh installs come from users who arrive via the leaderboard — the README lists `npx skills add` as a documented fallback. Do not add "register on skills.sh" steps.
