# Plan — doc-governance-skill v0.2 (audit + update dual-mode)

## Context

`doc-governance-skill` hoy es un `SKILL.md` puramente declarativo (routing table de cambio→doc + formato de output mínimo). Se activa por descripción del agente y no ejecuta nada.

**Cambio:** el skill pasa a ser **ejecutable en dos modos** invocables por intent explícito del humano:
- `/audit` (pesado, ocasional) → genera un artefacto `.doc-governance/map.md` con estructura de documentación + refs código↔doc, sellado con SHA de HEAD
- `/update` (liviano, frecuente) → lee el artefacto, hace `git diff <SHA-sellado>..HEAD`, emite punch list de docs a revisar según refs cruzadas

**Modo de invocación:** descripto en el `SKILL.md` como dos flujos (modo "C" del brainstorming). Cero acoplamiento a runtime — no se instalan slash commands por runtime, el agente elige según intent. Compat total con `npx skills add` (skills.sh convention permite shippear `bin/` — verificado con vercel-labs/skills docs).

**Por qué:** el skill actual asume que el agente sabe qué docs existen y cómo se relacionan con el código. En repos ajenos eso no se sostiene. Sin mapa, cada llamada re-scanea el repo entero → tokens caros. El artefacto committeado sirve como contrato compartido y baseline para diff.

**Diferenciadores frente a competencia** (revisada: `Zarl-prog/doc-drift-detector`, `sam-bretz/harness`, `ddpoe/axiom-graph`):
1. Baseline persistido con SHA sellado — ninguno lo hace
2. Routing a docs canónicos (README/SECURITY/etc.) — ambos competidores detectan drift, ninguno rutea el fix
3. Formato de completion mínimo reproducible — solo nosotros

---

## Scope v0.2

### In-scope
1. **`bin/audit.js`** — Node puro, sin deps npm. Scanea `**/*.md` (con excludes), extrae por archivo: path, título (H1), árbol de headings (H1–H3), refs a código (backticks + fences con `path=`). Escribe `.doc-governance/map.md` con orden determinista. Exit 0 clean, 1 error.
2. **`bin/update.js`** — Node puro. Lee mapa, extrae SHA sellado. Corre `git diff <SHA>..HEAD --name-only` (o rango override vía `--since <ref>` o `--files a,b,c` o stdin de `git diff --name-only`). Cruza paths cambiados contra refs del mapa. Emite punch list severidad 3-tier (Critical / Warning / Info). Detecta si `.md` cambió desde SHA sellado → aviso `map stale, run /audit` (no bloquea). Exit 0 clean, 1 con findings ≥ Warning.
3. **`SKILL.md`** — agregar dos secciones nuevas describiendo los modos audit/update (invocación por intent, comandos concretos, output esperado). Preservar routing table y minimal output block existentes. Sumar tabla "drift categories monitored" (versión reducida, inspirada en Zarl).
4. **`install.sh` / `install.ps1`** — sumar `cp -R bin/` (una línea cada uno). Ubicar `bin/` en `.ai/skills/doc-governance-skill/bin/` en el consumer.
5. **`README.md`** — sumar sección "Two-mode operation" con ejemplos de intent en español/inglés, y sección "Positioning vs alternatives" con diferenciadores explícitos frente a Zarl/harness.
6. **`templates/pre-commit-doc-check.sh`** — extender: si `.md` cambió desde el SHA sellado en `.doc-governance/map.md` y no se re-selló, warning no-bloqueante ("run /audit"). Sigue siendo opt-in vía instalación manual del hook.
7. **`AGENTS.append.md`** — sumar párrafo mencionando los dos flujos y el artefacto `.doc-governance/map.md`.
8. **`RELEASE_CHECKLIST.md`** — sumar items de validación para audit/update (correr en repo demo, verificar exit codes, verificar formato de map).

### Out-of-scope (marcar como v0.3+ en ROADMAP.md)
- Auto-apply de updates (`/update --apply`)
- Semantic parsing (docstring vs signature)
- Formato JSON de output
- Config file (`.doc-governance/config.json`) — defaults hardcodeados alcanzan
- Mappings explícitos en YAML (tipo harness) — auto-detección por backticks alcanza
- CI enforcement automático (workflow yaml)
- Detección de refs semántica (function names sin path, class names, etc.)

---

## Architecture

```
consumer-repo/
├── .doc-governance/
│   └── map.md              ← committed artifact, deterministic order
├── .ai/skills/doc-governance-skill/
│   ├── SKILL.md            ← describes both modes
│   ├── bin/
│   │   ├── audit.js        ← Node, no deps
│   │   └── update.js       ← Node, no deps
│   └── templates/
│       ├── AGENTS.append.md
│       └── pre-commit-doc-check.sh
└── AGENTS.md               ← contains marker block from AGENTS.append.md
```

### `.doc-governance/map.md` schema (deterministic)

```
<!-- doc-governance:map v1 -->
sealed_sha: <full 40-char SHA>
sealed_at: <ISO 8601 UTC>
tool_version: 0.2.0

## Inventory

<sorted by path ASC>

### <relative/path/to/doc.md>
title: <H1 text or "(untitled)">
headings:
  - H1: ...
  - H2: ...
code_refs:
  - src/foo/bar.ts
  - <other paths detected>
```

Orden fijo. Sin timestamps por archivo (evita ruido en diffs). Un solo timestamp global en el header.

### `/update` output (text, LLM-friendly — inspirado en harness --format llm)

```
DOC_GOVERNANCE_UPDATE:

sealed_sha: <SHA>
diff_range: <SHA>..HEAD
files_changed: 4
docs_affected: 2

CRITICAL (0):

WARNING (2):
  - doc: docs/api.md
    referenced_code_changed: [src/handlers/auth.ts, src/handlers/session.ts]
    reason: doc references code that changed since baseline
    routing_target_from_SKILL.md: API.md / docs/api/**
    suggested_action: review "Authentication" section

  - doc: README.md
    referenced_code_changed: [scripts/deploy.sh]
    reason: doc references code that changed since baseline
    routing_target_from_SKILL.md: README.md
    suggested_action: review "Deployment" section

INFO (1):
  - map_staleness: 3 .md files changed since sealed_sha, map may not reflect current structure
    suggested_action: run /audit to re-seal

SUMMARY: 0 critical, 2 warnings, 1 info
```

Severity assignment:
- `Critical` — reserved for future (semantic mismatches). En v0.2 nunca se emite.
- `Warning` — doc referencia código que cambió
- `Info` — map staleness, docs sin refs a código detectable

---

## Files to create/modify

**Create:**
- `bin/audit.js` — script principal audit
- `bin/update.js` — script principal update
- `bin/lib/scan.js` — helper compartido: enumerar docs, extraer headings + refs (evita duplicación entre audit/update)

**Modify:**
- `SKILL.md` — agregar secciones `## Audit Mode` y `## Update Mode` + tabla de drift categories. Preservar todo lo existente.
- `README.md` — sumar sección "Two-mode operation" + "Positioning vs alternatives"
- `install.sh` — una línea `cp -R "$SCRIPT_DIR/bin" "$DEST_DIR/"`
- `install.ps1` — equivalente `Copy-Item -Recurse -Force`
- `templates/AGENTS.append.md` — párrafo sobre los dos flujos + mención del artefacto
- `templates/pre-commit-doc-check.sh` — extender con check de map staleness contra `.doc-governance/map.md`
- `RELEASE_CHECKLIST.md` — sumar items de validación audit/update
- `ROADMAP.md` — mover items v0.3 out-of-scope al phased backlog

**Do not touch (out of scope for this pass):**
- `uninstall.sh` — sigue funcionando, no requiere cambios (el `rm -rf $DEST_DIR` ya limpia `bin/`)
- `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `CODE_OF_CONDUCT.md`

---

## Execution order (fases)

**Phase 1 — Core scripts (sin instalación) — ✅ COMPLETADA:**
1. ✅ `bin/lib/scan.js` (89 líneas, util compartido — extracción de headings/refs/title con fence detection)
2. ✅ `bin/audit.js` — usa `execFileSync` (arg array, no shell), escribe `.doc-governance/map.md` con SHA sellado + timestamp global
3. ✅ `bin/update.js` — flags `--since`, `--files`, stdin. Guard `isSafeGitRef()` para user-controlled refs. Fix runtime: `git diff <ref>` (no `..HEAD`) para detectar committed + uncommitted.
4. ✅ Self-test end-to-end en este repo: audit produjo 241-line map con 10 docs (SHA `aec8d44`); update en tree limpio → 0/0/0 exit 0; update tras `echo '# test' >> install.sh` → 4 warnings (README, RELEASE_CHECKLIST, ROADMAP, docs/plan.md) exit 1; `git checkout install.sh` cleanup OK.

**Phase 2 — Skill integration (concrete insertion points):**

5. **`SKILL.md`** — APPEND (no modifica frontmatter ni las secciones existentes; version bump queda en Phase 4):
   - Al final del archivo, después de `## Style Constraints` (línea 97), agregar:
     - `## Audit Mode` — describe cuándo el humano invoca "audita" / "/audit", que ejecuta `node .ai/skills/doc-governance-skill/bin/audit.js`, produce `.doc-governance/map.md` (sellado con SHA), y que ese archivo debe committearse como baseline compartido.
     - `## Update Mode` — describe cuándo el humano invoca "update docs" / "/update", que ejecuta `node .ai/skills/doc-governance-skill/bin/update.js` (con flags opcionales `--since <ref>`, `--files a,b,c`, o stdin de `git diff --name-only`), produce el bloque `DOC_GOVERNANCE_UPDATE:` (schema en el plan), exit 0 clean / 1 con findings ≥ Warning. Referencia la routing table existente (líneas 72-83) para decidir qué doc actualizar frente a cada `- doc:` afectado.
     - `## Drift Categories Monitored` — tabla 3 columnas (Severity | Trigger | Suggested Action) con 3 filas: Critical (reserved v0.3+ — semantic mismatch), Warning (code referenced by doc changed since sealed SHA — review doc sections mentioning the changed path), Info (map staleness: .md files changed since sealed SHA — run audit to re-seal).
   - NO tocar: frontmatter (líneas 1-4), routing table (72-83), minimal output block (85-90).

6. **`README.md`** — dos INSERTs:
   - Insertar sección `## Two-Mode Operation` después de `## Usage Example` (línea 108, antes de `## Real Scenario`). Contenido: bloque corto describiendo audit vs update, un `bash` fenced con los dos comandos (`node .ai/skills/doc-governance-skill/bin/audit.js` y `.../update.js`), ejemplo del bloque `DOC_GOVERNANCE_UPDATE:` con 1 warning, mención de que `.doc-governance/map.md` debe committearse.
   - Insertar sección `## Positioning vs Alternatives` después de `## What Problem This Solves` (línea 29, antes de `## Why This Skill`). Contenido: lista de 3 bullets con los diferenciadores del plan (SHA-sealed baseline, doc-canonical routing, minimal completion format). Sin naming competitors por nombre (evita fricción upstream).

7. **`templates/AGENTS.append.md`** — extender bloque marcado (líneas 1-23):
   - Después de la lista de docs (línea 20), antes de la línea 22 "Always emit the minimal completion block", agregar dos líneas:
     - "For heavy audits (rare): run \`node .ai/skills/doc-governance-skill/bin/audit.js\` to seal a baseline map at \`.doc-governance/map.md\` and commit it."
     - "For per-change drift checks: run \`node .ai/skills/doc-governance-skill/bin/update.js\` and act on the emitted \`DOC_GOVERNANCE_UPDATE:\` block."
   - Preservar markers `repo-doc-governance:start` y `repo-doc-governance:end` (nombre canónico del bloque en install.sh — no renombrar).

8. **`templates/pre-commit-doc-check.sh`** — extender con staleness check no-bloqueante:
   - Después del bloque `if echo "$CHANGED" | grep -Eq "$IMPACT_PATTERN"` (líneas 12-16), agregar bloque nuevo:
     - Si existe `.doc-governance/map.md`: `SEALED_SHA=$(grep -m1 '^sealed_sha:' .doc-governance/map.md | awk '{print $2}')`.
     - Si `SEALED_SHA` es no-vacío y hay `.md` en `$CHANGED` (grep case-insensitive `\.md$`): `git diff --name-only "$SEALED_SHA" 2>/dev/null | grep -Eq '\.md$'` → warning "map may be stale (docs changed since sealed SHA). Run audit to re-seal.".
   - Mantener `set -euo pipefail` y non-blocking: todos los `echo` warnings, ningún `exit 1`.

**Phase 2 — Skill integration — ✅ COMPLETADA:**
- SKILL.md: 3 secciones agregadas al final (Audit Mode / Update Mode / Drift Categories Monitored). Frontmatter y routing table intactos.
- README.md: 2 inserts (Positioning vs Alternatives después de "What Problem", Two-Mode Operation después de "Usage Example").
- templates/AGENTS.append.md: 2 líneas nuevas dentro del bloque marcado.
- templates/pre-commit-doc-check.sh: staleness check no-bloqueante (`bash -n` OK).
- Self-test post-Phase-2: audit → 11 docs (SHA aec8d44); update → 2 warnings (README + docs/plan.md referencian el hook editado) + 1 info (map staleness) → exit 1. Comportamiento esperado — el tool detectó sus propios edits.

**Phase 3 — Install pipeline (concrete insertion points):**

9. **`install.sh`** — un solo INSERT:
   - Después de la línea 64 (`cp -R "$SCRIPT_DIR/templates" "$DEST_DIR/"`), agregar:
     - `cp -R "$SCRIPT_DIR/bin" "$DEST_DIR/" || die "Failed to copy bin"`
   - No tocar nada más. El `rm -rf "$DEST_DIR"` de la línea 61 ya garantiza que la segunda corrida sobreescribe limpio (idempotencia por reset, no por diff).

10. **`install.ps1`** — un solo INSERT:
    - Después de la línea 61 (`Copy-Item -Recurse -Force (Join-Path $ScriptDir 'templates') $DestDir`), agregar:
      - `Copy-Item -Recurse -Force (Join-Path $ScriptDir 'bin') $DestDir`
    - Mismo patrón que install.sh: reset destructivo antes de copiar (línea 56-58) da idempotencia gratuita.

11. **`uninstall.sh`** — NO tocar. `rm -rf "$DEST_DIR"` (línea 37) barre `bin/` junto con `SKILL.md` y `templates/`. Cero cambios necesarios.

12. **Test end-to-end en este mismo repo** (install.sh usa `git rev-parse --show-toplevel` → instala en el propio repo del skill, self-hosting el bin):
    - Snapshot pre: `ls .ai/skills/ 2>/dev/null` (probable "not found")
    - `./install.sh` (primera corrida) → verificar `.ai/skills/doc-governance-skill/bin/audit.js` existe y arranca (`node .ai/skills/doc-governance-skill/bin/audit.js --help` o `test -f`)
    - `./install.sh` (segunda corrida, idempotencia) → mismo estado final, sin duplicados en AGENTS.md (`grep -c 'repo-doc-governance:start' AGENTS.md` == 1)
    - `./uninstall.sh` → `.ai/skills/doc-governance-skill/` desaparece; markers removidos de AGENTS.md
    - Cleanup: si se creó `.ai/skills/` que no existía, opcionalmente `rm -rf .ai/skills/` (no es del repo del skill)
    - Restaurar AGENTS.md a su estado inicial si el install modificó el head/tail del archivo

13. **Regression guard**: correr `node bin/update.js` después del test — debería seguir funcionando (no debería depender de `.ai/skills/`, solo de `.doc-governance/map.md`).

**Phase 3 — Install pipeline — ✅ COMPLETADA:**
- install.sh:65 → línea `cp -R "$SCRIPT_DIR/bin" "$DEST_DIR/" || die "Failed to copy bin"` agregada.
- install.ps1:62 → línea `Copy-Item -Recurse -Force (Join-Path $ScriptDir 'bin') $DestDir` agregada.
- uninstall.sh: sin cambio (el `rm -rf $DEST_DIR` ya barre `bin/`).
- Test end-to-end: install × 2 (idempotencia) → marker count == 1 cada uno; audit.js instalado corre y sella 11 docs; uninstall → `diff AGENTS.md /tmp/snapshot` bit-idéntico.

**Phase 4 — Release prep — ✅ COMPLETADA:**
- RELEASE_CHECKLIST.md: +5 items en sección "Dual-Mode Executables (v0.2+)" antes de "Publication Readiness".
- ROADMAP.md: +7 items en sección "Deferred Backlog (v0.3+)" antes del bloque managed de RoadmapSmith. Managed markers intactos (count == 1 cada uno).
- SKILL.md: `version: 0.2.0` agregado al frontmatter.
- bin/audit.js: `TOOL_VERSION = '0.2.0'` ya presente desde Phase 1 — sin cambio necesario.

---

## Verification

**Local end-to-end (repo demo separado, ej. NANDI-Services/roadmapsmith):**
```bash
# Instalar
cd /path/to/consumer-repo
npx skills add NANDI-Services/doc-governance-skill

# Audit
node .ai/skills/doc-governance-skill/bin/audit.js
# → escribe .doc-governance/map.md, exit 0

# Verificar formato del mapa
grep -E "^sealed_sha:" .doc-governance/map.md
grep -E "^### " .doc-governance/map.md | head

# Commit del baseline
git add .doc-governance/map.md && git commit -m "Seal doc-governance baseline"

# Simular cambio de código
touch src/handlers/auth.ts && git add -A && git commit -m "test"

# Update
node .ai/skills/doc-governance-skill/bin/update.js
# → emite punch list si algún doc menciona src/handlers/auth.ts, exit 1
# → si nada matchea, "SUMMARY: 0 critical, 0 warnings, 0 info", exit 0
```

**Self-test dentro del propio repo del skill:**
```bash
cd C:/Users/ezesc/Github/doc-governance-skill
node bin/audit.js
cat .doc-governance/map.md
# → debe listar SKILL.md, README.md, AGENTS.md, ROADMAP.md, etc.
# → debe detectar refs a install.sh, bin/audit.js, etc. desde el README
```

**Regression del skill declarativo:**
- Verificar que el `SKILL.md` sigue teniendo frontmatter válido (`grep -n "^name:" SKILL.md`)
- Verificar que la routing table y el minimal output block no cambiaron
- Verificar que `npx skills add ... --list` sigue descubriendo el skill

**Exit code contract:**
- `audit.js` — 0 OK, 1 error de I/O o git ausente
- `update.js` — 0 clean o solo Info, 1 con Warning/Critical o error

---

## Reference files ya existentes que reutilizar

- `SKILL.md` — routing table (líneas 72–83) + minimal output block (líneas 85–90) — se preservan intactos, solo se agregan secciones nuevas
- `install.sh:57–64` — patrón de copia atómica de directorios al `DEST_DIR` — replicar para `bin/`
- `install.ps1:56–61` — equivalente PowerShell
- `templates/pre-commit-doc-check.sh:9–17` — patrón `IMPACT_PATTERN` + `DOC_PATTERN` — reutilizar la lógica de detección; sumar el check de staleness contra map
- `.gitignore` — chequear que no exista `.doc-governance/` como pattern (no debería, es artefacto nuevo)

---

## Deuda deliberada (marcada con `ponytail:` comment en el código)

- `bin/lib/scan.js` — código de scanning es `O(files × refs)` sin cache. Ponytail: `// ponytail: no cache, per-run scan. Cache in .doc-governance/.cache/ if scan >5s en repos grandes.`
- `bin/audit.js` — no lockfile durante escritura del mapa. Ponytail: `// ponytail: last-writer-wins. Add flock if concurrent audit becomes real.`
- Regex de refs de código — solo backticks + fences con `path=`. Ponytail: `// ponytail: precision > recall. Add heuristic path detection if false negatives dominate.`
