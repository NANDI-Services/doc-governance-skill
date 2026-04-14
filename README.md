# repo-doc-governance

Installable skill to keep repository documentation aligned with meaningful changes while avoiding documentation churn.

## Includes
- `SKILL.md` decision logic
- `install.sh` and `install.ps1`
- AGENTS.md insertion block
- optional pre-commit reminder hook

## Install
### Linux/macOS
```bash
chmod +x install.sh
./install.sh
```

### Windows PowerShell
```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install.ps1
```

## Optional pre-commit hook
```bash
mkdir -p .git/hooks
cp .ai/skills/repo-doc-governance/templates/pre-commit-doc-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Uninstall
```bash
./uninstall.sh
```
