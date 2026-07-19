---
name: doc-governance-skill
description: Decide doc-impact after meaningful code, config, CI/CD, security, architecture, API, or workflow changes, route updates to the right files, and avoid activation for cosmetic-only or behavior-neutral edits.
version: 0.5.1
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
- `CLAUDE.md`: Claude-agent-specific instructions and repository conventions (pairs with or replaces `AGENTS.md` in Claude-native repos)
- `CONTRIBUTING.md`: contributor workflow, lint/test expectations, PR standards
- `SECURITY.md`: disclosure process, support policy, hardening-relevant maintainer guidance
- `CHANGELOG.md`: user-visible or operator-visible release-facing changes. Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) buckets (Added / Changed / Fixed / Removed / Security). Fixes pending release go under `[Unreleased]`; dated sections are cut on release.
- `ARCHITECTURE.md`: system boundaries, component responsibilities, trust/data flow
- `OPERATIONS.md`: deployment, maintenance, backup, rollback, incident handling
- `TROUBLESHOOTING.md`: recurring failures, diagnostics, safe remediation
- `API.md` or `docs/api/**`: API behavior or contract changes
- `docs/**`: deep technical documentation not suitable for top-level docs

## Minimal Output Format
At completion, emit exactly this block:

Action Taken: [README.md | AGENTS.md | CLAUDE.md | CONTRIBUTING.md | SECURITY.md | CHANGELOG.md | ARCHITECTURE.md | OPERATIONS.md | TROUBLESHOOTING.md | API.md | docs/** | Multiple | None]
Justification: [one clear sentence]
Persisted Rule: [rule to append to CLAUDE.md or AGENTS.md if the change reveals a routing or update policy worth carrying forward; else "None"]

`Persisted Rule` defaults to `None`. Emit a non-None value only when the change reveals a durable policy — e.g. "New CI jobs always update OPERATIONS.md rollback section". The agent applies it by editing `CLAUDE.md` or `AGENTS.md` in the same task.

### When to emit which format
- **Agent-driven decision flow (manual routing)**: emit the `Action Taken` / `Justification` / `Persisted Rule` block above.
- **Update Mode tool (`bin/update.js`)**: emits the `DOC_GOVERNANCE_UPDATE:` / `SUMMARY:` block automatically. The agent still emits the manual block after acting on the tool's findings.

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

Path note: the command assumes the skill installed at `.ai/skills/doc-governance-skill/` (per-repo default from `install.sh`). Adjust to `~/.claude/skills/doc-governance-skill/bin/…` for a global install, or wherever the skill lives in your setup.

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

Path note: same as Audit Mode — adjust the path to your install location.

Optional overrides:
- `--since <ref>` — diff against a specific git ref instead of the sealed SHA.
- `--files a,b,c` — explicit file list, skip git diff entirely.
- stdin — accepts one path per line (e.g. `git diff --name-only | node .../update.js`).

Behavior:
- If `.doc-governance/map.md` is missing, auto-creates it by scanning the repo and sealing to current `git HEAD` (see `## First Run / No Baseline` below).
- Reads `.doc-governance/map.md`, extracts the sealed SHA.
- Runs `git diff --name-only <sealed_sha>` (working-tree comparison → catches committed + uncommitted).
- Cross-references changed paths against `code_refs` in the map.
- Emits a `DOC_GOVERNANCE_UPDATE:` block with three severity tiers (Critical / Warning / Info) and a `SUMMARY:` line.
- Exit 0 clean or Info-only, 1 with any Warning or Critical finding.

For each `- doc: <path>` in the emitted Warning list, use the routing table in `## Document Routing By Type` above to decide whether that doc is the right target — the audit tool detects references, not intent.

## First Run / No Baseline
On the first invocation in a repo without `.doc-governance/map.md`:
- Update Mode auto-creates the map sealed to current `git HEAD` and emits an `Info: baseline_auto_sealed` entry.
- Exit 0 is expected — nothing has changed against a baseline sealed a moment ago.
- Commit `.doc-governance/map.md`. Subsequent runs diff against that SHA.

To seal a baseline explicitly (larger repos, CI-driven bootstrap), run `audit.js` first — behavior is identical.

## Root Invocation Behavior (`/doc-governance-skill`)

Este repo se instala en dos pasos (`claude plugin marketplace add NANDI-Services/doc-governance-skill` + `claude plugin install doc-governance-skill@nandi-services`), que registran plugin y skill desde el mismo árbol. También existe una ruta fallback vía skills.sh (`npx skills add ...`) que registra solo el skill.

**Cómo se ve en el menú según cómo esté instalada:**
- **Vía `claude plugin marketplace add` + `install` (recomendado)** → aparecen 2 slashes literales:
  - `/doc-governance-skill` (root, este flujo) — el plugin loader auto-registra el `SKILL.md` de la raíz como single-skill del plugin (docs oficiales: sin `skills/` dir y sin campo `skills` en el manifest, el root SKILL.md se carga automáticamente).
  - `/doc-governance-skill:update` (chequeo de drift directo) — viene de `commands/update.md`.
- **Vía `npx skills add` (fallback skills.sh)** → aparece 1 slash literal:
  - `/doc-governance-skill` — el mismo flujo, autogenerado del `name:` del frontmatter.
  - El sub-modo update se activa por intent en la conversación ("corré modo update", "chequeá drift"). El agente lee `commands/update.md` como spec formal.

**Flujo del root (idéntico en skill y plugin):**

1. **Corré el flujo manual completo**: inspeccionar cambios, decidir routing usando `## Document Routing By Type`, editar los docs impactados, emitir el bloque `Action Taken` / `Justification` / `Persisted Rule`.

2. **Ofrecé sellar un baseline nuevo al final**, con un mensaje explicativo en lenguaje NO técnico:

   ```
   ¿Querés que saque una "foto nueva" del estado actual de tu documentación?

   Qué significa esto:
   - Escaneo cada archivo .md del repo
   - Anoto qué archivos de código menciona cada uno
   - Guardo esa lista como referencia

   Para qué sirve: la próxima vez que corras el chequeo de drift
   (`/doc-governance-skill:update`), se compara contra esta foto. Si un
   doc menciona código que cambió desde entonces, te lo marca.

   Foto actual: sellada el <fecha> contra el commit <SHA-corto> (o "no hay foto aún")
   Foto nueva: se sellaría contra tu commit actual <SHA-corto>

   ¿Saco la foto nueva? (sí / no)
   ```

3. **Si el user confirma**, correr `node .ai/skills/doc-governance-skill/bin/audit.js` y avisar de commitear `.doc-governance/map.md`.

4. **Si el user rechaza**, cerrar sin acción — dejar el baseline como estaba.

Regla de oro: la skill empodera al user, no lo reemplaza. Nunca correr audit sin confirmación explícita en esta ruta.

## Drift Categories Monitored
| Severity | Trigger | Suggested Action |
|---|---|---|
| Critical | Reserved for v0.3+ (semantic mismatch between doc and code signature) | Not emitted in v0.2. |
| Warning | Code path referenced by a doc changed since the sealed SHA | Review the doc sections that mention the changed path; update or confirm still accurate. |
| Info | `.md` files changed since the sealed SHA (map may be stale) | Re-run audit mode to re-seal the baseline. |
