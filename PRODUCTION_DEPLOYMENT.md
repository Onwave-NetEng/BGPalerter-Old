# BGPalerter Production Deployment Guide

**Version:** 3.4.2  
**Last Updated:** December 22, 2024  
**Target Environment:** Ubuntu 20.04/22.04/24.04 LTS

---

## Quick Start (3 Commands)

```bash
# 1. Clone repository
git clone https://github.com/Onwave-NetEng/BGPalerter.git
cd BGPalerter

# 2. Run automated deployment
cd deploy
./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard

# 3. Verify deployment
pm2 status  # Should show: bgpalerter-dashboard | online
curl http://localhost:3000  # Should return: HTTP 200 OK
```

**Deployment Time:** ~5 minutes on fresh Ubuntu server

---

## Prerequisites

**Operating System:**
- Ubuntu 20.04 LTS or later
- Debian 10 or later
- 2GB RAM minimum, 4GB recommended
- 10GB free disk space

**Network:**
- Internet connection (for package downloads)
- Ports 3000 (dashboard) and 8011 (BGPalerter) available

**Permissions:**
- sudo access for system package installation
- Regular user account for application deployment

---

## Deployment Steps

### Step 1: Clone Repository

```bash
cd ~
git clone https://github.com/Onwave-NetEng/BGPalerter.git
cd BGPalerter
```

**Expected Output:**
```
Cloning into 'BGPalerter'...
remote: Enumerating objects: 500, done.
remote: Counting objects: 100% (500/500), done.
remote: Compressing objects: 100% (300/300), done.
Receiving objects: 100% (500/500), 400.00 KiB | 2.00 MiB/s, done.
```

### Step 2: Run Deployment Orchestrator

```bash
cd deploy
./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard
```

**What This Does:**
1. **docker** - Installs Docker and Docker Compose
2. **nodejs** - Installs Node.js 22.x LTS
3. **pnpm** - Installs pnpm package manager
4. **pm2** - Installs PM2 process manager
5. **bgpalerter** - Deploys BGPalerter backend via Docker
6. **dashboard** - Builds and deploys dashboard frontend

**Deployment Time:** 3-5 minutes

**Expected Output:**
```
=== BGPalerter Deployment Orchestrator ===
Modules to deploy: docker, nodejs, pnpm, pm2, bgpalerter, dashboard

[1/6] Deploying docker...
✅ Docker installed successfully

[2/6] Deploying nodejs...
✅ Node.js 22.13.0 installed successfully

[3/6] Deploying pnpm...
✅ pnpm 9.15.0 installed successfully

[4/6] Deploying pm2...
✅ PM2 5.4.2 installed successfully

[5/6] Deploying bgpalerter...
✅ BGPalerter backend running on port 8011

[6/6] Deploying dashboard...
Building dashboard...
Starting dashboard with PM2...
✅ PM2 process is online
✅ Dashboard HTTP endpoint responding
✅ DEPLOYMENT SUCCESSFUL
============================================================
Dashboard URL: http://localhost:3000
PM2 Status: pm2 status
PM2 Logs: pm2 logs bgpalerter-dashboard
============================================================
```

### Step 3: Verify Deployment

```bash
# Check PM2 status
pm2 status
```

**Expected Output:**
```
┌────┬──────────────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                 │ mode    │ pid     │ uptime   │ ↺      │ status│ cpu      │ mem      │ user     │
├────┼──────────────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ bgpalerter-dashboard │ fork    │ 12345   │ 2m       │ 0      │ online│ 0.5%     │ 150.0mb  │ onwave   │
└────┴──────────────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┘
```

✅ **Success Criteria:**
- Status: `online`
- Restarts (↺): `0`
- CPU: < 5%
- Memory: ~150MB

```bash
# Check HTTP endpoint
curl -I http://localhost:3000
```

**Expected Output:**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

```bash
# Check BGPalerter backend
curl http://localhost:8011/status
```

**Expected Output:**
```json
{
  "status": "running",
  "version": "1.x.x",
  "monitors": 19
}
```

---

## Troubleshooting

### Issue: PM2 Shows No Processes

**Symptoms:**
```bash
pm2 status
# Empty table - no processes
```

**Diagnosis:**
```bash
cd BGPalerter-frontend
./scripts/diagnose-dashboard.sh
```

**Recovery:**
```bash
cd BGPalerter-frontend
./scripts/recover-dashboard.sh
```

This automated recovery script will:
1. Stop all PM2 processes
2. Clean PM2 cache and logs
3. Rebuild dashboard from scratch
4. Regenerate environment configuration
5. Re-run database migrations
6. Start fresh PM2 process

**Recovery Time:** ~2 minutes

### Issue: Dashboard Not Responding on Port 3000

**Check if port is in use:**
```bash
netstat -tlnp | grep 3000
```

**Check PM2 logs:**
```bash
pm2 logs bgpalerter-dashboard --lines 100
```

**Common causes:**
- Application still starting up (wait 30s)
- Port 3000 already in use by another process
- Firewall blocking port 3000

**Solution:**
```bash
# Kill process on port 3000
sudo kill $(sudo lsof -t -i:3000)

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

### Issue: BGPalerter Backend Not Running

**Check Docker containers:**
```bash
cd ~/BGPalerter/BGPalerter
docker compose ps
```

**Expected Output:**
```
NAME                IMAGE               STATUS
bgpalerter          nttgin/bgpalerter   Up 5 minutes
```

**Restart backend:**
```bash
docker compose restart
```

**Check logs:**
```bash
docker compose logs --tail=100
```

---

## Post-Deployment Configuration

### 1. Enable PM2 Auto-Startup (Recommended)

Ensures dashboard survives server reboots:

```bash
pm2 startup
# Follow the instructions shown (run the command as sudo)

pm2 save
```

### 2. Configure Log Rotation (Recommended)

Prevents logs from filling disk:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### 3. Enable HTTPS (Optional)

For secure remote access:

```bash
cd ~/BGPalerter/deploy
sudo ./modules/nginx-https.sh

# Get Let's Encrypt certificate
sudo certbot --nginx -d your-domain.com
```

**Requirements:**
- Domain name pointing to server
- Ports 80 and 443 open in firewall

### 4. Configure Firewall (Recommended)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if using Nginx)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

**Note:** Dashboard runs on localhost:3000 by default. Use Nginx reverse proxy for external access.

---

## Maintenance

### Update Dashboard

```bash
cd ~/BGPalerter
git pull origin main

cd BGPalerter-frontend
pnpm install
pnpm build
pm2 restart bgpalerter-dashboard
```

### Update BGPalerter Backend

```bash
cd ~/BGPalerter/BGPalerter
docker compose pull
docker compose up -d
```

### View Logs

```bash
# Dashboard logs
pm2 logs bgpalerter-dashboard

# BGPalerter backend logs
cd ~/BGPalerter/BGPalerter
docker compose logs -f
```

### Backup Database

```bash
cd ~/BGPalerter/BGPalerter-frontend
cp bgpalerter.db bgpalerter.db.backup-$(date +%Y%m%d)
```

### Restore Database

```bash
cd ~/BGPalerter/BGPalerter-frontend
cp bgpalerter.db.backup-YYYYMMDD bgpalerter.db
pm2 restart bgpalerter-dashboard
```

---

## Useful Commands

| Command | Description |
|---------|-------------|
| `pm2 status` | Check dashboard process status |
| `pm2 logs bgpalerter-dashboard` | View dashboard logs (live) |
| `pm2 restart bgpalerter-dashboard` | Restart dashboard |
| `pm2 stop bgpalerter-dashboard` | Stop dashboard |
| `pm2 start bgpalerter-dashboard` | Start dashboard |
| `pm2 monit` | Real-time monitoring dashboard |
| `docker compose ps` | Check BGPalerter backend status |
| `docker compose logs -f` | View backend logs (live) |
| `curl http://localhost:3000` | Test dashboard HTTP |
| `curl http://localhost:8011/status` | Test backend API |

---

## Directory Structure

```
~/BGPalerter/
├── BGPalerter/                   # Backend
│   ├── config/
│   │   ├── config.yml           # BGPalerter configuration
│   │   └── prefixes.yml         # Monitored IP prefixes
│   ├── cache/                   # BGPalerter cache
│   ├── logs/                    # BGPalerter logs
│   └── docker-compose.yml       # Docker configuration
│
├── BGPalerter-frontend/         # Dashboard
│   ├── client/                  # React frontend
│   ├── server/                  # Express backend
│   ├── scripts/                 # Utility scripts
│   │   ├── diagnose-dashboard.sh
│   │   └── recover-dashboard.sh
│   ├── ecosystem.config.js      # PM2 configuration
│   ├── package.json             # Dependencies
│   ├── .env                     # Environment variables
│   └── bgpalerter.db            # SQLite database
│
├── deploy/                      # Deployment automation
│   ├── modules/                 # Deployment modules
│   └── orchestrator.py          # Deployment orchestrator
│
├── docs/                        # Documentation
│   ├── frontend/                # Dashboard documentation
│   ├── development/             # Development guides
│   └── analysis/                # Analysis reports
│
├── INSTALL.md                   # Detailed installation guide
├── PRODUCTION_DEPLOYMENT.md     # This file
└── README.md                    # Repository overview
```

---

## Support

**Documentation:**
- Installation Guide: `INSTALL.md`
- Repository README: `README.md`
- Frontend Documentation: `docs/frontend/`

**Diagnostic Tools:**
- `BGPalerter-frontend/scripts/diagnose-dashboard.sh` - 10-point system check
- `BGPalerter-frontend/scripts/recover-dashboard.sh` - Automated recovery

**GitHub:**
- Repository: https://github.com/Onwave-NetEng/BGPalerter
- Issues: https://github.com/Onwave-NetEng/BGPalerter/issues

**Contact:**
- Email: support@onwave.net

---

**Deployment Guide Version:** 3.4.2  
**Last Updated:** December 22, 2024  
**Tested On:** Ubuntu 24.04 LTS
