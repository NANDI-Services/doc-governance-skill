# Contributing Guide

Thanks for contributing to repo-doc-governance.

## What This Repository Accepts
Contributions should improve one or more of the following:
- skill decision quality in SKILL.md
- documentation clarity and correctness
- install/uninstall script safety and idempotence
- publication and validation workflow quality

Avoid broad framework-style changes or unnecessary dependencies.

## Development Principles
- keep behavior explicit and auditable
- prefer simple, robust shell and PowerShell logic
- preserve idempotence of install/uninstall paths
- avoid cosmetic churn in documentation
- keep all repository-facing docs in English

## Local Validation Before PR
Run these commands from repository root:

```bash
bash -n install.sh
bash -n uninstall.sh
bash -n templates/pre-commit-doc-check.sh
npx skills add . --list
```

Optional idempotence check:

```bash
./install.sh
./install.sh
./uninstall.sh
./uninstall.sh
```

For Windows script syntax checks, use a PowerShell parser check or run install.ps1 with process-scoped execution policy.

## Pull Request Expectations
A good PR should include:
- clear summary of the change
- why the change is needed
- validation steps run and outcomes
- updates to documentation when behavior or workflow changes

If a change affects governance behavior, update SKILL.md first and then keep README/templates aligned.

## Commit and Review Guidance
- keep commits focused and reviewable
- prefer small, incremental changes
- avoid unrelated formatting-only diffs
- link related issues when available

## Security-Sensitive Changes
For changes affecting script execution, trust boundaries, or security guidance:
- include explicit risk notes in the PR description
- update SECURITY.md when policy or process is affected
- for public repositories, use contact@nandi.com.ar as the reporting channel

## Code of Conduct
By participating, you agree to maintain a respectful and constructive collaboration style.
