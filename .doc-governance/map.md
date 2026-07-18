<!-- doc-governance:map v1 -->
sealed_sha: aec8d4493d87edf27d3d1ccbd61ad2fa71bf75ec
sealed_at: 2026-07-18T01:21:42.533Z
tool_version: 0.2.0

## Inventory

### .agents/skills/bash-defensive-patterns/SKILL.md
title: Bash Defensive Patterns
headings:
  - H1: Bash Defensive Patterns
  - H2: When to Use This Skill
  - H2: Core Defensive Principles
  - H3: 1. Strict Mode
  - H3: 2. Error Trapping and Cleanup
  - H3: 3. Variable Safety
  - H3: 4. Array Handling
  - H3: 5. Conditional Safety
  - H2: Fundamental Patterns
  - H3: Pattern 1: Safe Script Directory Detection
  - H3: Pattern 2: Comprehensive Function Templat
  - H3: Pattern 3: Safe Temporary File Handling
  - H3: Pattern 4: Robust Argument Parsing
  - H3: Pattern 5: Structured Logging
  - H3: Pattern 6: Process Orchestration with Signals
  - H3: Pattern 7: Safe File Operations
  - H3: Pattern 8: Idempotent Script Design
  - H3: Pattern 9: Safe Command Substitution
  - H3: Pattern 10: Dry-Run Support
  - H2: Advanced Defensive Techniques
  - H3: Named Parameters Pattern
  - H3: Dependency Checking
  - H2: Best Practices Summary
code_refs: []

### AGENTS.md
title: Agent Roadmap Sync Rules
headings:
  - H1: Agent Roadmap Sync Rules
  - H2: Completion Rules
  - H2: Validation Failure Handling
  - H2: Operating Procedure
  - H2: Installed Skill: doc-governance-skill
code_refs:
  - .doc-governance/map.md
  - ROADMAP.md

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
  - H2: What Problem This Solves
  - H2: Positioning vs Alternatives
  - H2: Why This Skill
  - H2: Agent / IDE Compatibility
  - H2: Repository Structure
  - H2: Installation
  - H3: From skills.sh (Recommended)
  - H3: Local Installation (Script-Based)
  - H3: Local Installation (CLI Path)
  - H2: Usage Example
  - H2: Two-Mode Operation
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
code_refs:
  - .doc-governance/map.md
  - AGENTS.md
  - API.md
  - ARCHITECTURE.md
  - CHANGELOG.md
  - CODE_OF_CONDUCT.md
  - CONTRIBUTING.md
  - OPERATIONS.md
  - README.md
  - RELEASE_CHECKLIST.md
  - SECURITY.md
  - SKILL.md
  - TROUBLESHOOTING.md
  - install.ps1
  - install.sh
  - templates/AGENTS.append.md
  - templates/pre-commit-doc-check.sh
  - uninstall.sh

### RELEASE_CHECKLIST.md
title: Release Checklist
headings:
  - H1: Release Checklist
  - H2: Discovery and Metadata
  - H2: Documentation Quality
  - H2: Script Safety
  - H2: Publication Readiness
code_refs:
  - CONTRIBUTING.md
  - README.md
  - SECURITY.md
  - SKILL.md
  - install.ps1
  - install.sh
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
  - .github/workflows/
  - AGENTS.md
  - CONTRIBUTING.md
  - RELEASE_CHECKLIST.md
  - SECURITY.md
  - SKILL.md
  - bats/
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
  - H2: When To Use
  - H2: When NOT To Use
  - H2: Activation Signals
  - H2: Non-Activation Signals
  - H2: Decision Flow
  - H2: Update Rules
  - H2: Document Routing By Type
  - H2: Minimal Output Format
  - H2: Style Constraints
  - H2: Audit Mode
  - H2: Update Mode
  - H2: Drift Categories Monitored
code_refs:
  - .ai
  - .doc-governance/map.md
  - .git
  - .md
  - .next
  - .venv
  - AGENTS.md
  - API.md
  - ARCHITECTURE.md
  - CHANGELOG.md
  - CONTRIBUTING.md
  - OPERATIONS.md
  - README.md
  - SECURITY.md
  - TROUBLESHOOTING.md

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
  - ./uninstall.sh
  - .ai/skills/doc-governance-skill/bin/
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
