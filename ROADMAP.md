# ROADMAP — doc-governance-skill

> Human-authored context. The phased task list below is managed by RoadmapSmith
> and will be updated on future `roadmapsmith sync` or `roadmapsmith generate` runs.
> Do not edit content inside the managed block markers.

---

## Product North Star

Give AI agents and developers a deterministic, low-churn documentation governance flow: decide whether docs must change after a meaningful repository edit, route updates to exactly the right files, and emit a minimal, repeatable completion report.

**Source:** SKILL.md:8-14 (explicit)

---

## Target User and Problem Statement

**Target users:** AI agents and developers using skills.sh-compatible tooling (`npx skills add ...`) or any agent environment that can consume a root-level `SKILL.md` with YAML frontmatter.

**Problem:** Teams over-update or under-update docs after implementation work. Manual doc review is inconsistent and noisy. This skill gives a deterministic routing flow that standardizes what counts as a meaningful change, maps impact to the correct document(s), and avoids over-updating unrelated files.

**Source:** README.md:22-30 (explicit)

---

## v1.0 Outcome and Exit Criteria

The following criteria are sourced from `README.md:203-210` (Publishing Readiness section). Items marked [INFERRED] are not explicitly stated in repo documentation. Progress is tracked in the managed task block below.

- `SKILL.md` includes valid YAML frontmatter (`name`, `description`) — *README.md:204*
- `npx skills add NANDI-Services/doc-governance-skill --list` discovers the skill — *README.md:205*
- `install.sh` and `uninstall.sh` are idempotent (confirmed by running, not just by design) — *README.md:206*
- `SECURITY.md` and `CONTRIBUTING.md` are present and current — *README.md:207*
- License and release checklist are present — *README.md:208*
- All `RELEASE_CHECKLIST.md` items are checked — *RELEASE_CHECKLIST.md:5-26* [INFERRED: currently all unchecked]
- GitHub release object exists with release notes for the current release — v0.6.0 shipped via `.github/scripts/release.sh` with CHANGELOG.md entries
- At least one consuming repository successfully installs and uses the skill — [INFERRED: no adoption evidence in repo]

---

## Anti-Goals

Sourced from `SKILL.md:28-35` and `README.md:149-153` (explicit).

**The skill must NOT activate for:**
- Formatting-only or comment-only changes
- Typo-only fixes without semantic impact
- Pure renames with no behavior change
- Internal refactors with no user/developer/operator/security impact
- Test-only edits that do not change contributor expectations
- Temporary debugging changes removed before completion

**The repository must NOT:**
- Fetch remote content at install or runtime
- Execute arbitrary commands outside repo-scoped install targets
- Modify files outside the repository root
- Introduce opaque automation or external runtime dependencies
- Store secrets or credentials

---

## Risks

Items marked [INFERRED] are not explicitly documented in the repository.

- **Trust Boundary:** `templates/AGENTS.append.md` is inserted into the user's `AGENTS.md`; each release requires manual review of this template before publishing. *Source: SECURITY.md:41-55, RELEASE_CHECKLIST.md:21*
- **Release Checklist Drift [INFERRED]:** All 11 `RELEASE_CHECKLIST.md` items are currently unchecked. A tag (`v0.1.0`) exists without confirmed validation runs.
- **Platform Parity [INFERRED]:** `install.ps1` may drift from `install.sh` if updates to one are not mirrored. No CI enforces cross-platform parity.
- **No Automated Tests [INFERRED]:** Validation is manual (4 bash command groups). No `.github/workflows/` or test framework exists. Silent regressions are possible.
- **Discovery Unconfirmed [INFERRED]:** `README.md:78-79` notes that skills.sh leaderboard visibility "depends on leaderboard indexing/telemetry." Not yet confirmed active.
- **Zero Adoption [INFERRED]:** No consuming repositories are documented. First real-world use will surface edge cases in the skill logic, installer behavior, and output format.

---

## Evidence Map

| Section / Conclusion | Supporting File | Lines | Inferred? |
|---|---|---|---|
| Skill name and description | SKILL.md | 1–4 | No |
| Core governance purpose (3 questions) | SKILL.md | 8–14 | No |
| Trigger conditions (7 categories) | SKILL.md | 16–27 | No |
| Non-trigger conditions | SKILL.md | 28–35 | No |
| Document routing map (10 targets) | SKILL.md | 72–83 | No |
| Minimal output format | SKILL.md | 85–90 | No |
| Install method 1: skills.sh | README.md | 60–80 | No |
| Install method 2: local script | README.md | 81–92 | No |
| Install method 3: CLI path | README.md | 93–99 | No |
| Publishing readiness criteria | README.md | 203–210 | No |
| Validation command suite | README.md | 169–201 | No |
| Repository structure | README.md | 46–57 | No |
| Problem statement | README.md | 22–30 | No |
| v0.1.0 tag exists | git tag --list | — | No |
| All release checklist items unchecked | RELEASE_CHECKLIST.md | 5–26 | No |
| Script idempotence design (markers) | install.sh, uninstall.sh | 1–83, 1–46 | No |
| Trust boundary (template insertion) | SECURITY.md | 41–55 | No |
| Disclosure process | SECURITY.md | 16–27 | No |
| Contribution expectations | CONTRIBUTING.md | 5–61 | No |
| No automated test suite | (absence of CI/test files) | — | Yes |
| skills.sh discovery unconfirmed | README.md | 78–79 | Yes |
| PowerShell parity risk | install.ps1 vs install.sh | — | Yes |
| Real-world adoption = 0 | (no usage evidence) | — | Yes |
| GitHub release page unconfirmed | (no CHANGELOG.md or release notes) | — | Yes |

---

## Assumptions

The following are explicitly marked as inferred — not stated in repo documentation:

- [HISTÓRICO] v0.1.0 assumption era relevante en jul-17 2026. Actual: v0.6.0 shipped, CHANGELOG.md activo, release.yml automatiza bumps.
- [INFERRED] `npx skills add NANDI-Services/doc-governance-skill --list` currently returns the skill. Web leaderboard visibility is explicitly noted as uncertain (`README.md:78-79`).
- [INFERRED] No automated test suite exists. No `.github/workflows/`, `*.test.*`, `bats/`, or `test/` files were found in the repository.
- [INFERRED] `install.ps1` may lag behind `install.sh` in future updates without an enforced parity check.
- [INFERRED] Real-world adoption is currently zero. No consuming repositories are referenced in this repo.
- [HISTÓRICO] Aplicaba a v0.1.0 en jul-17 2026. Release workflow (.github/workflows/release.yml) genera release notes desde v0.3.0 en adelante.

---

## Deferred Backlog (v0.3+)

Explicitly deferred from v0.2 to keep the shipped surface minimal. Each item lands only when a real usage need appears — YAGNI applies.

- **Auto-apply updates** (`update --apply`): rewrite doc sections referenced by changed code. Requires trust-boundary and diff review UX before shipping.
- **Semantic mismatch detection**: compare docstring/signature drift for `Critical` findings. Currently reserved but never emitted.
- **JSON output format**: `--format json` for machine consumers. Text is enough while human review dominates.
- **Config file** (`.doc-governance/config.json`): override excludes, custom routing table. Hardcoded defaults cover v0.2.
- **Explicit YAML mappings** (harness-style): pin doc↔code pairs when auto-detection misses. Add only if backtick heuristic falls short.
- **CI enforcement workflow**: `.github/workflows/doc-governance.yml` template that fails PRs on Warning. Currently opt-in via pre-commit hook.
- **Semantic ref detection**: extract function/class names without paths. Precision > recall in v0.2; upgrade if false negatives dominate.
- **Rename-only diff classifier**: detect `sed A→B` applied uniformly to N lines of real code (not just comments). Comment-only case already handled in v0.6.0; extending to code renames requires an N-way substitution invariant check — non-trivial and prone to false negatives.
- **Anchor-level report**: emit `X.md:42-58 (section: ## Prisma schema)` instead of `X.md`. Requires `bin/lib/scan.js` to index line ranges per heading. Deferred until the flat file-level report proves insufficient in practice.
- **Link vs prose distinction in code refs**: only warn when a doc contains a markdown link `](path)`, not a bare backtick mention. Requires refactor of `extractCodeRefs` in `bin/lib/scan.js` to preserve context. Would reduce README/CLAUDE.md false positives materially.
- **Auto-suggest reseal at threshold**: when `map_staleness >= 3` `.md` files, offer to re-audit inline with a confirm prompt. Small UX add, orthogonal to core logic.
- **`--include-trivial` flag**: escalate `whitespace-only`/`comment-only` INFO back to WARNING for operators that want maximum recall. Add on request only.

---

<!-- rs:managed:start -->
# Project Roadmap

## Product North Star
Ship validated, high-impact increments with deterministic delivery and transparent completion evidence.

## Current State
- Implemented surface: 0 implementation files detected
- TODO surface: 0 TODO/FIXME markers detected
- Detected stacks: Shell

## Phased Roadmap

### Phase P0 (Critical)
- [ ] Add automated test harness for Shell <!-- rs:task=p0-add-automated-test-harness-for-shell -->
- [ ] Close critical TODO and FIXME items blocking release confidence <!-- rs:task=p0-close-critical-todo-and-fixme-items-blocking-release-confidence -->
- [ ] Document measurable north star metrics for Shell <!-- rs:task=p0-document-measurable-north-star-metrics-for-shell -->
- [x] Implement critical tasks required for milestone v0.1 <!-- rs:task=p0-implement-critical-tasks-required-for-milestone-v0-1 -->
- [ ] Stabilize project baseline and unblock high-risk delivery paths <!-- rs:task=p0-stabilize-project-baseline-and-unblock-high-risk-delivery-paths -->

### Phase P1 (Important)
- [ ] Expand feature completeness and improve reliability <!-- rs:task=p1-expand-feature-completeness-and-improve-reliability -->
- [ ] Expand feature-level validation and regression checks <!-- rs:task=p1-expand-feature-level-validation-and-regression-checks -->
- [x] Reduce operational risk before v0.3 <!-- rs:task=p1-reduce-operational-risk-before-v0-3 -->

### Phase P2 (Optimization)
- [ ] Close non-critical backlog aligned to anti-goals <!-- rs:task=p2-close-non-critical-backlog-aligned-to-anti-goals -->
- [ ] Complete final hardening and release readiness for v1.0 <!-- rs:task=p2-complete-final-hardening-and-release-readiness-for-v1-0 -->
- [ ] Complete release candidate checklist and production readiness review <!-- rs:task=p2-complete-release-candidate-checklist-and-production-readiness-review -->

## Release Milestones
- [x] v0.1: Foundation baseline complete <!-- rs:task=milestone-v0-1 -->
- [x] v0.2: Core feature coverage stabilized <!-- rs:task=milestone-v0-2 -->
- [x] v0.3: Release candidate hardening complete <!-- rs:task=milestone-v0-3 -->
- [ ] v1.0: Production readiness exit criteria met <!-- rs:task=milestone-v1-0 -->

## Command/Module Breakdown
- [x] Identify command/module boundaries for the next increment <!-- rs:task=identify-command-module-boundaries -->

## Exit Criteria Per Phase
- [ ] P0: all critical checklist items validated by code/test/artifact evidence <!-- rs:task=exit-p0-all-critical-checklist-items-validated-by-code-test-artifact-evidence -->
- [ ] P1: reliability and regression checks green on the mainline <!-- rs:task=exit-p1-reliability-and-regression-checks-green-on-the-mainline -->
- [ ] P2: release hardening and anti-goal checks completed for v1.0 <!-- rs:task=exit-p2-release-hardening-and-anti-goal-checks-completed-for-v1-0 -->

## Detected Project Profile
- **Type:** unknown-generic
- **Confidence:** low
- **Evidence:** general file scan

## Risks and Anti-goals
### Risks
- [ ] Roadmap drift if checklist state diverges from repository evidence <!-- rs:task=risk-roadmap-drift-if-checklist-state-diverges-from-repository-evidence -->
- [ ] Silent regressions when tasks are marked complete without tests <!-- rs:task=risk-silent-regressions-when-tasks-are-marked-complete-without-tests -->
- [ ] Scope creep that delays the v1.0 milestone path <!-- rs:task=risk-scope-creep-that-delays-the-v1-0-milestone-path -->

### Anti-goals
- [ ] Do not mark tasks complete without repository evidence <!-- rs:task=anti-goal-do-not-mark-tasks-complete-without-repository-evidence -->
- [ ] Do not introduce non-deterministic roadmap formatting <!-- rs:task=anti-goal-do-not-introduce-non-deterministic-roadmap-formatting -->
- [ ] Do not hide validation failures from roadmap consumers <!-- rs:task=anti-goal-do-not-hide-validation-failures-from-roadmap-consumers -->
<!-- rs:managed:end -->
