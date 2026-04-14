$ErrorActionPreference = 'Stop'

$SkillName = 'repo-doc-governance'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    $RepoRoot = (git rev-parse --show-toplevel 2>$null).Trim()
    if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }
} catch {
    $RepoRoot = (Get-Location).Path
}

$DestDir = Join-Path $RepoRoot ".ai/skills/$SkillName"
$AgentsFile = Join-Path $RepoRoot 'AGENTS.md'
$MarkerStart = "<!-- $SkillName:start -->"
$MarkerEnd = "<!-- $SkillName:end -->"

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
Copy-Item -Force (Join-Path $ScriptDir 'SKILL.md') $DestDir
Copy-Item -Recurse -Force (Join-Path $ScriptDir 'templates') $DestDir

if (-not (Test-Path $AgentsFile)) {
    Set-Content -Path $AgentsFile -Value "# AGENTS.md`r`n"
}

$agentsContent = Get-Content -Raw $AgentsFile
if ($agentsContent -notmatch [regex]::Escape($MarkerStart)) {
$block = @"

$MarkerStart
## Installed Skill: repo-doc-governance

Before closing any meaningful task, run the `repo-doc-governance` skill.

Apply it after code, config, workflow, architecture, security, contributor-process, CI/CD, API, release, or ops changes.

Do not invoke it for cosmetic-only, comments-only, typo-only, or non-behavioral refactors.

The skill decides whether to update documents such as:
- README.md
- AGENTS.md
- CONTRIBUTING.md
- SECURITY.md
- CHANGELOG.md
- ARCHITECTURE.md
- OPERATIONS.md
- TROUBLESHOOTING.md
- API.md
- docs/**

Always end with the exact minimal report required by the skill.
$MarkerEnd
"@
    Add-Content -Path $AgentsFile -Value $block
}

Write-Host "Installed $SkillName into $DestDir"
Write-Host "AGENTS.md updated: $AgentsFile"
