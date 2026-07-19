# repo-doc-governance

[![skills.sh](https://skills.sh/b/NANDI-Services/doc-governance-skill)](https://skills.sh/NANDI-Services/doc-governance-skill)

Installable documentation-governance skill for the skills.sh ecosystem.

Canonical skill ID: `doc-governance-skill`.

## Quick Start
1. Install (add the marketplace, then install the plugin):
```bash
claude plugin marketplace add NANDI-Services/doc-governance-skill
claude plugin install doc-governance-skill@nandi-services
```
   Registers both the plugin (`/doc-governance-skill`, `/doc-governance-skill:update`) and the skill from the same tree.
2. Run it after a meaningful repository change.
3. Apply only the document updates routed by the skill.
4. End with the required minimal output block.

Example output shape:
```text
Action Taken: Multiple
Justification: API auth flow and deployment workflow changed.
Persisted Rule: Updated security and operations doc routing guidance.
```

## What Problem This Solves
Teams often over-update or under-update docs after implementation work. This skill gives agents a deterministic review flow to decide:
- whether docs must change
- which document should be updated
- what minimal completion report should be emitted

The goal is accurate documentation with minimal churn.

## Positioning vs Alternatives
Other doc-drift tools stop at detection. This skill was built around three specific choices:

- **Persisted, SHA-sealed baseline.** The audit mode produces `.doc-governance/map.md` and seals it with the current `git HEAD`. Update runs diff against that exact SHA — no ambient state, reproducible on any machine that has the commit.
- **Routing to canonical docs, not just alerts.** When a doc references code that changed, the report names the doc *and* points to the routing table (`README.md`, `SECURITY.md`, `API.md`, `docs/**`, etc.) so the fix has a destination, not just a signal.
- **Minimal, reproducible completion format.** Every run emits the same three-line completion block (`Action Taken` / `Justification` / `Persisted Rule`) — trivially parseable and stable across releases.

## Why This Skill
Manual doc review is inconsistent and often noisy. This skill gives a deterministic routing flow that:
- standardizes what counts as a meaningful change
- maps impact to the correct document(s)
- avoids over-updating unrelated files
- improves review quality with a minimal, repeatable completion format

## Agent / IDE Compatibility
This repository is designed to be installed as a Claude Code plugin (which auto-registers the bundled skill) and consumed by any agent environment that reads a root-level `SKILL.md` with YAML frontmatter.

Primary target:
- Claude Code `claude plugin install ...`

Also discoverable via skills.sh (`npx skills add ...`) as a skill-only install — see the Installation section for the trade-off.

## Repository Structure
- `SKILL.md`: skill metadata and governance logic (skills.sh manifest; also auto-registered as the plugin's root skill `/doc-governance-skill`)
- `.claude-plugin/plugin.json`: Claude Code plugin manifest (v0.4+)
- `commands/update.md`: update slash-command spec (`/doc-governance-skill:update`)
- `bin/audit.js`, `bin/update.js`, `bin/lib/scan.js`: zero-dependency Node runtime (audit + update modes)
- `SECURITY.md`: security disclosure process and hardening policy
- `CONTRIBUTING.md`: contribution expectations and validation baseline
- `CODE_OF_CONDUCT.md`: collaboration and behavior expectations
- `install.sh`: local installer for Unix-like environments
- `install.ps1`: local installer for Windows PowerShell
- `uninstall.sh`: local uninstaller for Unix-like environments
- `templates/AGENTS.append.md`: managed marker block inserted into `AGENTS.md`
- `templates/pre-commit-doc-check.sh`: optional non-blocking pre-commit reminder
- `RELEASE_CHECKLIST.md`: practical publication checklist
- `LICENSE`: open-source license for public distribution

## Installation

### Canonical: add the marketplace, then install

```bash
claude plugin marketplace add NANDI-Services/doc-governance-skill
claude plugin install doc-governance-skill@nandi-services
```

Two commands, one flow. Claude Code's [plugin install CLI](https://code.claude.com/docs/en/plugins-reference#plugin-install) resolves plugin names from configured marketplaces — a bare `owner/repo` reference is never accepted. This repo publishes its own single-plugin marketplace (`.claude-plugin/marketplace.json`, named `nandi-services`) so both steps target the same tree.

#### Why two commands?

Claude Code separates **catalog registration** from **plugin install** on purpose:

- **`marketplace add` = register a catalog.** A marketplace is a `marketplace.json` that lists one or many plugins ([official docs](https://code.claude.com/docs/en/plugin-marketplaces): *"To publish multiple plugins under one marketplace name, list them all in a single `marketplace.json`"*). The catalog can even point at plugins hosted in **other** repos — marketplace source and plugin source are independent.
- **`install <plugin>@<marketplace>` = pick a plugin from an already-trusted catalog.** Trust is granted once at `marketplace add`; each individual install is a smaller decision on top of that trust.
- **Not a repo choice — a CLI design choice.** The `plugin install` argument grammar is `plugin-name` or `plugin-name@marketplace-name` ([plugins-reference](https://code.claude.com/docs/en/plugins-reference#plugin-install)); `owner/repo` is not in the grammar. Any repo — one plugin or fifty — installs the same way.

In this repo the marketplace has exactly one plugin, so the two steps look redundant. They're not: they're the same shape every Claude Code plugin uses. If you want a real one-liner and are OK giving up the literal `/doc-governance-skill:update` sub-slash, see the [skills.sh fallback](#skillssh-fallback) below.

After install:

- **Plugin** → the `/doc-governance-skill:update` sub-slash appears literally in the palette.
- **Skill** → the root `SKILL.md` is auto-loaded as `/doc-governance-skill` (see [Claude Code plugin docs](https://code.claude.com/docs/en/plugins-reference#skills): a plugin whose root is a `SKILL.md` becomes a single-skill plugin automatically — no `skills` field in `plugin.json` needed). The agent also activates it by intent (audit, drift check, etc.).

### Team bundling (optional)

For teams that want the skill to travel **inside a specific repo** (patches the repo's `AGENTS.md` with a marker-delimited block, copies runtime into `<repo>/.ai/skills/doc-governance-skill/`), use the local installer:

Linux/macOS:
```bash
chmod +x install.sh uninstall.sh
./install.sh
```

Windows PowerShell:
```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

This is **not** an alternative to the user-level install above — it's a separate scenario (bundling for your team's repo).

### skills.sh (fallback)

skills.sh also lists this project and its install-count badge is fed by that telemetry. The direct command still works:

```bash
npx skills add NANDI-Services/doc-governance-skill
```

Trade-off: this path registers **only** the skill (no `/doc-governance-skill:update` literal slash). The update sub-mode still activates by intent. Prefer `claude plugin install` unless you specifically want a skills.sh-only install.

## Usage Example
After implementing a meaningful repository change, run the skill and follow its output format:

```text
Action Taken: Multiple
Justification: CI workflow and deployment commands changed, requiring README and OPERATIONS updates.
Persisted Rule: Updated CI/CD and operations documentation routing rules.
```

## Two-Mode Operation
The skill ships two executable modes invoked by human intent — no runtime slash-command registration required. Both scripts are pure Node with no npm dependencies.

**Audit** (heavy, occasional) — run once to seal a baseline of the repo's documentation structure and code-doc references:
```bash
node .ai/skills/doc-governance-skill/bin/audit.js
git add .doc-governance/map.md && git commit -m "Seal doc-governance baseline"
```

**Update** (lightweight, per-change) — diff the current working tree against the sealed SHA, cross-reference changed paths against the map, and emit a drift punch list:
```bash
node .ai/skills/doc-governance-skill/bin/update.js
```

On the first run without `.doc-governance/map.md`, Update auto-creates the baseline sealed to current `git HEAD` and emits an `Info: baseline_auto_sealed` entry — commit the map to persist it. Subsequent runs diff against that SHA.

Update accepts optional overrides: `--since <ref>` (diff against a different git ref), `--files a,b,c` (skip git diff, use an explicit file list), or stdin (`git diff --name-only | update.js`).

Path note: both commands assume the skill installed at `.ai/skills/doc-governance-skill/` (per-repo default). Adjust to `~/.claude/skills/doc-governance-skill/bin/…` for a global install.

Example output when one changed code file is referenced by a doc:
```text
DOC_GOVERNANCE_UPDATE:

sealed_sha: <SHA>
diff_range: <SHA>..worktree
files_changed: 1
docs_affected: 1

CRITICAL (0):

WARNING (1):
  - doc: README.md
    referenced_code_changed: [scripts/deploy.sh]
    reason: doc references code that changed since baseline
    suggested_action: review sections in README.md that mention changed paths

INFO (0):

SUMMARY: 0 critical, 1 warnings, 0 info
```

Exit codes: audit → 0 OK / 1 error. Update → 0 clean or Info-only / 1 with Warning or Critical.

Commit `.doc-governance/map.md` — it is the shared baseline for the update mode.

## Slash-Commands

Después del `claude plugin marketplace add` + `claude plugin install` quedan dos slashes literales en el menú:

- **`/doc-governance-skill`** — Revisar cambios, decidir qué docs actualizar, y al final ofrece sellar un baseline nuevo (te pregunta antes de tocar nada). Empoderá al user, no lo reemplaza. Viene del `SKILL.md` de la raíz, auto-registrado por el plugin loader.
- **`/doc-governance-skill:update`** — Chequeo directo de drift: qué docs mencionan código que cambió desde el último baseline. Solo reporta, no edita. Viene de `commands/update.md`.

**Automatización sin agente:** los scripts `bin/audit.js` y `bin/update.js` siguen siendo callable directo desde terminal, CI o git hooks — sin pasar por el agente ni por el slash.

## Real Scenario
Change implemented:
- Added new authentication checks to API middleware
- Updated CI pipeline to run an additional security stage

Expected document routing:
- `README.md` for setup and operator-facing command changes
- `SECURITY.md` for security posture and disclosure-relevant changes
- `CONTRIBUTING.md` if contributor workflow or checks changed

Expected completion block:
```text
Action Taken: Multiple
Justification: Authentication behavior and CI security workflow changed.
Persisted Rule: Updated security and contributor-process routing guidance.
```

## Documents Evaluated By This Skill
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `ARCHITECTURE.md`
- `OPERATIONS.md`
- `TROUBLESHOOTING.md`
- `API.md` and `docs/api/**`
- `docs/**`

## Update vs No-Update Criteria
Update docs when behavior, workflow, architecture, security, API, setup, CI/CD, or operations impact changes.

Do not update docs for behavior-neutral edits:
- formatting-only changes
- comment-only changes
- typo-only corrections
- pure renames without behavior impact
- internal refactors without maintainer/operator/user impact

## Security and Limitations
- The skill itself is documentation-governance logic; it does not execute deployment or runtime changes.
- Install scripts only copy local files and manage a marker-delimited block in `AGENTS.md`.
- The optional pre-commit hook is non-blocking and warning-only.
- This repository intentionally avoids opaque automation and external runtime dependencies.
- For public repositories, security and policy reporting contact is `contact@nandi.com.ar`.
- Trust boundary: `templates/AGENTS.append.md` is inserted into local `AGENTS.md`; install only from trusted sources and review template content before running installers.
- This skill does not fetch remote content, execute arbitrary commands, or modify files outside repository-scoped install targets.

## Uninstall and Maintenance
Uninstall local installation:
```bash
./uninstall.sh
```

Maintenance guidance:
- Keep `SKILL.md` as the canonical source of behavior.
- Keep `templates/AGENTS.append.md` aligned with installed guidance.
- Run validation steps below before publishing updates.

## Validation (Reproducible)
### 1. Local File Validation
```bash
# Validate shell syntax
bash -n install.sh
bash -n uninstall.sh
bash -n templates/pre-commit-doc-check.sh

# Validate required skill metadata exists
grep -n '^name:' SKILL.md
grep -n '^description:' SKILL.md
```

### 2. Validate Discovery From GitHub
```bash
# Plugin path (canonical) — verify both manifests are valid JSON
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json','utf8'))" && echo "plugin.json OK"
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json','utf8'))" && echo "marketplace.json OK"

# skills.sh path (fallback)
npx skills add NANDI-Services/doc-governance-skill --list
```

### 3. Validate Install + Uninstall Flow Locally
```bash
./install.sh
./install.sh   # idempotence check
./uninstall.sh
./uninstall.sh # idempotence check
```

### 4. Validate AGENTS Block Management
```bash
./install.sh
grep -n 'repo-doc-governance:start' AGENTS.md
grep -n 'repo-doc-governance:end' AGENTS.md
./uninstall.sh
```

## Publishing Readiness
Current repo is publication-oriented when these conditions pass:
- root `SKILL.md` includes valid YAML frontmatter (`name`, `description`)
- `.claude-plugin/plugin.json` is valid JSON with a `name` field
- `claude plugin install` picks up the plugin and auto-registers the root skill
- `install.sh` / `install.ps1` (team-bundling path) remain idempotent
- security and contribution policies are present (`SECURITY.md`, `CONTRIBUTING.md`)
- license and release checklist are present

See `RELEASE_CHECKLIST.md` for a concise pre-release runbook.

## License
This repository is released under the MIT License. See `LICENSE`.

## Lessons Learned

- [2026-07-18] Skills.sh listing is telemetry-driven; only `npx skills add` triggers indexing.
- [2026-07-18] A Claude Code plugin whose root is a `SKILL.md` (with no `skills/` dir and no `skills` manifest field) is auto-loaded as a single-skill plugin. Result: after `claude plugin install` the plugin's literal sub-slashes (from `commands/*.md`) and the auto-registered root skill (from `SKILL.md`) both appear. No duplicate root command file required.
- [2026-07-18] `claude plugin install <owner>/<repo>` **never worked** — the CLI resolves plugin names from configured marketplaces only, per the [official reference](https://code.claude.com/docs/en/plugins-reference#plugin-install). The install flow is two steps: `claude plugin marketplace add <owner>/<repo>` (requires `.claude-plugin/marketplace.json` in the repo) then `claude plugin install <plugin-name>@<marketplace-name>`. v0.5 ships a self-referencing `marketplace.json` (`name: nandi-services`) so this repo is really installable.
