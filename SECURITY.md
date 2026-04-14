# Security Policy

This policy is intended for public repositories.

## Scope
This repository provides a documentation-governance skill and lightweight local install scripts.

Security scope includes:
- integrity of skill behavior defined in SKILL.md
- safety and idempotence of local installation scripts
- clarity of guidance affecting documentation and contributor workflows

## Supported Versions
Only the latest commit on the default branch is supported for security fixes.

## Reporting a Vulnerability
Please report security issues privately.

Preferred channel:
- open a private security advisory in this GitHub repository
- email: contact@nandi.com.ar

If private advisory is not available, contact the maintainers directly through repository contact channels and include:
- summary of the issue
- impact and affected files
- reproduction steps
- suggested remediation if known

## Response Expectations
Maintainers will:
- acknowledge receipt as soon as practical
- assess severity and impact
- coordinate a fix and disclosure timeline
- publish a patch when validated

## Disclosure Guidelines
Please do not publish proof-of-concept exploit details before a fix is available.

Coordinated disclosure helps reduce user risk.

## Trust Boundaries and Installation Safety
### Template Trust Boundary
`templates/AGENTS.append.md` is inserted into local `AGENTS.md` during installation.

Only install from trusted sources and review template changes before execution.

### Installer Scope
Installers are intended to:
- copy skill files into repository-scoped install paths
- manage a marker-delimited block in `AGENTS.md`

Installers are not intended to:
- execute arbitrary remote scripts
- fetch external content
- modify files outside repository-scoped targets

## Hardening Notes
This repository is intentionally simple:
- no runtime services are shipped
- no secrets should be stored in this repository
- scripts should remain transparent, auditable, and dependency-light

Contributors should avoid introducing opaque automation or remote execution behavior.
