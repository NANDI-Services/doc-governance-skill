---
description: Revisar cambios, decidir qué docs actualizar, y ofrecer re-sellar el baseline al final. Flujo completo del root skill (audit + update + routing + optional seal).
argument-hint: (sin argumentos)
allowed-tools: ["Bash", "Read", "Edit", "Grep", "Glob"]
---

# Doc Governance — Review (root flow)

Corré el flujo completo de gobierno de documentación: chequear drift, decidir qué docs actualizar, aplicar solo los cambios necesarios, y opcionalmente re-sellar el baseline.

## Acción

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
