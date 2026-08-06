# Release Checklist

Use this checklist before publishing a new tag.

## Discovery and Metadata
- [ ] `SKILL.md` contains valid YAML frontmatter (`name`, `description`, `version`).
- [ ] Skill name is stable and canonical (`doc-governance-skill`).
- [ ] Description clearly states when to use and when not to use the skill.

## Version and Changelog
`release.sh` reads `SKILL.md` `version:` and honors it when it is higher than the auto-bump, so a manual bump must land in all three files or the release ships mismatched.
- [ ] `SKILL.md` `version:`, `bin/lib/version.js` `TOOL_VERSION` and `.claude-plugin/plugin.json` `version` agree. (`node bin/lib/self-test-update.js` asserts this — `demoVersionFilesAgree`.)
- [ ] `bin/lib/version.js` `TOOL_VERSION` is still a single-line, single-quoted, semicolon-terminated declaration, and `plugin.json` still has exactly one `version` key (`release.sh` rewrites both with `sed`; reformatting breaks releases silently).
- [ ] `CHANGELOG.md` has a hand-written section for this version. `release.sh` skips its auto-prepend when the section already exists.
- [ ] If this release changed `EXCLUDE_DIRS` or ignore semantics, `SCAN_UNIVERSE_VERSIONS` in `bin/lib/version.js` has a matching entry — otherwise consumers' stale baselines will not be flagged.

## Release Dry Run (v0.9.2+)
- [ ] `bash .github/scripts/release.sh --dry-run` announces the expected tag, and its `auto-bump` / `Honoring SKILL.md` lines match what you intended.
- [ ] `git status --short` is unchanged afterwards (a dry run must never mutate).
- [ ] If Actions is unavailable, `bash .github/scripts/release.sh` publishes from here. `workflow_dispatch` does **not** help during an Actions outage — the dispatch is scheduled by the same control plane.

## Generated Content and CI
- [ ] `node bin/lib/sync-exclude-dirs.js --check` exits 0 (the exclusion list in `SKILL.md` is generated from `EXCLUDE_DIRS`; never hand-edit it).
- [ ] `node bin/lib/diff-classify.self-test.js` passes.
- [ ] `node bin/lib/self-test-update.js` passes all cases.
- [ ] CI (`.github/workflows/ci.yml`) is green on the release candidate.

## Documentation Quality
- [ ] `README.md` reflects current behavior and install methods.
- [ ] `SECURITY.md` reflects current disclosure process and scope.
- [ ] `CONTRIBUTING.md` reflects current contribution and validation workflow.
- [ ] Validation commands in `README.md` were run successfully.
- [ ] `templates/AGENTS.append.md` is aligned with `SKILL.md` rules.

## Script Safety
- [ ] `install.sh` is idempotent and updates marker block safely.
- [ ] `install.ps1` is idempotent and updates marker block safely.
- [ ] `uninstall.sh` removes installed files and marker block safely.
- [ ] `templates/AGENTS.append.md` was reviewed as a trusted-source boundary before release.

## Dual-Mode Executables (v0.2+)
- [ ] `node bin/audit.js` writes `.doc-governance/map.md` with a non-empty `sealed_sha:` (or `(no-git)` outside a repo) and exit 0.
- [ ] `.doc-governance/map.md` lists every top-level `*.md` at least once (spot-check `README.md`, `SKILL.md`).
- [ ] `node bin/update.js` on a clean tree exits 0 with `SUMMARY: 0 critical, 0 warnings, 0 info`.
- [ ] `node bin/update.js` after touching a code path referenced by any doc reports at least one Warning and exits 1.
- [ ] `install.sh` and `install.ps1` copy `bin/` alongside `SKILL.md` and `templates/`; installed `audit.js` runs from `.ai/skills/doc-governance-skill/bin/`.

## Baseline Integrity (v0.9+)
- [ ] `.doc-governance/map.md` header carries `tool_version:` equal to this release and a `sealed_dirty:` block (or `sealed_dirty: []` on a clean tree).
- [ ] Re-seal with pending changes, commit map + changes together, then `node bin/update.js` → 0 warnings, with the committed paths listed as `carried_from_seal`. (`release.sh` does exactly this on every release; a red result here means the release commit will report itself as drift.)
- [ ] Hand-edit a scratch copy's `tool_version:` to a pre-0.7.0 value → `node bin/update.js` reports `baseline_version_drift` with `universe_changed:` and exits 1.

## Auto-Bootstrap Smoke (v0.3+)
In a temporary repo without `.doc-governance/map.md`:
- [ ] `mkdir /tmp/dg-smoke && cd /tmp/dg-smoke && git init -q && echo '# X' > README.md && git add . && git commit -qm init`
- [ ] `node /path/to/doc-governance-skill/bin/update.js` creates `.doc-governance/map.md`, exits 0, and prints `baseline_auto_sealed`.
- [ ] Second `node .../bin/update.js` (no changes) exits 0 with `SUMMARY: 0 critical, 0 warnings, 0 info`.

## Plugin Manifest (v0.4+)
- [ ] `.claude-plugin/plugin.json` parses as valid JSON: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8'))"`.
- [ ] `.claude-plugin/plugin.json` `name` matches `SKILL.md` `name:` (both `doc-governance-skill`).
- [ ] `claude plugin validate .` passes with **no warnings**. Both former warnings (missing `plugin.json` `version`, missing marketplace `description`) were fixed in 0.9.1 — a new warning means something regressed.
- [ ] There is no `skills/` directory and no `skills` field in `plugin.json` — root `SKILL.md` must remain the auto-registered single skill. Do NOT re-add `commands/doc-governance-skill.md` (it would collide with the auto-register).
- [ ] `commands/update.md` exists and describes the drift-check flow (runs `bin/update.js`).
- [ ] `install.sh` and `install.ps1` copy `commands/` and `.claude-plugin/` guarded (`[ -d ]` / `Test-Path`).

## Publication Readiness
- [ ] `claude plugin validate .` reports no errors (canonical install path).
- [ ] `npx skills add NANDI-Services/doc-governance-skill --list` shows this skill (fallback skills.sh path).
- [ ] License file is present and correct.
- [ ] Tag and release notes prepared.
