# Changelog

## [0.9.2] - 2026-08-06

Un release que no se puede publicar sin GitHub Actions no es un release: es una dependencia. El 2026-08-06 Actions entró en `major_outage`, el push de 0.9.1 llegó a `main` y ningún workflow arrancó — sin forma de destrabarlo.

### Added
- **`release.sh --dry-run`** — corre el preflight, calcula la versión que saldría, imprime el plan y no toca nada: sin `sed`, sin `git add`, sin `gh`. Reporta **el auto-bump y la versión fijada por separado** (`auto-bump: patch -> 0.9.1` / `Honoring SKILL.md` / `would release: v0.9.5`), porque mostrar sólo el ganador esconde justo la regla que confunde. Existe porque el script **no** es seguro de correr "para chequear": es idempotente sólo cuando no hay trabajo pendiente; si lo hay, publica. Con esto, "¿estoy publicado?" cuesta un comando y no exige acordarse de nada.
- **Preflight en `release.sh`** — verifica rama `main`, `node` en PATH, que `sed` sea GNU, `gh` autenticado, árbol limpio y sincronía con `origin/main`. Corre también en CI, para que no se pudra por falta de uso; sólo el chequeo de sincronía se saltea ahí, donde es tautológico. El árbol limpio y la sincronía son *soft* en `--dry-run`: avisan en vez de abortar, así el dry-run sigue siendo útil con trabajo a medio hacer. El hazard concreto que cubre: el script hace `git add` de `SKILL.md`, `bin/lib/version.js`, `.claude-plugin/plugin.json`, `CHANGELOG.md` y `.doc-governance/map.md` — justo los archivos que un maintainer suele tener abiertos, que se colarían en el commit `chore(release):`.
- **`workflow_dispatch` en `release.yml`** — para re-lanzar una corrida que falló. Documentado explícitamente como **no** remedio ante una caída de Actions: un dispatch lo agenda el mismo control plane que estaría caído. Para ese caso, el camino local. El `if:` del job no se tocó: en un dispatch `github.event.head_commit` es `null` y `contains(null, …)` da `false`.
- **Dos casos de self-test** para el camino de emergencia, que sólo se usaría en una crisis — el peor momento para descubrir que está roto. `demoReleaseDryRun` verifica que anuncia la versión correcta (con una versión fijada que le gana al auto-bump) y que no deja ni un archivo ni un tag tocado; `demoReleasePreflightRefuses` verifica que **se niega** ante un árbol sucio y aborta antes de calcular nada. Un preflight que nunca dice que no, no es un preflight.

### Fixed
- **Los self-tests no estaban aislados de los git hooks globales.** Con `core.hooksPath` configurado a nivel usuario, cada commit de cada fixture disparaba los hooks del maintainer — en la máquina donde se escribió esto, un rebuild de graphify en background que además escribía `graphify-out/` dentro del repo temporal. Se detectó porque rompió el aserto "el dry-run no modificó nada". Ahora cada repo de prueba apunta `core.hooksPath` a un directorio inexistente.

### Notes
- Evidencia medida durante la caída, para no re-investigarla: Actions **nunca creó la corrida** (`/check-suites` del commit devolvió `devin-ai-integration` y `socket-security`, ninguna de `github-actions`), así que un runner self-hosted no habría ayudado — un runner consulta a ese mismo control plane, y el failover lo dispararía justamente lo que está caído. Además el repo es público, donde GitHub desaconseja runners self-hosted.
- **La distribución sigue `main`, no los tags.** Verificado refrescando el marketplace registrado: bajó `0.9.1`, que es `main` sin taggear. Los consumidores reciben el código al pushear; el tag y el Release son metadata. Por eso la caída nunca los bloqueó, y por eso 0.9.1 se publica como tag propio en vez de absorberse acá: para la distribución ya salió, y dos árboles distintos llamándose igual es la ambigüedad que este skill existe para detectar.
- Diseño completo en `docs/superpowers/specs/2026-08-06-release-manual-path-design.md`.

## [0.9.1] - 2026-08-06

0.9.0 made a stale **baseline** impossible to miss. This closes the twin hole it left untouched: knowing **which copy of the skill is running**. Found by auditing a real install right after shipping 0.9.0.

### Added
- **`bin/which.js`** — enumerates every installed copy (plugin cache globbed by marketplace, `~/.claude/skills/`, `.ai/`, `.agents/`, plus its own root), dedupes by `fs.realpathSync`, and prints the one with the **highest version**. `--verbose` lists them all and warns when several coexist; exit 1 when none is found, so callers can fall back. Reuses `parseSemver` / `compareSemver` from `bin/lib/version.js` rather than reimplementing comparison. Why: `SKILL.md`'s root-discovery step used `find … | head -1`, which returns whatever the filesystem lists first — not the newest. Verified on a live machine: two copies coexisted (`~/.claude/skills/…` at 0.9.0 via symlink, plugin cache at 0.8.0) and `head -1` resolved to **0.8.0**, so the agent read 0.9.0's `SKILL.md` and executed 0.8.0's `bin/`. Same mechanism as the SGG incident. Note the asymmetry this protects: the 0.9.0 baseline guard lives in the code, so it only fires if the copy that runs has it — resolving the right copy is a precondition for the guard, not a nicety.
- **`--version` on `bin/audit.js` and `bin/update.js`** — prints `doc-governance-skill <version> (<absolute root>)`. The path is the half that matters: with several copies installed, a version number alone does not say which one produced the output. Handled before any other work, so asking never auto-bootstraps a baseline as a side effect.
- **`tool_version:` in the Update report header**, always. Until now the running version appeared *only* inside a drift entry, so in the normal case there was no way to trace a report back to its copy. Shows `tool_version: 0.9.1` when baseline and tool agree, `tool_version: 0.9.1 (baseline sealed with 0.8.0)` when they do not. `bin/audit.js` likewise prints the sealing copy on completion.
- **Two self-test cases**: `demoWhich` (plants an old and a new copy in a tmpdir with the *old one first* — the exact ordering `head -1` got wrong — and asserts the new one wins, that `--verbose` flags the coexistence, and that an empty tree exits 1) and `demoVersionFilesAgree` (the three version files must match).

### Changed
- **`.claude-plugin/plugin.json` carries `version`**, so `claude plugin list` stops reporting `Version: unknown`. `release.sh` rewrites it alongside `SKILL.md` and `bin/lib/version.js` — three `sed`s in lockstep now, guarded by `demoVersionFilesAgree`.
- **`.claude-plugin/marketplace.json` gained a `description`.** With that and the `version` above, `claude plugin validate .` passes with **zero warnings** (it reported two). `RELEASE_CHECKLIST.md` now demands a clean run instead of tolerating a known warning.
- **`commands/review.md` no longer duplicates the root-discovery snippet** — it points at `SKILL.md`, which is the canonical block. Same single-source treatment `EXCLUDE_DIRS` got in 0.9.0; the duplicated copy was already drifting.

## [0.9.0] - 2026-08-06

Baseline integrity release. All three items come from a real session in a consumer repo (SGG, 2026-07-26 → 2026-08-06).

### Added
- **`bin/lib/version.js`** — single source of truth for `TOOL_VERSION`, plus `SCAN_UNIVERSE_VERSIONS`: the releases at which the *set of scanned files* changed. `release.sh` now seds this file instead of `bin/audit.js`.
- **Baseline version guard in `bin/update.js`** — the map header has recorded `tool_version:` since v1 of the format and **nothing ever read it back**. It does now. A mismatch is INFO `baseline_version_drift`; a mismatch that crosses a scan-universe change is a **WARNING** (exit 1), because the baseline is not merely stale — it maps a different set of files. Unparseable or absent versions emit INFO `baseline_version_unknown`. Direction-agnostic: an *older* tool run against a *newer* map is the same failure. Why it matters: in SGG a baseline sealed by a cached 0.5.7 copy — installed in parallel with 0.8.0 under `~/.claude/plugins/cache/…` — mapped 294 docs, 257 of them machine-local files that 0.7.0's `EXCLUDE_DIRS` should have skipped. Eleven days of results that differed by whoever ran the check, noticed only when a re-seal deleted 4451 lines. The detecting datum sat in the file header the entire time.
- **`sealed_dirty:` in the map header** (`bin/lib/scan.js`, `bin/lib/dirty.js`, `bin/audit.js`) — content hash of every path whose worktree state differs from `HEAD` at seal time. Additive to the `v1` format; older parsers skip it.
- **INFO `carried_from_seal` in `bin/update.js`** — fixes the reseal paradox. `audit.js` scans the **worktree** but seals **`git HEAD`**, so everything uncommitted at seal time was pre-baked drift: the commit carrying the fresh map got reported against the baseline it had just established (reproduced: seal at `9dc5c5e`, commit `b9b8174`, 2 warnings about the reseal's own files). "Freshly re-sealed, clean" was structurally unreachable, which trains people to ignore warnings. Now a changed path whose content still matches `sealed_dirty:` drops to INFO. Matched by **content**, never by commit membership — membership-based suppression would stay suppressed after a later real edit, a silent false negative. Skipped under `--since` / `--files` / stdin, where the baseline is a different ref.
- **`bin/lib/sync-exclude-dirs.js`** — generates the exclusion-dirs sentence in `SKILL.md` from `EXCLUDE_DIRS`, with `--check` (CI) and `--fix`. CRLF-normalized, so the gate cannot pass on the runner and fail on a Windows worktree.
- **`.github/workflows/ci.yml`** — runs the sync check and both self-tests on push and PR. They previously ran **nowhere**; `release.yml` was the only workflow. Deliberately does *not* gate on `.doc-governance/map.md` freshness: any `.md` edit changes the inventory, so that check would sit permanently red.
- **Four self-test cases** in `bin/lib/self-test-update.js`: version drift crossing a universe change (WARNING), version drift not crossing one (INFO), the re-seal repro (clean commit **and** a later genuine edit warning again), and `sync-exclude-dirs` in both directions.

### Fixed
- **`SKILL.md` exclusion list was two weeks stale** — it omitted `.agents`, `.claude` and `graphify-out`, added to `EXCLUDE_DIRS` in 0.7.0. `CLAUDE.md` carried the same stale copy. The list lives in prose rather than as path-refs, so the skill provably could not flag it — precisely the case its own `## Known Limitations` describes. `SKILL.md` is now generated from the code and `CLAUDE.md` points at it instead of duplicating it.
- **`README.md` update-mode example** showed the pre-0.6.0 report shape (`- doc:` / `referenced_code_changed:`), wrong for three releases. Same stale shape in `SKILL.md`'s Update Mode prose. Both now show `code_file:` / `affected_docs:` / `diff_sample:`.
- **`parseMap` treated a missing SHA as the literal string `(none)`**, which then failed `isSafeGitRef` and crashed update mode outside a git repo. Now normalized to `null`.
- **git's `core.autocrlf` warnings no longer bury the report on Windows.** Every read-only git query in `bin/update.js` and `bin/lib/diff-classify.js` now discards stderr — one "LF will be replaced by CRLF" line per changed file was printed above the output, which made a zero-warning run look alarming. Both call sites already discarded failures in their `catch`, so no diagnostic is lost.

### Changed
- **`release.sh` re-seals the baseline on every release** — runs `node bin/audit.js` *after* the version seds and the CHANGELOG rewrite, then commits `.doc-governance/map.md` with the release. Order is load-bearing: the still-uncommitted version files land in `sealed_dirty:`, so the release commit reports zero warnings. This repo stops needing manual attention to the very bug the skill detects, and the release pipeline doubles as the end-to-end test of `carried_from_seal`.
- **Auto-bootstrapped maps record the real `TOOL_VERSION`** instead of the `update-bootstrap` sentinel, which nothing consumed and which defeated the new version guard. The bootstrap fact is still surfaced by the existing `baseline_auto_sealed` INFO.
- **`RELEASE_CHECKLIST.md`** gains the version/changelog steps it never had (though `release.sh` has always treated `SKILL.md` `version:` as load-bearing), the generated-content checks, and a baseline-integrity section.

### Notes
- The version-drift WARNING is intentionally blocking. One re-seal clears it permanently, and until then every per-file result in the report is measured against the wrong file set.
- `git hash-object` skips clean filters, so under `core.autocrlf=true` these hashes do not equal the committed blob. Irrelevant by construction: both the seal side and the check side hash raw worktree bytes through the same helper.

## [0.8.0] - 2026-07-24

### Added
- **`.doc-governance/ignore`** — per-repo glob list (gitignore-lite: `*`, `**`, trailing `/`, `#` comments). Excludes both `.md` docs (drop out of the map) and code files (their changes stop triggering warnings). Addresses the top-ROI item from the SGG-session feedback: substring-grep on paths generates 30–50% noise from ephemeral planning docs (`docs/plans/**`, `Task*.md`) and third-party skill drops. Committable example at `templates/doc-governance-ignore.example`. Parser lives in `bin/lib/ignore.js` (zero-dep, ~40 lines).
- **`bin/lib/self-test-update.js`** grows a second case (`demoIgnore`): asserts an ignored doc drops from the map AND that its code refs stop firing warnings, while a non-ignored doc/code pair still warns as expected.

### Changed
- **`SKILL.md` opens with `## How Detection Works`** — states upfront that detection is substring-matching (not semantic), warns that it over-reports by design, and points to `.doc-governance/ignore` as the noise reducer. Addresses feedback: "un usuario nuevo espera detección semántica y se frustra rápido".
- **`## Root Invocation Behavior > Flujo steady-state`** shortens the reseal prompt from a 6-line explanatory block ("¿Querés que saque una foto nueva? / Qué significa esto / Para qué sirve / ...") to a single `Reseleo baseline? [Y/n]` line (default yes). Preserves explicit consent (the "regla de oro" of user-empowerment) while killing the friction that was pushing users to skip it. Feedback in the SGG session showed users were accepting the reseal anyway — the ceremonial explanation was the actual cost.
- **Version bumped manually** (feature-scope): `SKILL.md`, `bin/audit.js` `TOOL_VERSION` → `0.8.0`.

### Notes
- Explicit-anchor opt-in (`<!-- gov:track path="..." -->`) deferred: is a contract change that only pays off once users hit the ignore-list ceiling. Revisit if noise persists after 0.8.0.
- Prose/symbol drift detection remains out of scope — see `## Known Limitations` for the manual grep complement.

## [0.7.0] - 2026-07-21

### Changed
- **`bin/lib/scan.js` `EXCLUDE_DIRS`** now skips `.agents/`, `.claude/`, and `graphify-out/` when building the map. Third-party skill/plugin drops (`.agents/skills/**`, `.claude/skills/**`, `.claude/plugins/**`) and Graphify snapshots describe upstream tools, not the host repo — matching their `SKILL.md`/`README.md` as `affected_docs` was 100% false-positive noise. Verified in a real session (Almacen repo, 2026-07-20): 4 of 8 warnings were third-party skill READMEs.
- **`bin/update.js` already-synced detection**: when every doc referencing a changed code file was also edited in the same diff-range, downgrade from WARNING to a new INFO subtype `already_synced_in_diff_range` instead of firing a spurious warning. WARNING entries also gain an optional `also_touched_in_range:` field so partial overlaps are traceable. Kills the "you edited CHANGELOG.md in the same commit but I still warn about it" class of false-positive.
- **`bin/update.js` trivial change output** no longer lists per-doc paths under `affected_docs_if_substantive` for `comment-only`/`whitespace-only` changes. Emits a single `affected_docs_count: N (suppressed; kind implies no action needed)` line instead — was up to 18 doc paths for one comment tweak.

### Added
- `bin/lib/self-test-update.js`: zero-framework smoke that spins a tmpdir with `git init`, plants a doc↔code pair, edits both in the working tree, and asserts the report emits `already_synced_in_diff_range` with zero warnings. Run with `node bin/lib/self-test-update.js`.

### Notes
- Sub-decisions declined (deferred to Backlog with activation criteria): heading-context downgrade for changelog/roadmap prose mentions, `--reseal-if-clean` CLI flag, file:line snippets in `suggested_action`. See `ROADMAP.md ## Deferred Backlog`.

## [0.6.2] - 2026-07-21

- feat: add support for detecting symbol drift and enhance CHANGELOG validation

## [0.6.1] - 2026-07-19

- chore: update changelog and roadmap for v0.6.0 release details

## [0.6.0] - 2026-07-19

### Added
- **Diff-aware classifier** (`bin/lib/diff-classify.js`): each changed code file is inspected with `git diff --unified=3` and classified as `whitespace-only`, `comment-only`, or `substantive`. Trivial changes are downgraded from WARNING to INFO so cosmetic edits (comment tweaks, indentation, `sed` rename over comments) no longer flood the report. Comment regexes seeded for `.js/.ts/.jsx/.tsx/.py/.rb/.sh/.yml/.prisma/.go/.rs/.java/.cs/.html/.sql/.css/…` and family.
- **Root-cause grouping**: WARNING output is now keyed by code file (`code_file: X`, `affected_docs: [d1, d2, …]`) instead of by doc. One `sed` on a shared file produces one entry, not N.
- **Inline diff samples**: each substantive WARNING carries a 2-3 line `diff_sample:` block with the actual `+`/`-` lines that triggered it, so the operator can decide without a context switch.
- **Rename detection**: uses `git diff --name-status --find-renames`. Renamed files are reported as INFO (`renamed: A -> B`, with `affects: [...]`) instead of firing a spurious WARNING for the deleted path.
- **Self-test** for the classifier: `node bin/lib/diff-classify.self-test.js` — no frameworks, inline fixtures.

### Changed
- **Exit code semantics**: `update.js` now returns 1 only when there are substantive WARNINGs. Trivial (comment/whitespace-only), renames, auto-bootstrap and map-staleness are INFO and return 0 — informational, non-blocking.
- **Report shape**: WARNING entries use `code_file` / `affected_docs` / `diff_sample` (not `doc` / `referenced_code_changed`). CRITICAL still reserved for a future anchor-removal signal.

## [0.5.7] - 2026-07-19

- fix: update actions/checkout version to a specific commit for stability

## [0.5.6] - 2026-07-19

### Added
- `## Activation Signals` en `SKILL.md` expandido con frases naturales de fin de sesión: "actualizá docs", "revisá docs", "chequeá docs impact", "update docs", etc. El skill ahora activa por intent en el 80% de los casos comunes sin necesidad de tipear el slash literal.
- Cold-start guard en `SKILL.md` (`## Root Invocation Behavior`) para el path intent-activated (antes solo estaba en `commands/review.md` para el path slash). Ahora ambos paths ahorran tokens en la primera invocación por repo.

### Changed
- `## Root Invocation Behavior` de `SKILL.md` limpiado: sacado el preámbulo con topología de install desactualizada (era de la era pre-v0.5.4). El título ya no incluye el slash porque el flujo aplica tanto por slash como por intent.
- `README.md` documenta la activación por lenguaje natural como feature diferencial del skill.

## [0.5.5] - 2026-07-19

### Fixed
- Cold-start de `/doc-governance-skill:review` consumía ~7k-14k tokens de Claude para hacer un bootstrap que Node puede resolver solo (~50 tokens). El thin wrapper forzaba a Claude a leer `SKILL.md` completo y ejecutar el flujo agentic Root Invocation Behavior aunque no había drift para reportar (baseline recién sellado).

### Changed
- `commands/review.md` ahora tiene un **cold-start guard** al inicio: chequea si existe `.doc-governance/map.md` ANTES de leer `SKILL.md`. Si no existe: corre `bin/audit.js` (Node local), le dice al user que commitee y re-invoque, y hace STOP. Si existe: sigue con el flujo agentic normal.
- Reducción de costo esperada en primera invocación por repo: ~10x (de ~10k a ~700 tokens).

## [0.5.4] - 2026-07-19

### Added
- `commands/review.md` → registra el slash literal `/doc-governance-skill:review` para el root flow (audit + update + routing + optional re-seal). Ahora la paleta muestra los dos comandos explícitos: `:review` (flujo completo) y `:update` (drift check solo). Evita la colisión de nombres que rompió v0.5.2 renombrando el archivo — no `commands/doc-governance-skill.md` sino `commands/review.md`.

### Changed
- Docs corregidas: la limitación documentada en v0.5.3 ("no se pueden tener ambos slashes al mismo tiempo") era falsa. Se pueden tener los dos slashes literales, solo hay que evitar la colisión de nombre entre el commands file y el plugin. Trade-off entre plugin y skills.sh reformulado alrededor de este hecho.

## [0.5.3] - 2026-07-19

### Fixed
- Revertir el intento de v0.5.2 de restaurar `commands/doc-governance-skill.md`: los archivos en `commands/` de un plugin son SIEMPRE namespaceados como `<plugin>:<filename>`, así que el archivo producía `/doc-governance-skill:doc-governance-skill` (colisión de nombres) en vez del slash unqualified que queríamos. No hay forma dentro de la ruta plugin de exponer un slash literal `/doc-governance-skill` — es diseño del CLI de Claude Code.

### Changed
- Documentación honesta del trade-off entre las dos rutas de distribución:
  - **Plugin path** (`claude plugin install`): expone `/doc-governance-skill:update` como slash literal; el root skill (SKILL.md) activa por intent, no aparece en la paleta como slash.
  - **skills.sh path** (`npx skills add`): expone `/doc-governance-skill` como slash literal (installed as user-scope skill); el sub-modo `update` no aparece como slash, activa por intent.
  - Elegir según prioridad: sub-slash literal para drift check → plugin; slash raíz literal → skills.sh; ambos slashes literales al mismo tiempo → no es posible con la arquitectura actual del CLI.

## [0.5.2] - 2026-07-19

### Fixed
- Restaurar `commands/doc-governance-skill.md` (borrado por error en v0.4.0). El plugin loader de Claude Code carga el `SKILL.md` de la raíz como skill invocable-por-intent pero NO crea el slash literal `/doc-governance-skill` en la paleta. La assumption de v0.4.0 ("auto-registered root skill = literal slash") era falsa. Solo el archivo bajo `commands/` registra el slash literal. Verificado end-to-end en `C:\Users\ezesc\Github\SGG`: tras `plugin install` limpio (con `.bak` + bundles per-repo removidos) solo aparecía `/doc-governance-skill:update`, nunca el root.

## [0.5.1] - 2026-07-19

- docs: clarify the two-step installation process and its purpose in README.md

## [0.5.0] - 2026-07-18

### Fixed
- `claude plugin install NANDI-Services/doc-governance-skill` (the "canonical" one-liner introduced in v0.4.0) never worked. Claude Code's [`plugin install` CLI](https://code.claude.com/docs/en/plugins-reference#plugin-install) only resolves plugin names against configured marketplaces — a bare `owner/repo` reference is never accepted. The real install is a two-step flow: `claude plugin marketplace add <owner>/<repo>` (requires `.claude-plugin/marketplace.json` in the repo) then `claude plugin install <plugin>@<marketplace>`.

### Added
- `.claude-plugin/marketplace.json`: self-referencing single-plugin marketplace named `nandi-services`, with one entry (`doc-governance-skill`, `source: "./"`) pointing at the same tree. Makes `claude plugin marketplace add NANDI-Services/doc-governance-skill` actually succeed against this repo.

### Changed
- `README.md`: Quick Start, Installation, ES palette paragraph, Validate Discovery, and Lessons Learned all rewritten around the two-step install (`marketplace add` then `install doc-governance-skill@nandi-services`).
- `CLAUDE.md` Dual Distribution section retitled "two-step install, both surfaces"; keeps the auto-register mechanism intact (Claude Code v2.1.142+ still auto-loads root `SKILL.md` as a single-skill plugin after install).
- `SKILL.md` Root Invocation Behavior updated so the agent no longer instructs users to run the broken one-liner.

## [0.4.0] - 2026-07-18

### Changed
- Installation unified into a single canonical command: `claude plugin install NANDI-Services/doc-governance-skill`. Registers both plugin (literal `/doc-governance-skill:update` sub-slash) and skill (`/doc-governance-skill` auto-registered from root `SKILL.md`).
- `README.md` Installation section rewritten around the single command. `npx skills add` documented as fallback. `install.sh`/`install.ps1` relabeled as "Team bundling (optional)".
- `CLAUDE.md` Dual Distribution reflects the auto-register mechanism (Claude Code v2.1.142+): a plugin with `SKILL.md` at root, no `skills/` dir, and no `skills` manifest field is auto-loaded as a single-skill plugin.
- `SKILL.md` Root Invocation Behavior updated to describe the new install topology.
- `.github/scripts/release.sh` made CHANGELOG-idempotent: skips prepend when the version entry already exists (allows manual bumps without duplicate entries), and skips the release commit when nothing is staged.

### Removed
- `commands/doc-governance-skill.md` — content was duplicated with `SKILL.md`'s `## Root Invocation Behavior` section and it collided with the plugin auto-register of the root `SKILL.md`. The root slash is now sourced from `SKILL.md` alone.

## [0.3.1] - 2026-07-18

- Merge branch 'main' of https://github.com/NANDI-Services/doc-governance-skill
- feat: enhance documentation and installation scripts for dual distribution as skill and plugin

## [0.3.0] - 2026-07-18

- chore: re-seal doc-governance baseline
- feat: auto-bootstrap baseline in update mode + doc-governance fixes [minor]

## [0.2.3] - 2026-07-18

- docs: add CLAUDE.md for guidance on repository usage and conventions

## [0.2.2] - 2026-07-18

- docs: add 'Lessons Learned' section to README

## [0.2.1] - 2026-07-18

- fix: add missing skills.sh badge to README

## [0.2.0] - 2026-07-18

- fix: update release workflow to use RELEASE_TOKEN instead of GITHUB_TOKEN
- fix: add 'graphify-out/' to .gitignore to prevent tracking of generated output
- feat: implement automated release pipeline with version bumping and changelog updates
- Add initial documentation for Agent Roadmap Sync Rules and ROADMAP
- Refactor skill name to 'doc-governance-skill' across documentation and scripts for consistency

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions after
v0.2.0 are appended automatically by `.github/workflows/release.yml` on
every push to `main`.

Bump strategy on auto-release:

- Default: patch bump.
- Include `[minor]` in any commit message since the last tag to force a minor bump.
- Include `[major]` (or `BREAKING CHANGE`) to force a major bump.
- Include `[skip release]` in the HEAD commit message to skip the workflow entirely.

## [0.2.0] - 2026-07-17

### Added
- Dual-mode executables: `bin/audit.js` seals a documentation baseline to `.doc-governance/map.md` with the current `git HEAD` SHA; `bin/update.js` diffs the working tree against the sealed SHA and emits a `DOC_GOVERNANCE_UPDATE:` punch list with three severity tiers (Critical reserved / Warning code drift / Info map staleness).
- `bin/lib/scan.js` shared scanner: extracts H1 title, H1-H3 heading tree, and code references (backtick paths + fenced blocks with `path=`) from every `*.md` in the repo, in deterministic order.
- Non-blocking staleness check in `templates/pre-commit-doc-check.sh` warns when `.md` files changed since the sealed SHA.
- New `SKILL.md` sections: `Audit Mode`, `Update Mode`, and a `Drift Categories Monitored` table.
- `README.md`: `Positioning vs Alternatives` and `Two-Mode Operation` sections with concrete commands and example output.
- `RELEASE_CHECKLIST.md`: `Dual-Mode Executables (v0.2+)` validation block.
- `ROADMAP.md`: `Deferred Backlog (v0.3+)` section listing explicit out-of-scope items for v0.2.
- Automated release pipeline: `.github/workflows/release.yml` + `.github/scripts/release.sh` bump version, prepend changelog, tag, and publish a GitHub release on every push to `main`.

### Changed
- `install.sh` and `install.ps1` now copy `bin/` alongside `SKILL.md` and `templates/` into `.ai/skills/doc-governance-skill/`.
- `templates/AGENTS.append.md` documents both modes inside the managed marker block.
- `SKILL.md` frontmatter declares `version: 0.2.0`.

## [0.1.0] - 2026-07-17

### Added
- Initial release: declarative `SKILL.md` with routing table (README/AGENTS/SECURITY/CHANGELOG/ARCHITECTURE/OPERATIONS/TROUBLESHOOTING/API/docs) and minimal three-line completion block.
- `install.sh` / `install.ps1` / `uninstall.sh` with marker-delimited `AGENTS.md` block management.
- `templates/AGENTS.append.md` and non-blocking `templates/pre-commit-doc-check.sh` reminder hook.
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE`, and `RELEASE_CHECKLIST.md` publication scaffolding.
- `ROADMAP.md` with product north star, exit criteria, and RoadmapSmith-managed phased backlog.
