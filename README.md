# repo-doc-governance

Installable documentation-governance skill for the skills.sh ecosystem.

## Quick Start
1. Install the skill from GitHub:
```bash
npx skills add NANDI-Services/doc-governance-skill
```
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

## Why This Skill
Manual doc review is inconsistent and often noisy. This skill gives a deterministic routing flow that:
- standardizes what counts as a meaningful change
- maps impact to the correct document(s)
- avoids over-updating unrelated files
- improves review quality with a minimal, repeatable completion format

## Agent / IDE Compatibility
This repository is designed for skill discovery through skills.sh-compatible tooling.

Primary target:
- `npx skills add ...` workflows

Also useful in any agent environment that can consume a root-level `SKILL.md` with YAML frontmatter.

## Repository Structure
- `SKILL.md`: skill metadata and governance logic
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

### From skills.sh (Recommended)

**Install directly:**
```bash
npx skills add NANDI-Services/doc-governance-skill
```

**Or list skills in this repository first:**
```bash
npx skills add NANDI-Services/doc-governance-skill --list
```

**Search for the skill on skills.sh CLI:**
```bash
npx skills find repo-doc-governance
```

**Direct link: https://skills.sh/@nandi-services/doc-governance-skill (when available on leaderboard)

### Local Installation (Script-Based)
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

### Local Installation (CLI Path)
```bash
npx skills add /absolute/path/to/doc-governance-skill
```

## Usage Example
After implementing a meaningful repository change, run the skill and follow its output format:

```text
Action Taken: Multiple
Justification: CI workflow and deployment commands changed, requiring README and OPERATIONS updates.
Persisted Rule: Updated CI/CD and operations documentation routing rules.
```

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
- `npx skills add ... --list` discovers the skill
- install/uninstall scripts are idempotent
- security and contribution policies are present (`SECURITY.md`, `CONTRIBUTING.md`)
- license and release checklist are present

See `RELEASE_CHECKLIST.md` for a concise pre-release runbook.

## License
This repository is released under the MIT License. See `LICENSE`.
