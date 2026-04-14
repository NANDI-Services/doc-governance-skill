---
name: repo-doc-governance
description: Decide doc-impact after meaningful code, config, CI/CD, security, architecture, API, or workflow changes, route updates to the right files, and avoid activation for cosmetic-only or behavior-neutral edits.
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
