---
name: doc-governance-skill
description: Decide doc-impact after meaningful code, config, CI/CD, security, architecture, API, or workflow changes, route updates to the right files, and avoid activation for cosmetic-only or behavior-neutral edits.
version: 0.2.1
---

# Repo Doc Governance

## Purpose
This skill enforces documentation governance with low churn.

It answers three questions after a meaningful change:
1. Does this change require documentation updates?
2. Which document should be updated?
3. What minimum report should be emitted at completion?

## When To Use
Use this skill after a task that may affect maintainers, operators, contributors, or users.

Trigger examples:
- setup, installation, dependencies, or environment requirements changed
- scripts, commands, CI, build, deploy, or release flow changed
- architecture, module boundaries, data flow, trust boundaries, or contracts changed
- API behavior, request/response shape, or compatibility changed
- auth, authz, secret handling, permissions, exposure, or hardening changed
- contributor workflow, lint/test expectations, or PR policy changed
- troubleshooting, operations, rollback, or recovery workflow changed

## When NOT To Use
Do not run this skill for behavior-neutral edits:
- formatting-only or comment-only changes
- typo-only fixes without semantic impact
- pure renames with no behavior change
- internal refactors with no user/developer/operator/security impact
- test-only edits that do not change contributor expectations
- temporary debugging changes removed before completion

## Activation Signals
Common request patterns that should activate this skill:
- "update docs after changing CI pipeline"
- "we changed setup/install steps"
- "security/auth flow changed, what docs need updates?"
- "API contract changed, which docs should be updated?"
- "review doc impact before closing this task"

## Non-Activation Signals
Common request patterns that should not activate this skill:
- "format this file"
- "fix typos only"
- "rename variable/class only"
- "internal refactor with no behavior change"
- "comment cleanup only"

## Decision Flow
Run this sequence after completing implementation:
1. Inspect changed files and task outcome.
2. Determine whether any documentation impact exists.
3. Map each impact to the correct document target.
4. Update only impacted sections and avoid unrelated rewrites.
5. Emit the required minimal completion report.

## Update Rules
Update docs when at least one is true:
1. Setup, dependencies, environment variables, or platform requirements changed.
2. Command usage, scripts, CI/CD, build, deploy, or release behavior changed.
3. Architecture, integrations, data flow, or API contracts changed.
4. Security posture changed (auth/authz/secrets/permissions/exposure/disclosure).
5. Agent workflow or repository automation behavior changed.
6. Contribution process or quality gates changed.
7. Operator runbooks, failure handling, or rollback/recovery changed.
8. User-visible behavior changed enough to require release notes or usage docs.

## Document Routing By Type
Use only the files that match the actual impact:
- `README.md`: setup, usage, safe defaults, common operational commands
- `AGENTS.md`: agent workflow rules and repository automation guidance
- `CONTRIBUTING.md`: contributor workflow, lint/test expectations, PR standards
- `SECURITY.md`: disclosure process, support policy, hardening-relevant maintainer guidance
- `CHANGELOG.md`: user-visible or operator-visible release-facing changes
- `ARCHITECTURE.md`: system boundaries, component responsibilities, trust/data flow
- `OPERATIONS.md`: deployment, maintenance, backup, rollback, incident handling
- `TROUBLESHOOTING.md`: recurring failures, diagnostics, safe remediation
- `API.md` or `docs/api/**`: API behavior or contract changes
- `docs/**`: deep technical documentation not suitable for top-level docs

## Minimal Output Format
At completion, emit exactly this block:

Action Taken: [README.md | AGENTS.md | CONTRIBUTING.md | SECURITY.md | CHANGELOG.md | ARCHITECTURE.md | OPERATIONS.md | TROUBLESHOOTING.md | API.md | docs/** | Multiple | None]
Justification: [one clear sentence]
Persisted Rule: [rule applied or "None"]

## Style Constraints
- Keep output concise and specific.
- Prefer precise, local edits over broad rewrites.
- Do not force documentation updates when impact is absent.
- If multiple documents are impacted, update all relevant ones.

## Audit Mode
Invoke when the human asks for a documentation map, a repo audit, or uses phrases like "audita la documentación" / "map the docs" / "/audit". This mode is heavy and infrequent — run it once per baseline, not per change.

Command:
```bash
node .ai/skills/doc-governance-skill/bin/audit.js
```

Behavior:
- Scans every `*.md` in the repo (skipping `.git`, `node_modules`, `dist`, `build`, `.next`, `target`, `vendor`, `.venv`, `venv`, `.doc-governance`, `.ai`).
- For each doc, records: title (first H1), heading tree (H1–H3), and detected code refs (paths in backticks + fenced blocks annotated with `path=`).
- Writes `.doc-governance/map.md`, sealed with the current `git HEAD` SHA and an ISO 8601 timestamp.
- Exit 0 on success, 1 on I/O or git error.

After running audit, commit `.doc-governance/map.md`. It is the shared baseline the update mode diffs against.

## Update Mode
Invoke when the human asks for a doc-drift check, uses phrases like "update docs" / "actualizá la documentación" / "/update", or after finishing a meaningful change. This mode is lightweight — safe to run per task.

Command:
```bash
node .ai/skills/doc-governance-skill/bin/update.js
```

Optional overrides:
- `--since <ref>` — diff against a specific git ref instead of the sealed SHA.
- `--files a,b,c` — explicit file list, skip git diff entirely.
- stdin — accepts one path per line (e.g. `git diff --name-only | node .../update.js`).

Behavior:
- Reads `.doc-governance/map.md`, extracts the sealed SHA.
- Runs `git diff --name-only <sealed_sha>` (working-tree comparison → catches committed + uncommitted).
- Cross-references changed paths against `code_refs` in the map.
- Emits a `DOC_GOVERNANCE_UPDATE:` block with three severity tiers (Critical / Warning / Info) and a `SUMMARY:` line.
- Exit 0 clean or Info-only, 1 with any Warning or Critical finding.

For each `- doc: <path>` in the emitted Warning list, use the routing table in `## Document Routing By Type` above to decide whether that doc is the right target — the audit tool detects references, not intent.

## Drift Categories Monitored
| Severity | Trigger | Suggested Action |
|---|---|---|
| Critical | Reserved for v0.3+ (semantic mismatch between doc and code signature) | Not emitted in v0.2. |
| Warning | Code path referenced by a doc changed since the sealed SHA | Review the doc sections that mention the changed path; update or confirm still accurate. |
| Info | `.md` files changed since the sealed SHA (map may be stale) | Re-run audit mode to re-seal the baseline. |
