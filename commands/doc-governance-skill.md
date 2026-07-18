---
description: Revisar impacto en documentación tras cambios y opcionalmente sellar un baseline nuevo (te pregunta antes)
argument-hint: (sin argumentos)
allowed-tools: ["Read", "Grep", "Glob", "Edit", "Bash", "AskUserQuestion"]
---

# doc-governance-skill — Root

Flujo de gobernanza de documentación después de cambios meaningful (código, config, CI/CD, seguridad, arquitectura, API, workflow). Empoderá al user: nunca ejecuta acciones destructivas sin confirmación explícita.

## Paso 1 — Flujo manual de decisión

1. Inspeccioná los cambios reales del working tree / último commit (`git status`, `git diff --stat`, `git log -1`).
2. Decidí, usando la routing table de `SKILL.md` (`## Document Routing By Type`), qué doc(s) impactó — o `None` si el cambio es cosmético/behavior-neutral.
3. Editá solo las secciones impactadas de los docs correctos. No reescribas por reescribir.
4. Emití al final el bloque:

   ```
   Action Taken: [doc(s) actualizados o None]
   Justification: [una oración clara]
   Persisted Rule: [regla persistida o None]
   ```

## Paso 2 — Ofrecé sellar baseline nuevo (con confirmación en lenguaje llano)

Antes de tocar `.doc-governance/map.md`, preguntá al user con este mensaje (sin jerga técnica):

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

Datos que tenés que obtener antes de mostrar el mensaje:
- Estado de `.doc-governance/map.md`: `sealed_sha:` y `sealed_at:` si existe.
- Commit actual: `git rev-parse --short HEAD`.

## Paso 3 — Ejecutar según respuesta

- **Sí** → correr `node .ai/skills/doc-governance-skill/bin/audit.js` (o `~/.claude/skills/doc-governance-skill/bin/audit.js` si es install global). Después avisar de commitear `.doc-governance/map.md`.
- **No** → cerrar sin acción. No tocar `.doc-governance/`.

## Regla de oro

La skill empodera al user, no lo reemplaza. Nunca corras audit sin confirmación explícita en esta ruta. Para chequeo de drift SIN razonamiento previo ni oferta de baseline, el user usa `/doc-governance-skill:update`.
