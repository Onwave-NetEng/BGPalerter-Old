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

Expected result: healthy

If you see unhealthy, check the logs:
docker compose logs bgpalerter --tail 50

The health check uses the REST API on port 8011. You can manually check it:
curl http://127.0.0.1:8011/status

## RPKI Auto-Refresh
 
RPKI validation data is automatically refreshed by BGPalerter every 15 minutes.
This is handled internally by the application - no external scripts or cron jobs needed.
 
Configuration: See `rpki:` section in config/config.yml
 
To verify RPKI is working:
```bash
docker compose logs bgpalerter | grep -i rpki

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


Common Issues and Solutions
Health Check Shows "Unhealthy"
Cause: The REST API isn't responding.

Solution:
22	Check logs: docker compose logs bgpalerter --tail 50
23	Verify API is running: curl http://127.0.0.1:8011/status
24	Check config.yml has processMonitors section enabled

No Email Alerts Received
Cause: SMTP configuration issue or network problem.

Solution:
25	Check SMTP settings in config/config.yml
26	Verify the Docker host can reach the SMTP server:
telnet onwave-com.mail.protection.outlook.com 25
27	Check BGPalerter logs for email errors:
docker compose logs bgpalerter | grep -i email

Container Keeps Restarting
Cause: Configuration error or resource issue.

Solution:
28	Check logs: docker compose logs bgpalerter
29	Validate YAML syntax: yamllint config/config.yml
30	Check available memory: free -h
31	Verify prefixes.yml format is correct

"Connection refused" to RIPE RIS
Cause: Network connectivity issue or RIPE RIS maintenance.

Solution:
32	Check internet connectivity from Docker container
33	Check RIPE RIS status: https://ris-live.ripe.net/
34	Wait a few minutes - BGPalerter will automatically reconnect
 
#### Step 5: Save the File
 
Save and exit (Ctrl+X, Y, Enter).
 
---
 
## Fix 5: Clean Up Unused Configuration Files (MINOR)
 
### What's Wrong
 
Your deployment has three configuration files that **don't do anything**:
- `config/irr.yml`
- `config/rpki.yml`
- `config/subs.yml`
 
BGPalerter v2.x doesn't use these files. All configuration goes in the main `config.yml` file.
 
### Step-by-Step Fix
 
#### Option A: Delete Them (Recommended)
 
```bash
cd /home/net-eng/BGPalerter/config
rm irr.yml rpki.yml subs.yml


