---
name: doc-governance-skill
description: Decide doc-impact after meaningful code, config, CI/CD, security, architecture, API, or workflow changes, route updates to the right files, and avoid activation for cosmetic-only or behavior-neutral edits.
version: 0.8.0
---

# Repo Doc Governance

## Purpose
This skill enforces documentation governance with low churn.

It answers three questions after a meaningful change:
1. Does this change require documentation updates?
2. Which document should be updated?
3. What minimum report should be emitted at completion?

## How Detection Works (read this before expecting more)

The skill grep-ea path-refs en backticks / fenced blocks de tus `.md` y los compara contra `git diff --name-only`. Es **substring-matching sobre paths**, no análisis semántico. Un doc que menciona `apps/api/` en prosa se flagea cuando cambia CUALQUIER cosa bajo `apps/api/`. Consecuencias:

- **Sobre-reporta por diseño.** Un `docs_affected: 0` es señal fuerte ("nada relevante"); un warning requiere triage humano.
- **No detecta prose/symbol drift.** README que dice "usa `chart.js`" no genera warning si borrás `chart.js` del `package.json` (el nombre no es un path). Ver `## Known Limitations` para el complemento manual con grep.
- **Ruido reducible con `.doc-governance/ignore`.** Globs por línea (sintaxis gitignore-lite). Excluye docs enteros (`docs/plans/**`, `Task*.md`) y sus code-refs asociados. Ejemplo commiteable: `templates/doc-governance-ignore.example`.

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
Common request patterns that should activate this skill.

**Terminación de sesión (frases naturales, el 80% de los casos):**
- "actualizá los docs" / "actualizá la documentación"
- "update docs" / "update the docs"
- "revisá docs" / "chequeá docs"
- "chequeá qué docs cambiaron"
- "cerrá esta task revisando docs"
- "docs impact?" / "doc impact after this?"

**Después de un cambio específico (más contexto):**
- "actualizá docs después de estos cambios"
- "update docs after changing CI pipeline"
- "we changed setup/install steps"
- "security/auth flow changed, what docs need updates?"
- "API contract changed, which docs should be updated?"
- "review doc impact before closing this task"

**Invocación explícita del skill (bypass heuristics):**
- "corré doc-governance-skill"
- "usá el skill de doc governance"
- Slash literal: `/doc-governance-skill:review` (flujo completo) o `/doc-governance-skill:update` (solo drift check)

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
- **dep add/remove** (`package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, etc.): `CHANGELOG.md` + `README.md` (si la dep aparece en setup/install) + el manifest propio
- **script/comando renombrado** (`next lint` → `eslint .`, `npm test` → `vitest`, etc.): `CHANGELOG.md` + `AGENTS.md` / `CONTRIBUTING.md` si documentan comandos

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

## Root Invocation Behavior

Este flujo aplica cuando el skill se activa — sea por slash (`/doc-governance-skill:review`) o por intent phrasing ("actualizá docs", "revisá qué docs cambiaron", etc.).

### Cold-start guard — chequeá esto ANTES de nada

Verificá si existe `.doc-governance/map.md` en el repo actual:

```bash
test -f .doc-governance/map.md && echo "map exists" || echo "no map"
```

**Si "no map"** (primer uso en este repo): NO sigas con los pasos 1-4 de abajo. Hacé exactamente esto:

1. Ubicá el skill root con `find ~/.claude/plugins/cache/nandi-services/doc-governance-skill -name 'SKILL.md' -not -path '*/node_modules/*' | head -1 | xargs dirname` (fallback a `~/.claude/skills/doc-governance-skill` o `.ai/skills/doc-governance-skill`).
2. Corré `node <skill-root>/bin/audit.js`.
3. Emitir mensaje corto al user:
   > Baseline sellado en `.doc-governance/map.md` (SHA `<sha>`, N docs mapeados).
   > Commiteá: `git add .doc-governance/map.md && git commit -m "chore: seal doc-governance baseline"`
   > Después re-invocáme para el flujo completo.
4. **STOP**. No hay drift para reportar en un baseline recién sellado — ejecutar el flujo agentic completo acá sería caro y no aportaría valor.

**Si "map exists"**: seguí con el flujo abajo.

### Flujo steady-state

1. **Corré el flujo manual completo**: inspeccionar cambios, decidir routing usando `## Document Routing By Type`, editar los docs impactados, emitir el bloque `Action Taken` / `Justification` / `Persisted Rule`.

2. **Cross-check CHANGELOG "Unreleased"** (previene drift-ahead — CHANGELOG que miente sobre el estado del working tree):

   - Localizá la sección `[Unreleased]` / `[Sin publicar]` en `CHANGELOG.md`.
   - Bajo `### Removed` / `### Removido`, extraé cada backtick-token con extensión de archivo (`X.tsx`, `path/Y.ts`, `lib/Z.js`).
   - Para cada token, verificá con `git ls-files -- <path>`. Si devuelve el path (el archivo sigue tracked) pero el bullet dice "eliminado" → warning `changelog_drift_ahead`.
   - Corregí el bullet (o restaurá el archivo, según la intent real) ANTES de emitir el bloque `Action Taken`.

   Este check compensa la limitación documentada en `## Known Limitations`: el skill mide path-refs del diff, no valida coherencia interna del CHANGELOG.

3. **Ofrecé re-sellar el baseline (una línea)**: emitir literal `Reseleo baseline? [Y/n]` y esperar respuesta.

   - Enter / `y` / `yes` / `sí` → correr `node <skill-root>/bin/audit.js`, avisar `Baseline re-sellado (SHA <short>, N docs). Incluí .doc-governance/map.md en tu próximo commit.`
   - `n` / `no` → cerrar sin acción.

   Skip enteramente la pregunta si el flujo se disparó desde `/doc-governance-skill:update` (drift check puro, no toca baseline) o si el user pasó `--no-seal` / "no reseales" en el mensaje original.

   Regla de oro: la skill empodera al user, no lo reemplaza. La pregunta es corta pero explícita — nunca correr audit sin confirmación.

## Drift Categories Monitored

| Severity | Trigger | Suggested Action |
|---|---|---|
| Critical | Reserved (future: semantic mismatch, anchor removed, deleted-file referenced) | Not emitted yet. |
| Warning | Code path referenced by a doc changed **substantively** since the sealed SHA. One entry per changed code file (not per doc), with `affected_docs:` and a 2-3 line `diff_sample:`. | Review the doc sections listed in `affected_docs:` that mention the changed path; update or confirm still accurate. |
| Info | Trivial change (whitespace-only or comment-only) on a referenced path; rename detected (`renamed: A -> B`); `.md` files changed since sealed SHA (map may be stale); auto-bootstrapped baseline. | Depends on subtype — see `suggested_action:` on each entry. |

Exit code: `1` only when there is at least one WARNING. INFO alone returns `0` — it is informational, not blocking.

## Trivial-Change Suppression

To keep the signal-to-noise ratio high, `bin/update.js` inspects each changed code file with `git diff --unified=3` and classifies it before deciding severity:

- **`whitespace-only`** — added and removed lines are identical after normalizing whitespace. Downgraded to INFO.
- **`comment-only`** — every added and removed line matches a known comment pattern for the file's extension (e.g. `//` for `.js/.ts/.prisma`, `#` for `.py/.yml`, `<!-- -->` for `.html`, `--` for `.sql`). Downgraded to INFO.
- **`substantive`** — anything else, including any mix of code + comment changes. Emitted as WARNING.

Unknown extensions default to `substantive` (safer to over-warn than under-warn on a language the classifier does not know). If your repo uses a language not yet covered, add its comment regex to `bin/lib/diff-classify.js` (`COMMENT_PATTERNS_BY_EXT`).

The classifier only downgrades — it never upgrades. A missed classification is a WARNING, not silent suppression.

## Known Limitations

`bin/update.js` mide **referencias a paths** en `.md` — no símbolos, ni scripts, ni prosa descriptiva. `docs_affected: 0` significa "ningún doc menciona un path del diff", NO "docs al día". Casos no cubiertos:

- **Símbolos borrados citados por nombre**: `README.md` dice "usa `chart.js`" y el diff elimina `chart.js` de `package.json`. El nombre no es un path; el skill no avisa.
- **Scripts/comandos en prosa**: `CONTRIBUTING.md` dice `pnpm lint`. Si el script cambia (`next lint` → `eslint .`), el skill no lo detecta.
- **Estado descrito en prosa**: `DESIGN.md` dice "el dashboard usa chart.js". Sigue prosaicamente válido, pero drift real si la lib desaparece.
- **CHANGELOG drift-ahead**: el bullet dice "eliminado `X.tsx`" pero `X.tsx` sigue en `git ls-files`. Cross-check se hace como paso manual en `## Root Invocation Behavior > Flujo steady-state` (ver abajo).

**Complemento recomendado ante "docs al día"** — grep de símbolos/scripts/deps borrados sobre todos los `.md`:

```bash
git diff --name-only <sealed-sha> \
  | xargs -I{} basename {} \
  | while read f; do grep -l "$f" $(git ls-files '*.md') 2>/dev/null; done \
  | sort -u
```

Extensión opt-in de detección automática de símbolos (`--symbols`) está trackeada en `ROADMAP.md ## Deferred Backlog`. Por ahora, prosa y símbolos requieren revisión manual — el skill mide path-drift, no intent-drift.
