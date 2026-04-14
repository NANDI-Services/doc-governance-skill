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
$AgentsTemplate = Join-Path $ScriptDir 'templates/AGENTS.append.md'

function Fail([string]$Message) {
    throw "[$SkillName] $Message"
}

function Remove-ExistingBlock([string]$Path, [string]$StartMarker, [string]$EndMarker) {
    $content = Get-Content -Path $Path -Raw
    $pattern = "(?s)\r?\n?" + [regex]::Escape($StartMarker) + ".*?" + [regex]::Escape($EndMarker) + "\r?\n?"
    $cleaned = [regex]::Replace($content, $pattern, "`r`n")
    Set-Content -Path $Path -Value $cleaned
}

if (-not (Test-Path -Path $AgentsTemplate -PathType Leaf)) {
    Fail "Missing template file: $AgentsTemplate"
}

$templateContent = Get-Content -Path $AgentsTemplate -Raw
if ($templateContent -notmatch [regex]::Escape($MarkerStart)) {
    Fail "Template missing start marker: $MarkerStart"
}
if ($templateContent -notmatch [regex]::Escape($MarkerEnd)) {
    Fail "Template missing end marker: $MarkerEnd"
}

New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
Copy-Item -Force (Join-Path $ScriptDir 'SKILL.md') $DestDir
Copy-Item -Recurse -Force (Join-Path $ScriptDir 'templates') $DestDir

if (-not (Test-Path $AgentsFile)) {
    Set-Content -Path $AgentsFile -Value "# AGENTS.md`r`n"
}

$agentsContent = Get-Content -Raw $AgentsFile
if ($agentsContent -match [regex]::Escape($MarkerStart)) {
    Remove-ExistingBlock -Path $AgentsFile -StartMarker $MarkerStart -EndMarker $MarkerEnd
}

$agentsContent = Get-Content -Raw $AgentsFile
if ($agentsContent.Length -gt 0 -and -not $agentsContent.EndsWith("`r`n")) {
    Add-Content -Path $AgentsFile -Value ""
}
Add-Content -Path $AgentsFile -Value $templateContent

Write-Host "Installed $SkillName into $DestDir"
Write-Host "AGENTS.md updated: $AgentsFile"
