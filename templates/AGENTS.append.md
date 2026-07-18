<!-- repo-doc-governance:start -->
## Installed Skill: doc-governance-skill

Run this skill after meaningful repository changes to decide whether documentation updates are required.

Use it for code, config, CI/CD, architecture, API, security, contributor workflow, release, and operations-impacting changes.

Do not use it for cosmetic-only edits, typo-only fixes, comment-only updates, or behavior-neutral refactors.

If impact exists, route updates to the right document(s):
- README.md
- AGENTS.md
- CONTRIBUTING.md
- SECURITY.md
- CHANGELOG.md
- ARCHITECTURE.md
- OPERATIONS.md
- TROUBLESHOOTING.md
- API.md
- docs/**

For heavy audits (rare): run `node .ai/skills/doc-governance-skill/bin/audit.js` to seal a baseline map at `.doc-governance/map.md` and commit it.

For per-change drift checks: run `node .ai/skills/doc-governance-skill/bin/update.js` and act on the emitted `DOC_GOVERNANCE_UPDATE:` block.

Always emit the minimal completion block defined in SKILL.md.
<!-- repo-doc-governance:end -->
