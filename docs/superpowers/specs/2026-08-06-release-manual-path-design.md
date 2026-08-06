# Camino manual de release — diseño

**Fecha:** 2026-08-06 · **Versión objetivo:** 0.9.2

## Problema

El 2026-08-06 GitHub Actions entró en `major_outage`. El push de 0.9.1 llegó a `main`, pero ningún workflow arrancó: el tag `v0.9.1` y el GitHub Release quedaron sin publicar, sin forma de destrabarlos.

`release.sh` sólo se puede invocar desde `release.yml`, y `release.yml` sólo se dispara con un push. Sin Actions no hay release, y no hay ruta alternativa.

## Evidencia recogida

Tres hechos medidos en la sesión, no inferidos:

1. **Actions nunca creó la corrida.** `GET /commits/<sha>/check-suites` devolvió 2 suites (`devin-ai-integration`, `socket-security`) y ninguna de `github-actions`. No es que el job falló: el control plane no registró el push. Los workflows estaban `state=active` y Actions `enabled=true` en el repo.

2. **Un runner self-hosted no habría ayudado.** Un runner es un worker que consulta a ese mismo control plane. Si el job nunca se crea, ningún runner lo ve. El failover tampoco dispararía: lo que detectaría el silencio es lo que está caído. Además el repo es público (`visibility=public`), donde GitHub desaconseja runners self-hosted porque un PR desde un fork ejecuta código en la máquina anfitriona.

3. **La distribución sigue `main`, no los tags.** Verificado refrescando el marketplace registrado: bajó `0.9.1`, que es `main` sin taggear. Si siguiera tags habría bajado `0.9.0`. **Los consumidores reciben el código al pushear.** El tag y el Release son metadata para humanos, no el mecanismo de entrega.

El hecho 3 acota el alcance: la caída nunca bloqueó a los usuarios. Lo que quedó pendiente es autonomía, consistencia interna del repo y costo de atención.

## Objetivos

- Poder publicar tag + Release sin depender de Actions.
- Que `main` y el último tag no queden desfasados en silencio.
- Que responder "¿estoy publicado?" no requiera acordarse de nada.

## No-objetivos

- Runner self-hosted (descartado por la evidencia 1 y 2).
- Sacar el release de Actions (cambiaría dependencia de un tercero por dependencia de disciplina propia; Actions funciona casi siempre — falta la salida de emergencia, no reemplazar la puerta).
- Notificaciones o monitoreo de CI.

## Diseño

### Nada de modo dual

`release.sh` ya corre local: usa `git`, `sed`, `gh` y `node`, nada específico de Actions. La identidad de git la configura el workflow en un paso aparte, y `gh` local ya está autenticado. **No hace falta detección de entorno.**

Lo que falta son guardas. En CI el entorno lo garantiza el workflow; en una máquina de desarrollo no. El hazard concreto: el script hace `git add` de `SKILL.md`, `bin/lib/version.js`, `.claude-plugin/plugin.json`, `CHANGELOG.md` y `.doc-governance/map.md` — exactamente los archivos que suelen estar editados. Un árbol sucio se cuela dentro del commit `chore(release):`.

### Preflight

Función al inicio de `.github/scripts/release.sh`, antes de cualquier `sed`. Corre **siempre**, también en CI, para que no se pudra por falta de uso.

| Chequeo | Motivo | En CI |
|---|---|---|
| Rama actual es `main` | Taggear desde otra rama publica algo no revisado | sí |
| Árbol limpio (`git status --porcelain` vacío) | El hazard descrito arriba | sí |
| `main` == `origin/main` | Atrasado → el push falla; adelantado → taggea commits que nadie vio | **no** (tautológico + llamada de red) |
| `gh auth status` ok | Sin esto `gh release create` falla al final, con todo ya commiteado y pusheado | sí |
| `sed --version` reporta GNU | La cabecera del script ya advierte que no es portable a BSD; hoy eso explota confuso a mitad de camino | sí |
| `node` en PATH | El script corre `bin/audit.js` para re-sellar el baseline | sí |

Cada falla sale con exit 1 y un mensaje que dice qué arreglar. El salteo en CI se detecta con `${GITHUB_ACTIONS:-}`.

### `--dry-run`

Corre el preflight, calcula la versión que saldría, imprime el plan y **no muta nada**: sin `sed`, sin `git add`, sin `gh`, sin `node bin/audit.js`.

```
$ bash .github/scripts/release.sh --dry-run
preflight: ok (main, limpio, sincronizado, gh ok, GNU sed, node ok)
último tag: v0.9.0   auto-bump: patch -> 0.9.1
SKILL.md fija 0.9.2 (mayor que el auto-bump) -> se honra
publicaría: v0.9.2  (3 commits desde v0.9.0)
```

El dry-run debe reproducir la regla real de `release.sh`: calcula el auto-bump desde el último tag y, si `SKILL.md` fija una versión mayor, ésa gana. Mostrar sólo el resultado final escondería justo la parte que confunde.

Cuando no hay nada pendiente, lo dice y sale 0.

Existe porque el script **no** es seguro de correr "para chequear": es idempotente sólo cuando no hay trabajo; si lo hay, publica. `--dry-run` es lo que convierte "¿estoy al día?" en una pregunta barata.

### `workflow_dispatch`

Agregar el trigger a `.github/workflows/release.yml`:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

El `if:` del job filtra por `github.event.head_commit.message`. En un disparo manual ese campo es `null` y `contains(null, …)` devuelve `false`, así que el `!` lo deja pasar. **La condición no se toca.**

Sirve para re-lanzar tras una corrida fallida. **No** sirve durante una caída de Actions — es complemento del camino manual, no sustituto.

### Tests

Un camino de emergencia que nunca se ejercita no funciona el día que hace falta, y éste sólo se usaría en una crisis. Caso nuevo en `bin/lib/self-test-update.js`, siguiendo el harness existente (tmpdir + `git init`):

- **`demoReleaseDryRun`** — repo mínimo con `SKILL.md` (con `version:`), `.claude-plugin/plugin.json`, `bin/lib/version.js` y `CHANGELOG.md`, un tag inicial y un commit encima. Asserta que `--dry-run` anuncia la versión objetivo correcta y que **no** modificó ningún archivo ni creó tags.
- **`demoReleasePreflightRefuses`** — mismo repo, con un archivo sucio en el árbol. Asserta exit distinto de 0 y que el mensaje nombra el árbol sucio.

La segunda es la que importa: un preflight que nunca dice que no, no es un preflight.

El test invoca `bash`, disponible tanto en el runner de CI como en Git Bash sobre Windows.

### Versión: 0.9.2

0.9.1 está en `main` sin taggear, así que tienta meter esto ahí y ahorrar un número. No corresponde: la evidencia 3 muestra que los consumidores **ya tienen 0.9.1**. Agregarle cambios dejaría dos árboles distintos llamándose igual — la misma ambigüedad que este repo existe para detectar. El release publicará los dos tags pendientes.

## Archivos afectados

- `.github/scripts/release.sh` — preflight + `--dry-run` + parseo de argumentos.
- `.github/workflows/release.yml` — trigger `workflow_dispatch`.
- `bin/lib/self-test-update.js` — dos casos nuevos.
- `SKILL.md`, `bin/lib/version.js`, `.claude-plugin/plugin.json` — bump a 0.9.2 (los tres en lockstep; `demoVersionFilesAgree` lo custodia).
- `CHANGELOG.md` — sección `## [0.9.2]`.
- `CLAUDE.md` — documentar el camino manual y por qué existe.
- `RELEASE_CHECKLIST.md` — paso de `--dry-run` antes de publicar.

## Verificación

```bash
bash -n .github/scripts/release.sh
bash .github/scripts/release.sh --dry-run          # anuncia v0.9.2, no muta
git status --short                                  # sin cambios tras el dry-run
node bin/lib/self-test-update.js                    # 10 casos
node bin/lib/sync-exclude-dirs.js --check
claude plugin validate .
```

Prueba del preflight en negativo: ensuciar un archivo, correr `--dry-run`, esperar exit 1 con mensaje sobre el árbol sucio.

Prueba end-to-end real: publicar 0.9.2 por el camino manual, comprobando que el tag y el Release quedan creados y que una corrida posterior sale limpia por el guard de tag existente.

## Riesgos

- **Divergencia CI/local.** Se mitiga corriendo el mismo script en ambos: el preflight es común salvo un chequeo, explícitamente marcado.
- **El dry-run se desactualiza respecto del camino real.** Se mitiga con `demoReleaseDryRun`, que corre en CI.
- **Publicar desde una máquina local con estado raro.** Es exactamente lo que el preflight impide; por eso corre antes de cualquier mutación.

## Nota lateral

Este archivo agrega un `.md` al repo, así que entra en el mapa de `.doc-governance`. Conviene re-sellar el baseline en el mismo commit.
