$ErrorActionPreference = 'Stop'

$SkillName = 'doc-governance-skill'
$MarkerName = 'repo-doc-governance'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

try {
    $RepoRoot = (git rev-parse --show-toplevel 2>$null).Trim()
    if (-not $RepoRoot) { $RepoRoot = (Get-Location).Path }
} catch {
    $RepoRoot = (Get-Location).Path
}

$DestDir = Join-Path $RepoRoot ".ai/skills/$SkillName"
$SkillsBase = Join-Path $RepoRoot '.ai/skills'
$AgentsFile = Join-Path $RepoRoot 'AGENTS.md'
$MarkerStart = "<!-- $MarkerName:start -->"
$MarkerEnd = "<!-- $MarkerName:end -->"
$AgentsTemplate = Join-Path $ScriptDir 'templates/AGENTS.append.md'

function Fail([string]$Message) {
    throw "[$SkillName] $Message"
}

function Remove-ExistingBlock([string]$Path, [string]$StartMarker, [string]$EndMarker) {
    $content = Get-Content -Path $Path -Raw
    $pattern = "(?s)\r?\n?" + [regex]::Escape($StartMarker) + ".*?" + [regex]::Escape($EndMarker) + "\r?\n?"
    $cleaned = [regex]::Replace($content, $pattern, "`r`n")
    Set-Content -Path $Path -Value $cleaned -Encoding utf8
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

New-Item -ItemType Directory -Force -Path $SkillsBase | Out-Null
$repoRootResolved = (Resolve-Path -Path $RepoRoot).Path
$skillsBaseResolved = (Resolve-Path -Path $SkillsBase).Path
$expectedSkillsBase = Join-Path $repoRootResolved '.ai/skills'
if ($skillsBaseResolved -ne $expectedSkillsBase) {
    Fail "Unsafe install base path detected (possible symlink escape): $SkillsBase"
}

if ((Test-Path -Path $AgentsFile) -and (((Get-Item -Path $AgentsFile).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0)) {
    Fail "AGENTS.md is a symlink/reparse point; refusing to modify: $AgentsFile"
}

if (Test-Path -Path $DestDir) {
    Remove-Item -Path $DestDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $DestDir | Out-Null
Copy-Item -Force (Join-Path $ScriptDir 'SKILL.md') $DestDir
Copy-Item -Recurse -Force (Join-Path $ScriptDir 'templates') $DestDir

if (-not (Test-Path $AgentsFile)) {
    Set-Content -Path $AgentsFile -Value "# AGENTS.md`r`n" -Encoding utf8
}

$agentsContent = Get-Content -Raw $AgentsFile
if ($agentsContent -match [regex]::Escape($MarkerStart)) {
    Remove-ExistingBlock -Path $AgentsFile -StartMarker $MarkerStart -EndMarker $MarkerEnd
}

$agentsContent = Get-Content -Raw $AgentsFile
if ($agentsContent.Length -gt 0 -and -not $agentsContent.EndsWith("`r`n")) {
    $agentsContent += "`r`n"
}

$updatedContent = $agentsContent + $templateContent
$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid().ToString() + '.tmp')
Set-Content -Path $tempFile -Value $updatedContent -Encoding utf8
Move-Item -Path $tempFile -Destination $AgentsFile -Force

Write-Host "Installed $SkillName into $DestDir"
Write-Host "AGENTS.md updated: $AgentsFile"
