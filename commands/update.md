---
description: Chequear si algún doc menciona código que cambió desde el último baseline sellado
argument-hint: (sin argumentos)
allowed-tools: ["Bash", "Read"]
---

# Update Mode

Corré el chequeo de drift de documentación contra el baseline sellado.

## Acción

Ejecutá:

```bash
node .ai/skills/doc-governance-skill/bin/update.js
```

Path note: ajustá al lugar donde esté instalado (`~/.claude/skills/doc-governance-skill/bin/…` si es global).

## Comportamiento

- Si no hay baseline aún, se auto-crea sellado a `git HEAD` y emite `Info: baseline_auto_sealed` (exit 0, commiteá `.doc-governance/map.md`).
- Si hay baseline, diffea el working tree contra el sealed SHA y emite un `DOC_GOVERNANCE_UPDATE:` con severidades (Critical / Warning / Info) y `SUMMARY:`.
- Exit 1 si hay Warnings; exit 0 clean o Info-only.
- Si el baseline fue sellado por una versión del tool que mide otro conjunto de archivos, emite `baseline_version_drift` como WARNING. No es "está viejo": el reporte cubre un universo de archivos distinto. Re-sellar lo resuelve de una vez.

## Después de correr

Por cada `code_file: <path>` en el bloque WARNING, usá la routing table de `SKILL.md` (`## Document Routing By Type`) para confirmar que los docs listados en su `affected_docs:` son el target correcto. La herramienta detecta referencias, no intent.

Las entradas `carried_from_seal` en INFO no requieren acción: son archivos cuyo contenido el baseline ya escaneó (típicamente el commit que llevó el propio re-sello).

Al final, emitir el bloque manual (Action Taken / Justification / Persisted Rule) reflejando qué docs actualizaste (o "None" si el user decidió no actuar).
