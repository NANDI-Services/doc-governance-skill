<!-- doc-governance:map v1 -->
sealed_sha: f0658b37de6d4068747477c8b60ddb538a699dea
sealed_at: 2026-08-06T05:30:59.748Z
tool_version: 0.9.0
sealed_dirty: []

## Inventory

### AGENTS.md
title: Agent Roadmap Sync Rules
headings:
  - H1: Agent Roadmap Sync Rules
  - H2: Completion Rules
  - H2: Validation Failure Handling
  - H2: Operating Procedure
code_refs:
  - ROADMAP.md

### CHANGELOG.md
title: Changelog
headings:
  - H1: Changelog
  - H2: [0.9.0] - 2026-08-06
  - H3: Added
  - H3: Fixed
  - H3: Changed
  - H3: Notes
  - H2: [0.8.0] - 2026-07-24
  - H3: Added
  - H3: Changed
  - H3: Notes
  - H2: [0.7.0] - 2026-07-21
  - H3: Changed
  - H3: Added
  - H3: Notes
  - H2: [0.6.2] - 2026-07-21
  - H2: [0.6.1] - 2026-07-19
  - H2: [0.6.0] - 2026-07-19
  - H3: Added
  - H3: Changed
  - H2: [0.5.7] - 2026-07-19
  - H2: [0.5.6] - 2026-07-19
  - H3: Added
  - H3: Changed
  - H2: [0.5.5] - 2026-07-19
  - H3: Fixed
  - H3: Changed
  - H2: [0.5.4] - 2026-07-19
  - H3: Added
  - H3: Changed
  - H2: [0.5.3] - 2026-07-19
  - H3: Fixed
  - H3: Changed
  - H2: [0.5.2] - 2026-07-19
  - H3: Fixed
  - H2: [0.5.1] - 2026-07-19
  - H2: [0.5.0] - 2026-07-18
  - H3: Fixed
  - H3: Added
  - H3: Changed
  - H2: [0.4.0] - 2026-07-18
  - H3: Changed
  - H3: Removed
  - H2: [0.3.1] - 2026-07-18
  - H2: [0.3.0] - 2026-07-18
  - H2: [0.2.3] - 2026-07-18
  - H2: [0.2.2] - 2026-07-18
  - H2: [0.2.1] - 2026-07-18
  - H2: [0.2.0] - 2026-07-18
  - H2: [0.2.0] - 2026-07-17
  - H3: Added
  - H3: Changed
  - H2: [0.1.0] - 2026-07-17
  - H3: Added
code_refs:
  - .agents
  - .agents/
  - .ai/skills/doc-governance-skill/
  - .bak
  - .claude
  - .claude-plugin/marketplace.json
  - .claude/
  - .doc-governance/ignore
  - .doc-governance/map.md
  - .github/scripts/release.sh
  - .github/workflows/ci.yml
  - .github/workflows/release.yml
  - .md
  - /
  - /doc-governance-skill
  - 0.8.0
  - AGENTS.md
  - CLAUDE.md
  - CODE_OF_CONDUCT.md
  - CONTRIBUTING.md
  - README.md
  - RELEASE_CHECKLIST.md
  - ROADMAP.md
  - SECURITY.md
  - SKILL.md
  - audit.js
  - bin/
  - bin/audit.js
  - bin/lib/diff-classify.js
  - bin/lib/dirty.js
  - bin/lib/ignore.js
  - bin/lib/scan.js
  - bin/lib/self-test-update.js
  - bin/lib/sync-exclude-dirs.js
  - bin/lib/version.js
  - bin/update.js
  - commands/
  - commands/doc-governance-skill.md
  - commands/review.md
  - core.autocrlf
  - graphify-out/
  - install.ps1
  - install.sh
  - owner/repo
  - release.sh
  - release.yml
  - skills/
  - templates/
  - templates/AGENTS.append.md
  - templates/doc-governance-ignore.example
  - templates/pre-commit-doc-check.sh
  - uninstall.sh
  - update.js

### CLAUDE.md
title: CLAUDE.md
headings:
  - H1: CLAUDE.md
  - H2: What This Repo Is
  - H2: Two-Mode Runtime
  - H2: Install Scripts
  - H2: Dual Distribution (two-step install, both surfaces)
  - H2: Release Pipeline
  - H2: Conventions
  - H2: Common Tasks
  - H2: Skills.sh Publishing (fallback path)
  - H2: Lessons Learned
code_refs:
  - .claude-plugin/
  - .claude-plugin/marketplace.json
  - .doc-governance/map.md
  - .github/scripts/release.sh
  - .github/workflows/release.yml
  - /doc-governance-skill
  - AGENTS.md
  - CHANGELOG.md
  - RELEASE_CHECKLIST.md
  - SKILL.md
  - audit.js
  - bin/
  - bin/lib/dirty.js
  - bin/lib/scan.js
  - bin/lib/version.js
  - commands/
  - commands/doc-governance-skill.md
  - commands/review.md
  - commands/update.md
  - install.ps1
  - install.sh
  - owner/repo
  - package.json
  - review.md
  - skills/
  - templates/
  - templates/AGENTS.append.md
  - uninstall.sh
  - update.js
  - update.md

### CODE_OF_CONDUCT.md
title: Code of Conduct
headings:
  - H1: Code of Conduct
  - H2: Our Commitment
  - H2: Expected Behavior
  - H2: Unacceptable Behavior
  - H2: Scope
  - H2: Reporting
  - H2: Enforcement
code_refs: []

### CONTRIBUTING.md
title: Contributing Guide
headings:
  - H1: Contributing Guide
  - H2: What This Repository Accepts
  - H2: Development Principles
  - H2: Local Validation Before PR
  - H2: Pull Request Expectations
  - H2: Commit and Review Guidance
  - H2: Security-Sensitive Changes
  - H2: Code of Conduct
code_refs: []

### README.md
title: repo-doc-governance
headings:
  - H1: repo-doc-governance
  - H2: Quick Start
  - H2: Usage Flow (Visual)
  - H2: Zero-Friction Activation (natural language)
  - H3: Cuándo NO se activa (protección contra ruido)
  - H2: What Problem This Solves
  - H2: Positioning vs Alternatives
  - H2: Why This Skill
  - H2: Agent / IDE Compatibility
  - H2: Repository Structure
  - H2: Installation
  - H3: Canonical: add the marketplace, then install
  - H3: Team bundling (optional)
  - H3: skills.sh (fallback)
  - H2: Usage Example
  - H2: Two-Mode Operation
  - H2: Slash-Commands
  - H2: Real Scenario
  - H2: Documents Evaluated By This Skill
  - H2: Update vs No-Update Criteria
  - H2: Security and Limitations
  - H2: Uninstall and Maintenance
  - H2: Validation (Reproducible)
  - H3: 1. Local File Validation
  - H3: 2. Validate Discovery From GitHub
  - H3: 3. Validate Install + Uninstall Flow Locally
  - H3: 4. Validate AGENTS Block Management
  - H2: Publishing Readiness
  - H2: License
  - H2: Lessons Learned
code_refs:
  - .ai/skills/doc-governance-skill/
  - .claude-plugin/marketplace.json
  - .claude-plugin/plugin.json
  - .doc-governance/map.md
  - /doc-governance-skill
  - AGENTS.md
  - API.md
  - ARCHITECTURE.md
  - CHANGELOG.md
  - CLAUDE.md
  - CODE_OF_CONDUCT.md
  - CONTRIBUTING.md
  - OPERATIONS.md
  - README.md
  - RELEASE_CHECKLIST.md
  - SECURITY.md
  - SKILL.md
  - TROUBLESHOOTING.md
  - bin/audit.js
  - bin/lib/scan.js
  - bin/update.js
  - commands/
  - commands/review.md
  - commands/update.md
  - install.ps1
  - install.sh
  - marketplace.json
  - owner/repo
  - skills/
  - templates/AGENTS.append.md
  - templates/pre-commit-doc-check.sh
  - uninstall.sh

### RELEASE_CHECKLIST.md
title: Release Checklist
headings:
  - H1: Release Checklist
  - H2: Discovery and Metadata
  - H2: Version and Changelog
  - H2: Generated Content and CI
  - H2: Documentation Quality
  - H2: Script Safety
  - H2: Dual-Mode Executables (v0.2+)
  - H2: Baseline Integrity (v0.9+)
  - H2: Auto-Bootstrap Smoke (v0.3+)
  - H2: Plugin Manifest (v0.4+)
  - H2: Publication Readiness
code_refs:
  - .ai/skills/doc-governance-skill/bin/
  - .claude-plugin/
  - .claude-plugin/plugin.json
  - .doc-governance/map.md
  - .github/workflows/ci.yml
  - CHANGELOG.md
  - CONTRIBUTING.md
  - README.md
  - SECURITY.md
  - SKILL.md
  - audit.js
  - bin/
  - bin/lib/version.js
  - bin/update.js
  - commands/
  - commands/doc-governance-skill.md
  - commands/update.md
  - install.ps1
  - install.sh
  - plugin.json
  - release.sh
  - skills/
  - templates/
  - templates/AGENTS.append.md
  - uninstall.sh

### ROADMAP.md
title: ROADMAP — doc-governance-skill
headings:
  - H1: ROADMAP — doc-governance-skill
  - H2: Product North Star
  - H2: Target User and Problem Statement
  - H2: v1.0 Outcome and Exit Criteria
  - H2: Anti-Goals
  - H2: Risks
  - H2: Evidence Map
  - H2: Assumptions
  - H2: Deferred Backlog (v0.3+)
  - H1: Project Roadmap
  - H2: Product North Star
  - H2: Current State
  - H2: Phased Roadmap
  - H3: Phase P0 (Critical)
  - H3: Phase P1 (Important)
  - H3: Phase P2 (Optimization)
  - H2: Release Milestones
  - H2: Command/Module Breakdown
  - H2: Exit Criteria Per Phase
  - H2: Detected Project Profile
  - H2: Risks and Anti-goals
  - H3: Risks
  - H3: Anti-goals
code_refs:
  - .doc-governance/config.json
  - .doc-governance/map.md
  - .github/scripts/release.sh
  - .github/workflows/
  - .github/workflows/doc-governance.yml
  - .md
  - AGENTS.md
  - CONTRIBUTING.md
  - RELEASE_CHECKLIST.md
  - SECURITY.md
  - SKILL.md
  - X.md
  - bats/
  - bin/lib/scan.js
  - bin/update.js
  - chart.js
  - install.ps1
  - install.sh
  - templates/AGENTS.append.md
  - test/
  - uninstall.sh
  - v0.1.0

### SECURITY.md
title: Security Policy
headings:
  - H1: Security Policy
  - H2: Scope
  - H2: Supported Versions
  - H2: Reporting a Vulnerability
  - H2: Response Expectations
  - H2: Disclosure Guidelines
  - H2: Trust Boundaries and Installation Safety
  - H3: Template Trust Boundary
  - H3: Installer Scope
  - H2: Hardening Notes
code_refs:
  - AGENTS.md
  - templates/AGENTS.append.md

### SKILL.md
title: Repo Doc Governance
headings:
  - H1: Repo Doc Governance
  - H2: Purpose
  - H2: How Detection Works (read this before expecting more)
  - H2: When To Use
  - H2: When NOT To Use
  - H2: Activation Signals
  - H2: Non-Activation Signals
  - H2: Decision Flow
  - H2: Update Rules
  - H2: Document Routing By Type
  - H2: Minimal Output Format
  - H3: When to emit which format
  - H2: Style Constraints
  - H2: Audit Mode
  - H2: Update Mode
  - H2: First Run / No Baseline
  - H2: Root Invocation Behavior
  - H3: Cold-start guard — chequeá esto ANTES de nada
  - H3: Flujo steady-state
  - H2: Drift Categories Monitored
  - H2: Trivial-Change Suppression
  - H2: Known Limitations
code_refs:
  - .agents
  - .ai
  - .ai/skills/doc-governance-skill
  - .ai/skills/doc-governance-skill/
  - .claude
  - .doc-governance/ignore
  - .doc-governance/map.md
  - .git
  - .html
  - .js/.ts/.prisma
  - .md
  - .next
  - .py/.yml
  - .sql
  - .venv
  - //
  - AGENTS.md
  - API.md
  - ARCHITECTURE.md
  - CHANGELOG.md
  - CLAUDE.md
  - CONTRIBUTING.md
  - Cargo.toml
  - DESIGN.md
  - OPERATIONS.md
  - README.md
  - SECURITY.md
  - TROUBLESHOOTING.md
  - X.tsx
  - apps/api/
  - audit.js
  - bin/lib/diff-classify.js
  - bin/lib/scan.js
  - bin/lib/sync-exclude-dirs.js
  - bin/update.js
  - chart.js
  - go.mod
  - install.sh
  - lib/Z.js
  - package.json
  - path/Y.ts
  - requirements.txt
  - templates/doc-governance-ignore.example
  - update.js

### commands/review.md
title: Doc Governance — Review (root flow)
headings:
  - H1: Doc Governance — Review (root flow)
  - H2: Cold-start guard (ejecutá esto ANTES de nada)
  - H2: Acción (steady-state, map ya existe)
  - H2: Resumen del flujo (referencia rápida)
  - H2: Diferencia con `:update`
code_refs:
  - .ai/skills/doc-governance-skill
  - .doc-governance/map.md
  - SKILL.md
  - bin/audit.js
  - bin/update.js

### commands/update.md
title: Update Mode
headings:
  - H1: Update Mode
  - H2: Acción
  - H2: Comportamiento
  - H2: Después de correr
code_refs:
  - .doc-governance/map.md
  - SKILL.md

### docs/plan.md
title: Plan — doc-governance-skill v0.2 (audit + update dual-mode)
headings:
  - H1: Plan — doc-governance-skill v0.2 (audit + update dual-mode)
  - H2: Context
  - H2: Scope v0.2
  - H3: In-scope
  - H3: Out-of-scope (marcar como v0.3+ en ROADMAP.md)
  - H2: Architecture
  - H3: `.doc-governance/map.md` schema (deterministic)
  - H3: `/update` output (text, LLM-friendly — inspirado en harness --format llm)
  - H2: Files to create/modify
  - H2: Execution order (fases)
  - H2: Verification
  - H2: Reference files ya existentes que reutilizar
  - H2: Deuda deliberada (marcada con `ponytail:` comment en el código)
code_refs:
  - .../update.js
  - ..HEAD
  - ./install.sh
  - ./uninstall.sh
  - .ai/skills/
  - .ai/skills/doc-governance-skill/
  - .ai/skills/doc-governance-skill/bin/
  - .ai/skills/doc-governance-skill/bin/audit.js
  - .doc-governance/
  - .doc-governance/config.json
  - .doc-governance/map.md
  - .gitignore
  - .md
  - /audit
  - /update
  - AGENTS.append.md
  - CODE_OF_CONDUCT.md
  - CONTRIBUTING.md
  - README.md
  - RELEASE_CHECKLIST.md
  - ROADMAP.md
  - SECURITY.md
  - SKILL.md
  - Zarl-prog/doc-drift-detector
  - audit.js
  - bin/
  - bin/audit.js
  - bin/lib/scan.js
  - bin/update.js
  - ddpoe/axiom-graph
  - install.ps1
  - install.sh
  - sam-bretz/harness
  - templates/
  - templates/AGENTS.append.md
  - templates/pre-commit-doc-check.sh
  - uninstall.sh
  - update.js

### templates/AGENTS.append.md
title: (untitled)
headings:
  - H2: Installed Skill: doc-governance-skill
code_refs:
  - .doc-governance/map.md
  - /doc-governance-skill
