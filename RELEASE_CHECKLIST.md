# Release Checklist

Use this checklist before publishing a new tag.

## Discovery and Metadata
- [ ] `SKILL.md` contains valid YAML frontmatter (`name`, `description`).
- [ ] Skill name is stable and canonical (`doc-governance-skill`).
- [ ] Description clearly states when to use and when not to use the skill.

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

## Auto-Bootstrap Smoke (v0.3+)
In a temporary repo without `.doc-governance/map.md`:
- [ ] `mkdir /tmp/dg-smoke && cd /tmp/dg-smoke && git init -q && echo '# X' > README.md && git add . && git commit -qm init`
- [ ] `node /path/to/doc-governance-skill/bin/update.js` creates `.doc-governance/map.md`, exits 0, and prints `baseline_auto_sealed`.
- [ ] Second `node .../bin/update.js` (no changes) exits 0 with `SUMMARY: 0 critical, 0 warnings, 0 info`.

## Publication Readiness
- [ ] `npx skills add NANDI-Services/doc-governance-skill --list` shows this skill.
- [ ] License file is present and correct.
- [ ] Tag and release notes prepared.
