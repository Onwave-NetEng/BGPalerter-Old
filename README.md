📘 README.md
# BGPalerter – Production Deployment

This repository contains a production-grade deployment of
[BGPalerter](https://github.com/nttgin/BGPalerter) for monitoring BGP
announcements, hijacks, leaks, and RPKI/IRR inconsistencies.

---

## Overview

BGPalerter monitors selected IP prefixes in near real-time using
RIPE RIS Live and generates alerts when anomalies are detected.

This deployment is:
- Docker-based
- Configuration-driven
- Email-alert enabled
- RPKI and IRR aware
- Suitable for 24/7 production use

---

## Features

- Prefix hijack detection
- New prefix announcements
- Route visibility loss
- AS path anomalies
- RPKI invalid / uncovered alerts
- Email notifications
- Docker healthcheck
- Automated IRR and RPKI refresh

---

## Directory Structure

BGPalerter/
├── config/
│   ├── config.yml        # Main application config
│   ├── prefixes.yml      # Monitored prefixes (authoritative format)
│   ├── groups.yml        # Prefix grouping
│   ├── irr.yml           # IRR sources
│   ├── rpki.yml          # RPKI config
│   └── subs.yml          # Subscriptions
├── logs/
│   ├── error.log
│   └── reports.log
├── scripts/
│   ├── update-irr.sh
│   └── update-rpki.sh
├── docker-compose.yml
├── validate.sh
└── README.md

---

## Server Requirements

- Linux (tested on Ubuntu)
- Docker >= 20.x
- Docker Compose v2
- Internet access to RIPE RIS Live
- SMTP relay for email alerts

---

## Deployment

```bash
git clone https://github.com/Onwave-NetEng/BGPalerter.git
cd BGPalerter
./validate.sh
docker compose up -d


## Validation
docker compose ps
docker compose logs bgpalerter --tail 50

Expected:
Container state: Up

Log lines: Monitoring <prefix>


## Healthcheck
docker inspect --format='{{.State.Health.Status}}' bgpalerter

Expected:
healthy

## IRR / RPKI Auto-Sync
IRR and RPKI data are refreshed automatically using cron:

- IRR: every 6 hours
- RPKI: every hour

## Logs:
- logs/irr-sync.log
- logs/rpki-sync.log


## Troubleshooting
Config not found
- Ensure config.yml is mounted to /opt/bgpalerter/config.yml

Invalid prefix errors
- Verify prefixes.yml matches prefixes.yml.example format

Email not received
- Check SMTP relay

Inspect logs/error.log


##Version Control

- Image: nttgin/bgpalerter:latest
- Config validated via yamllint


## ✅ Final Status

✔ Healthcheck added  
✔ IRR auto-sync enabled  
✔ RPKI auto-sync enabled  
✔ README finalized  
✔ No breaking changes  

Next:
- image digest pinning
- alert testing script
- GitHub Actions CI
- multi-environment (prod/stage)



