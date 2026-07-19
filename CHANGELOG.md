# Changelog

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

### Deferred to a future release
- Rename-only classifier (detect `sed` A→B applied to N lines of real code).
- Anchor-level report (`X.md:42-58 (section: ## …)`).
- Distinguishing markdown links `](path)` from prose backticks in `extractCodeRefs`.
- Auto-suggest reseal when `map_staleness >= 3`.
- `--include-trivial` flag to escalate INFO trivial back to WARNING.

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
