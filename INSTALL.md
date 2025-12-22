# BGPalerter Installation Guide

**Quick, step-by-step guide to deploy BGPalerter monitoring system on Ubuntu servers.**

---

## Prerequisites

Before starting, ensure your server meets these requirements:

| Requirement | Specification |
|------------|---------------|
| **Operating System** | Ubuntu 18.04+ (x64) |
| **RAM** | Minimum 2GB, 4GB recommended |
| **Disk Space** | 10GB free space minimum |
| **Network** | Internet connection required |
| **Permissions** | Sudo access required |

---

## Installation Steps

### Step 1: Clone Repository

Clone the BGPalerter repository to your server.

```bash
git clone https://github.com/Onwave-NetEng/BGPalerter.git
cd BGPalerter
```

**Expected output:**
```
Cloning into 'BGPalerter'...
remote: Enumerating objects: ...
```

### Step 2: Run Automated Deployment

Navigate to the deployment directory and execute the orchestrator with all required modules.

```bash
cd deploy
./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard
```

**What this does:**
- Installs Docker Engine for BGPalerter backend container
- Installs Node.js 22 runtime environment
- Installs pnpm package manager
- Installs PM2 process manager
- Deploys BGPalerter backend monitoring engine
- Deploys BGPalerter dashboard web interface

**Expected duration:** 5-10 minutes depending on internet speed

**Expected output:**
```
============================================================
Executing module: docker
============================================================
Status: success
Progress: 100%
Message: Docker validated
✅ Module docker completed successfully

[... similar output for each module ...]

============================================================
DEPLOYMENT SUMMARY
============================================================
Total modules: 6
Successful: 6
Failed: 0

✅ docker: Docker validated
✅ nodejs: Node.js validated
✅ pnpm: pnpm validated
✅ pm2: PM2 validated
✅ bgpalerter: BGPalerter deployed
✅ dashboard: Dashboard deployed

🎉 All modules deployed successfully!
```

### Step 3: Validate Deployment

After deployment completes, verify both components are running correctly.

**Check BGPalerter Backend:**
```bash
curl http://localhost:8011/status
```

**Expected output:**
```json
{
  "status": "up",
  "version": "3.x.x",
  "monitors": 19
}
```

**Check Dashboard:**
```bash
curl -I http://localhost:3000
```

**Expected output:**
```
HTTP/1.1 200 OK
Content-Type: text/html
```

**Check Docker Container:**
```bash
sudo docker ps | grep bgpalerter
```

**Expected output:**
```
bgpalerter   nttgin/bgpalerter:latest   Up 2 minutes (healthy)
```

**Check PM2 Process:**
```bash
pm2 status
```

**Expected output:**
```
┌─────┬────────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ status  │ restart │ uptime   │
├─────┼────────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ bgpalerter-dashboard   │ online  │ 0       │ 2m       │
└─────┴────────────────────────┴─────────┴─────────┴──────────┘
```

### Step 4: Access Dashboard

Open your web browser and navigate to the dashboard.

**Local Access:**
```
http://localhost:3000
```

**Remote Access (if firewall configured):**
```
http://your-server-ip:3000
```

**Expected result:** Dashboard loads showing system status, monitored prefixes, and alert history.

---

## Testing

### Test 1: Backend API Connectivity

Verify the backend API is responding correctly.

```bash
# Get system status
curl http://localhost:8011/status

# Get monitored prefixes
curl http://localhost:8011/api/v1/prefixes

# Get monitors status
curl http://localhost:8011/api/v1/monitors
```

**Success criteria:** All endpoints return valid JSON responses without errors.

### Test 2: Dashboard Functionality

Open the dashboard in your browser and verify these features work correctly.

**System Status Card:**
- BGPalerter status shows "Healthy" (green)
- RIPE RIS status shows connection state
- Auto-refresh updates every 30 seconds

**Monitored Prefixes:**
- 19 Onwave UK Ltd prefixes displayed
- Prefix details show ASN 58173
- No active alerts on fresh installation

**Navigation:**
- Click "Routing Data" - page loads without errors
- Click "Alert Rules" - configuration page displays
- Click "Performance" - metrics dashboard loads
- Click "Help" - documentation displays

**Success criteria:** All navigation links work, no console errors, data displays correctly.

### Test 3: BGPalerter Monitoring

Verify BGPalerter is actively monitoring BGP announcements.

```bash
# Check BGPalerter logs
cd ../BGPalerter
sudo docker compose logs -f bgpalerter
```

**Expected log output:**
```
bgpalerter | [INFO] Connected to RIPE RIS
bgpalerter | [INFO] Monitoring 19 prefixes
bgpalerter | [INFO] Loaded 3 groups
bgpalerter | [INFO] All monitors started
```

**Success criteria:** Logs show successful RIPE RIS connection and active monitoring without errors.

### Test 4: Alert System (Optional)

Test the alert system by temporarily modifying a prefix configuration to trigger a test alert.

**Note:** This test is optional and should only be performed in non-production environments.

```bash
# Edit prefixes.yml to add a test prefix
cd ../BGPalerter/config
nano prefixes.yml

# Add test prefix (will trigger alert if announced):
# 192.0.2.0/24:
#   description: Test Prefix
#   asn: 64512
#   ignoreMorespecifics: false
#   ignore: false

# Restart BGPalerter
cd ..
sudo docker compose restart bgpalerter

# Monitor logs for alerts
sudo docker compose logs -f bgpalerter
```

**Success criteria:** BGPalerter processes the new configuration without errors. If the test prefix is announced, an alert appears in the dashboard.

---

## Troubleshooting

### Issue: Module Installation Fails

**Symptom:** Orchestrator stops with error message

**Solution:**
1. Check the error logs in the orchestrator output
2. Verify internet connectivity: `ping -c 3 google.com`
3. Ensure sudo access: `sudo -v`
4. Re-run the failed module individually:
   ```bash
   ./modules/<module-name>.sh
   ```

### Issue: BGPalerter Container Not Running

**Symptom:** `docker ps` shows no bgpalerter container

**Solution:**
1. Check Docker logs:
   ```bash
   cd ../BGPalerter
   sudo docker compose logs bgpalerter
   ```
2. Verify configuration files exist:
   ```bash
   ls -la config/
   ```
3. Restart container:
   ```bash
   sudo docker compose up -d
   ```

### Issue: Dashboard Not Accessible

**Symptom:** Browser shows "Connection refused" or "Cannot connect"

**Solution:**
1. Check PM2 status:
   ```bash
   pm2 status
   ```
2. Check PM2 logs:
   ```bash
   pm2 logs bgpalerter-dashboard
   ```
3. Restart dashboard:
   ```bash
   cd ../BGPalerter-frontend
   pm2 restart bgpalerter-dashboard
   ```
4. Verify port 3000 is not blocked:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

### Issue: Dashboard Shows "BGPalerter Disconnected"

**Symptom:** Dashboard loads but shows backend as disconnected

**Solution:**
1. Verify BGPalerter container is running:
   ```bash
   sudo docker ps | grep bgpalerter
   ```
2. Check BGPalerter API is responding:
   ```bash
   curl http://localhost:8011/status
   ```
3. Check dashboard environment configuration:
   ```bash
   cd ../BGPalerter-frontend
   cat .env | grep BGPALERTER_API_URL
   ```
4. Restart both services:
   ```bash
   cd ../BGPalerter
   sudo docker compose restart bgpalerter
   cd ../BGPalerter-frontend
   pm2 restart bgpalerter-dashboard
   ```

### Issue: Permission Denied Errors

**Symptom:** "Permission denied" errors during installation

**Solution:**
1. Ensure user has sudo privileges:
   ```bash
   sudo usermod -aG sudo $USER
   ```
2. Log out and log back in for group changes to take effect
3. For Docker permission errors after installation:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

---

## Post-Installation Configuration

### Configure HTTPS (Recommended for Production)

For secure remote access, configure HTTPS with Nginx reverse proxy and Let's Encrypt SSL certificate.

**Detailed guide:** See `BGPalerter-frontend/docs/HTTPS_SETUP.md`

**Quick setup:**
```bash
# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Configure Nginx (see HTTPS_SETUP.md for configuration)
sudo nano /etc/nginx/sites-available/bgpalerter

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart Nginx
sudo systemctl restart nginx
```

### Configure Webhook Notifications (Optional)

Set up webhook notifications to receive BGP alerts on Microsoft Teams, Slack, or Discord.

**Detailed guide:** See `BGPalerter-frontend/docs/WEBHOOK_SETUP.md`

**Configuration location:**
```bash
cd BGPalerter/config
nano config.yml
```

Add webhook URLs under the `hooks` section in `config.yml`.

### Configure Firewall (Recommended for Production)

Configure UFW firewall to restrict access to dashboard and API.

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS if using Nginx
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Restrict dashboard to specific IP (optional)
sudo ufw allow from your-office-ip to any port 3000

# Check status
sudo ufw status
```

### Enable Automatic Startup

Ensure services start automatically after server reboot.

**Docker (already configured):**
```bash
sudo systemctl enable docker
```

**PM2 (already configured during installation):**
```bash
pm2 startup
pm2 save
```

**Verify startup configuration:**
```bash
# Check Docker service
sudo systemctl is-enabled docker

# Check PM2 startup
sudo systemctl is-enabled pm2-$USER
```

---

## Maintenance

### Update BGPalerter

Pull the latest BGPalerter image and restart the container.

```bash
cd BGPalerter
sudo docker compose pull
sudo docker compose up -d
```

### Update Dashboard

Pull the latest code and rebuild the dashboard.

```bash
cd BGPalerter-frontend
git pull origin main
pnpm install
pnpm build
pm2 restart bgpalerter-dashboard
```

### View Logs

**BGPalerter logs:**
```bash
cd BGPalerter
sudo docker compose logs -f bgpalerter
```

**Dashboard logs:**
```bash
pm2 logs bgpalerter-dashboard
```

**System logs:**
```bash
journalctl -u docker -f
```

### Backup Configuration

Regularly backup your BGPalerter configuration and cache.

```bash
# Create backup directory
mkdir -p ~/bgpalerter-backups

# Backup configuration
tar -czf ~/bgpalerter-backups/config-$(date +%Y%m%d).tar.gz \
  BGPalerter/config/

# Backup cache (prevents duplicate alerts after restore)
tar -czf ~/bgpalerter-backups/cache-$(date +%Y%m%d).tar.gz \
  BGPalerter/cache/
```

### Restore from Backup

Restore configuration and cache from a previous backup.

```bash
# Stop services
cd BGPalerter
sudo docker compose down
cd ../BGPalerter-frontend
pm2 stop bgpalerter-dashboard

# Restore configuration
cd ~
tar -xzf ~/bgpalerter-backups/config-YYYYMMDD.tar.gz -C BGPalerter/

# Restore cache
tar -xzf ~/bgpalerter-backups/cache-YYYYMMDD.tar.gz -C BGPalerter/

# Start services
cd BGPalerter
sudo docker compose up -d
cd ../BGPalerter-frontend
pm2 start bgpalerter-dashboard
```

---

## Uninstallation

To completely remove BGPalerter from your server, follow these steps.

### Step 1: Stop Services

```bash
# Stop dashboard
pm2 delete bgpalerter-dashboard

# Stop BGPalerter
cd BGPalerter
sudo docker compose down
```

### Step 2: Remove Docker Images

```bash
# Remove BGPalerter image
sudo docker rmi nttgin/bgpalerter:latest

# Remove unused Docker resources
sudo docker system prune -a
```

### Step 3: Remove Files

```bash
# Remove BGPalerter directory
cd ~
rm -rf BGPalerter/
```

### Step 4: Uninstall Dependencies (Optional)

Only uninstall dependencies if they are not used by other applications.

```bash
# Uninstall PM2
sudo npm uninstall -g pm2

# Uninstall pnpm
sudo npm uninstall -g pnpm

# Uninstall Node.js
sudo apt-get remove --purge -y nodejs

# Uninstall Docker
sudo apt-get remove --purge -y docker-ce docker-ce-cli containerd.io
sudo rm -rf /var/lib/docker
sudo rm -rf /etc/docker
```

---

## Support

### Documentation

- **Main README:** `README.md` - Project overview and architecture
- **Deployment Guide:** `BGPalerter-frontend/DEPLOYMENT_GUIDE.md` - Comprehensive deployment documentation
- **HTTPS Setup:** `BGPalerter-frontend/docs/HTTPS_SETUP.md` - SSL certificate configuration
- **Webhook Setup:** `BGPalerter-frontend/docs/WEBHOOK_SETUP.md` - Alert notification configuration
- **Deployment Automation:** `deploy/README.md` - Module documentation

### Community

- **GitHub Issues:** https://github.com/Onwave-NetEng/BGPalerter/issues
- **BGPalerter Documentation:** https://github.com/nttgin/BGPalerter

### Getting Help

If you encounter issues not covered in this guide:

1. Check the troubleshooting section above
2. Review the detailed documentation in `BGPalerter-frontend/DEPLOYMENT_GUIDE.md`
3. Check BGPalerter logs for specific error messages
4. Search existing GitHub issues for similar problems
5. Create a new GitHub issue with detailed error logs and system information

---

## Quick Reference

### Essential Commands

| Task | Command |
|------|---------|
| **Check BGPalerter status** | `curl http://localhost:8011/status` |
| **Check dashboard status** | `pm2 status` |
| **View BGPalerter logs** | `sudo docker compose logs -f bgpalerter` |
| **View dashboard logs** | `pm2 logs bgpalerter-dashboard` |
| **Restart BGPalerter** | `sudo docker compose restart bgpalerter` |
| **Restart dashboard** | `pm2 restart bgpalerter-dashboard` |
| **Stop all services** | `sudo docker compose down && pm2 stop all` |
| **Start all services** | `sudo docker compose up -d && pm2 start all` |

### Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Dashboard** | http://localhost:3000 | Web interface |
| **BGPalerter API** | http://localhost:8011 | REST API |
| **BGPalerter Status** | http://localhost:8011/status | Health check |

### Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| **BGPalerter config** | `BGPalerter/config/config.yml` | Main configuration |
| **Monitored prefixes** | `BGPalerter/config/prefixes.yml` | IP prefixes to monitor |
| **Prefix groups** | `BGPalerter/config/groups.yml` | Prefix grouping |
| **Docker Compose** | `BGPalerter/docker-compose.yml` | Container configuration |
| **PM2 config** | `BGPalerter-frontend/ecosystem.config.js` | Process management |

---

**Installation Guide Version:** 1.0  
**Last Updated:** December 22, 2024  
**Compatible with:** BGPalerter v3.4-integrated
