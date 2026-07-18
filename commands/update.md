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

## Después de correr

Por cada `- doc: <path>` en el bloque WARNING, usá la routing table de `SKILL.md` (`## Document Routing By Type`) para confirmar que ese doc es el target correcto. La herramienta detecta referencias, no intent.

Al final, emitir el bloque manual (Action Taken / Justification / Persisted Rule) reflejando qué docs actualizaste (o "None" si el user decidió no actuar).
