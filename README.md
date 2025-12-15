##BGPalerter – Onwave Deployment
#Overview

BGPalerter is a real-time BGP monitoring and alerting platform used to detect prefix hijacks, route leaks, and RPKI violations.

This repository provides a fully validated, non-interactive, production-ready deployment using Docker Compose.

#Features

- Real-time BGP monitoring (RouteViews + RIS)

- Static and IRR-synced prefix monitoring 

- RPKI validation

- Email alerts (SMTP)

- Slack support (optional)

- CI-validated configuration

- Zero auto-config prompts

---

## Directory Structure

BGPalerter/
├── docker-compose.yml
├── README.md
├── validate.sh
├── config/
│   ├── config.yml
│   ├── prefixes.yml
│   ├── groups.yml
│   ├── rpki.yml
│   └── subs.yml
└── .github/
    └── workflows/
        └── yaml-lint.yml

## Server Prerequisites

Ubuntu 22.04+

Docker ≥ 24.x

Docker Compose plugin

Outbound TCP 179, 443

## Deployment Instructions

git clone https://github.com/Onwave-NetEng/BGPalerter.git
cd BGPalerter

./validate.sh
docker compose up -d

Testing & Validation
docker logs bgpalerter


#Expected:

BGPalerter, version: 2.0.1 environment: production

No prompts. No errors.

# Troubleshooting
Symptom	Cause	Fix
Auto-config prompt	Missing config files	Verify volume mounts
EISDIR	config.yml is directory	Delete directory
monitors.push error	Wrong YAML type	Use provided config

#Version Control

- All configs validated via GitHub Actions
- Breaking changes blocked at PR stage
- Tagged releases recommended for production
