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

## Publication Readiness
- [ ] `npx skills add NANDI-Services/doc-governance-skill --list` shows this skill.
- [ ] License file is present and correct.
- [ ] Tag and release notes prepared.
