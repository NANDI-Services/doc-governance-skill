# Skill: repo-doc-governance

## Purpose
Enforce consistent, low-noise documentation maintenance after meaningful repository changes.

This skill decides whether documentation must be updated, which files are relevant, and what must be changed.

## Scope
Review and update documentation only when the completed change materially affects one or more of these areas:

- setup or installation
- dependencies
- environment variables
- commands, scripts, task runners, Make targets
- build, CI/CD, packaging, deployment, release flow
- architecture, module boundaries, data flow, API contracts
- authentication, authorization, secrets handling, permissions, exposure, hardening, disclosure process
- agent behavior, repo automation, AI workflow rules
- contribution workflow, coding standards, linting, testing expectations
- user-facing behavior, operational runbooks, troubleshooting guidance

## Candidate documentation targets
Use only the files that actually match the impact.

- `README.md` -> project overview, setup, usage, quickstart, env vars, common commands
- `AGENTS.md` -> agent rules, repo automation rules, AI workflow, decision protocols
- `CONTRIBUTING.md` -> contribution steps, branch policy, commit/PR conventions, lint/test workflow
- `SECURITY.md` -> supported versions, disclosure process, reporting channel, hardening notes, auth/authz or secret-handling changes that affect maintainers or operators
- `CHANGELOG.md` -> user-visible or operator-visible release notes
- `CODE_OF_CONDUCT.md` -> contributor behavior policy only
- `ARCHITECTURE.md` -> system design, components, trust boundaries, integration flow
- `OPERATIONS.md` -> deployment, operations, maintenance, backup, rollback, rotation, recovery
- `TROUBLESHOOTING.md` -> recurring issues, failure modes, fixes, diagnostics
- `API.md` or `docs/api/**` -> public or internal API behavior, request/response or contract changes
- `docs/**` -> deep technical details that do not belong in top-level docs

## Mandatory decision flow
After any meaningful code/config/workflow change, run this decision sequence:

1. Inspect the task result and changed files.
2. Identify whether the change has documentation impact.
3. Map the impact to the correct document(s).
4. Update only the affected documents.
5. Avoid churn: do not rewrite unrelated sections.
6. End with the exact output format defined below.

## Update rules
Update documentation when at least one is true:

1. Setup, installation, dependencies, or environment requirements changed.
2. Commands, scripts, CI, build, deploy, or release behavior changed.
3. Architecture, folder structure, data flow, integrations, or contracts changed.
4. Security posture changed, including auth, authz, secret usage, permissions, exposure, supported versions, disclosure path, or hardening requirements.
5. Agent behavior or repository automation rules changed.
6. Contribution workflow, standards, linting, testing, or PR expectations changed.
7. Operator workflow, troubleshooting steps, or recovery/rollback process changed.
8. User-visible behavior changed enough to justify release notes or public docs updates.

## Do not update docs for
Do not modify documentation for changes that are purely:

- formatting only
- comments only
- typo fixes with no meaning change
- variable or symbol renames with no behavioral impact
- internal refactors with no user-facing, developer-facing, operator-facing, or security impact
- test-only changes unless contributor workflow or expectations changed
- transient debugging code that is removed before completion

## Security-specific routing
When security-relevant behavior changes, consider these targets first:

- `SECURITY.md` for disclosure/reporting/support matrix/policy/hardening notes
- `README.md` for security-relevant setup or safe defaults
- `ARCHITECTURE.md` for trust boundaries and sensitive flows
- `OPERATIONS.md` for key rotation, backups, incident handling, recovery, rollback
- `TROUBLESHOOTING.md` for security-related failure modes or safe remediation

## Minimal completion output
Print exactly this block at the end, and nothing more around it:

Action Taken: [README.md | AGENTS.md | CONTRIBUTING.md | SECURITY.md | CHANGELOG.md | ARCHITECTURE.md | OPERATIONS.md | TROUBLESHOOTING.md | API.md | docs/** | Multiple | None]
Justification: [one clear sentence]
Persisted Rule: [rule applied or "None"]

## Style constraints
- Be concise.
- Do not waste tokens explaining obvious decisions.
- Prefer precise edits over broad rewrites.
- Never force a documentation change when impact is absent.
- If multiple files qualify, update all relevant ones, not just the most obvious one.
