---
description: Revisar cambios, decidir qué docs actualizar, y ofrecer re-sellar el baseline al final. Flujo completo del root skill (audit + update + routing + optional seal).
argument-hint: (sin argumentos)
allowed-tools: ["Bash", "Read", "Edit", "Grep", "Glob"]
---

# Doc Governance — Review (root flow)

## Cold-start guard (ejecutá esto ANTES de nada)

Verificá si existe `.doc-governance/map.md` en el repo actual:

```bash
test -f .doc-governance/map.md && echo "map exists" || echo "no map"
```

**Si "no map"**: es el bootstrap del baseline. NO leas `SKILL.md`. NO sigas con el flujo de review. Hacé exactamente esto:

1. Ubicá el skill root con `SKILL_ROOT=$(find ~/.claude/plugins/cache/nandi-services/doc-governance-skill -name 'SKILL.md' -not -path '*/node_modules/*' | head -1 | xargs dirname)` (fallback a `~/.claude/skills/doc-governance-skill` o `.ai/skills/doc-governance-skill`).
2. Corré: `node "$SKILL_ROOT/bin/audit.js"`
3. Emitir al user, textual, en una sola respuesta corta:

   > Baseline sellado en `.doc-governance/map.md` (SHA `<sha del output>`, N docs mapeados).
   > Commiteá el archivo con:
   > `git add .doc-governance/map.md && git commit -m "chore: seal doc-governance baseline"`
   > Después re-invocá `/doc-governance-skill:review` para el flujo completo.

4. **STOP.** No ejecutes los pasos 1-6 de abajo. No hay drift que reportar en un baseline recién sellado — sería trabajo agentic caro que no aporta valor.

**Si "map exists"**: seguí con el flujo abajo.

## Acción (steady-state, map ya existe)

Leé el `SKILL.md` en la raíz del skill (`~/.claude/plugins/cache/nandi-services/doc-governance-skill/*/SKILL.md` cuando esté instalado como plugin) y seguí la sección `## Root Invocation Behavior`.

## Resumen del flujo (referencia rápida)

1. Corré `bin/update.js` (Update Mode) para chequear drift contra el baseline sellado.
2. Interpretá el bloque `DOC_GOVERNANCE_UPDATE:` — Critical / Warning / Info.
3. Por cada Warning, decidí si el doc referenciado necesita update real o si es un match espurio.
4. Aplicá updates mínimos solo a los docs que lo requieran, siguiendo la routing table del `SKILL.md` (`## Document Routing By Type`).
5. Al final, ofrecé opcionalmente re-sellar el baseline con `bin/audit.js` (preguntá antes).
6. Emitir el bloque manual (`Action Taken` / `Justification` / `Persisted Rule`).

## Diferencia con `:update`

- `:update` solo corre el chequeo y reporta. No edita ni decide.
- `:review` corre el chequeo, decide, aplica los cambios necesarios, y ofrece re-sellar. Es el flujo completo.
