---
description: Decide doc-impact after meaningful code, config, CI/CD, security, architecture, API, or workflow changes, route updates to the right files, and avoid activation for cosmetic-only or behavior-neutral edits
argument-hint: (sin argumentos)
allowed-tools: ["Bash", "Read", "Edit", "Grep", "Glob"]
---

# Doc Governance — Root Invocation

Ejecutar el flujo completo de gobierno de documentación del skill.

## Acción

Leé el `SKILL.md` en la raíz del skill (`.claude-plugin/`, `~/.claude/skills/doc-governance-skill/SKILL.md`, o `.ai/skills/doc-governance-skill/SKILL.md` según cómo esté instalado) y seguí la sección `## Root Invocation Behavior`.

## Resumen del flujo (referencia rápida)

1. Corré `bin/update.js` (Update Mode) para chequear drift contra el baseline sellado.
2. Interpretá el bloque `DOC_GOVERNANCE_UPDATE:` — Critical / Warning / Info.
3. Por cada Warning, decidí si el doc referenciado necesita update real o si es un match espurio.
4. Aplicá updates mínimos solo a los docs que lo requieran, siguiendo la routing table del `SKILL.md` (`## Document Routing By Type`).
5. Al final, ofrecé opcionalmente re-sellar el baseline con `bin/audit.js` (preguntá antes).
6. Emitir el bloque manual (`Action Taken` / `Justification` / `Persisted Rule`).

## Nota

Este archivo existe para registrar el slash literal `/doc-governance-skill` en la paleta de Claude Code. El comportamiento canónico y actualizado vive en `SKILL.md`.
