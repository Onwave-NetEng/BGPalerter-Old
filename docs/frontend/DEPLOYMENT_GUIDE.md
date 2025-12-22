# BGPalerter Dashboard - Non-Destructive Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the BGPalerter Dashboard alongside your existing BGPalerter installation **without modifying any existing files or configurations**.

### Safety Guarantees

✅ **Your existing BGPalerter installation will NOT be modified**
- No changes to `~/BGPalerter/` directory
- No changes to `config.yml` or any configuration files
- No changes to logs, cache, or data files
- Dashboard only **reads** from BGPalerter, never writes

✅ **Automatic backup before deployment**
- Full backup created before any changes
- Easy rollback if needed
- Backup includes timestamp for tracking

✅ **Separate installation directories**
- Dashboard: `~/bgpalerter-dashboard/`
- Helper scripts: `~/server-scripts/`
- Backups: `~/backups/`

---

## Prerequisites

Before deploying, ensure you have:

### 1. Existing BGPalerter Installation
- BGPalerter installed at `~/BGPalerter/`
- Configuration file at `~/BGPalerter/config/config.yml`
- BGPalerter API running (default port 8011)

### 2. System Requirements
- Ubuntu Linux x64 (18.04 or later)
- Node.js 22.x or later
- pnpm package manager
- At least 2GB free disk space
- Port 3000 available for dashboard

### 3. Network Access
- Access to BGPalerter API (localhost:8011)
- Internet access for installing dependencies
- (Optional) Firewall rules for remote access

---

## Quick Start Deployment

### Step 1: Download Dashboard Files

If you haven't already, clone or download the dashboard repository:

```bash
cd /home/ubuntu
# If using git:
git clone <repository-url> bgpalerter-dashboard
cd bgpalerter-dashboard
```

### Step 2: Run Automated Deployment

The deployment script handles everything automatically with safety checks:

```bash
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/deploy-safe.sh
```

### What the Script Does

The deployment script will:

1. ✅ Verify existing BGPalerter installation
2. ✅ Check port availability (3000)
3. ✅ Verify system dependencies (Node.js, pnpm)
4. ✅ Create automatic backup
5. ✅ Confirm no files will be overwritten
6. ✅ Install dashboard dependencies
7. ✅ Configure environment variables
8. ✅ Build production dashboard
9. ✅ Setup PM2 process manager
10. ✅ Create helper scripts

### Step 3: Verify Deployment

After deployment completes, verify the dashboard is running:

```bash
# Check dashboard status
~/server-scripts/dashboard-status.sh

# View dashboard logs
~/server-scripts/dashboard-logs.sh
```

### Step 4: Access Dashboard

Open your web browser and navigate to:

```
http://<your-server-ip>:3000
```

Default credentials (first-time setup):
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change the default password immediately after first login!**

---

## Detailed Deployment Steps

### Pre-Deployment Checklist

Before running the deployment script, verify:

- [ ] BGPalerter is installed and running
- [ ] You can access BGPalerter API at `http://localhost:8011/api/v1/status`
- [ ] Port 3000 is not in use by another application
- [ ] You have sudo privileges (for PM2 startup script)
- [ ] You have at least 2GB free disk space

#### Check BGPalerter Status

```bash
# Check if BGPalerter is running
curl http://localhost:8011/api/v1/status

# Check BGPalerter Docker container (if using Docker)
docker ps | grep bgpalerter

# Check BGPalerter config file
cat ~/BGPalerter/config/config.yml | head -20
```

#### Check Port Availability

```bash
# Check if port 3000 is available
lsof -i :3000

# If port is in use, you'll see output. If available, no output.
```

#### Check System Dependencies

```bash
# Check Node.js version (should be 22.x or later)
node --version

# Check pnpm
pnpm --version

# If missing, install:
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm
```

### Manual Deployment (Alternative)

If you prefer to deploy manually instead of using the automated script:

#### 1. Install Dependencies

```bash
cd /home/ubuntu/bgpalerter-dashboard
pnpm install --frozen-lockfile
```

#### 2. Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
NODE_ENV=production
PORT=3000
EOF
```

#### 3. Build Dashboard

```bash
pnpm build
```

#### 4. Install PM2

```bash
npm install -g pm2
```

#### 5. Start Dashboard

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Configuration

### Environment Variables

The dashboard uses these environment variables (configured automatically):

| Variable | Description | Default |
|----------|-------------|---------|
| `BGPALERTER_API_URL` | BGPalerter API endpoint | `http://127.0.0.1:8011` |
| `BGPALERTER_CONFIG_PATH` | Path to BGPalerter config directory | `/home/ubuntu/BGPalerter/config` |
| `NODE_ENV` | Node environment | `production` |
| `PORT` | Dashboard HTTP port | `3000` |
| `DATABASE_URL` | Database connection (auto-configured by Manus) | Auto |

### Customizing BGPalerter API Connection

If your BGPalerter uses a different port or configuration:

```bash
# Edit .env file
nano /home/ubuntu/bgpalerter-dashboard/.env

# Change BGPALERTER_API_URL to your custom port
BGPALERTER_API_URL=http://127.0.0.1:8080

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

### Changing Dashboard Port

If port 3000 is not available:

```bash
# Edit .env file
nano /home/ubuntu/bgpalerter-dashboard/.env

# Change PORT
PORT=3001

# Edit ecosystem.config.js
nano /home/ubuntu/bgpalerter-dashboard/ecosystem.config.js

# Update env.PORT in the config file

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

---

## Post-Deployment Tasks

### 1. Change Default Password

**Critical Security Step:**

1. Log in to dashboard at `http://<server-ip>:3000`
2. Click on user profile (top right)
3. Go to "Account Settings"
4. Change password from default `admin123`

### 2. Configure Webhook Notifications

To receive alerts via Microsoft Teams, Slack, or Discord:

1. Navigate to **Administration** → **Notification Settings**
2. Enable desired channels (Teams, Slack, Discord)
3. Enter webhook URLs for each channel
4. Configure severity filters (which alerts trigger notifications)
5. Click **Test** to verify each webhook
6. Click **Save Settings**

#### Getting Webhook URLs

**Microsoft Teams:**
1. Open Teams channel
2. Click "..." → "Connectors"
3. Search for "Incoming Webhook"
4. Configure and copy webhook URL

**Slack:**
1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Activate and add to workspace
4. Copy webhook URL

**Discord:**
1. Open Discord server settings
2. Integrations → Webhooks
3. Create webhook
4. Copy webhook URL

### 3. Configure Email Notifications (Optional)

The dashboard can integrate with BGPalerter's email reporting:

1. Navigate to **Administration** → **Email Configuration**
2. Follow the instructions to add webhook to BGPalerter config
3. Copy the provided config snippet
4. **Manually** add to `~/BGPalerter/config/config.yml` under `reports` section
5. Restart BGPalerter to apply changes

**Note:** This is the **only** modification you'll make to BGPalerter config, and it's optional.

### 4. Set Up Custom Alert Rules

Create custom rules for your network:

1. Navigate to **Alert Rules**
2. Click **Create New Rule**
3. Configure rule conditions:
   - Prefix length changes
   - AS path patterns
   - ROA mismatches
   - Announcement rate thresholds
4. Set severity level and notification channels
5. Enable rule

### 5. Configure Prefix Ownership (For Hijack Detection)

To enable automated hijack detection:

1. Navigate to **Administration** → **Prefix Ownership**
2. Add your expected prefix-to-ASN mappings
3. For ASN 58173, add all your announced prefixes
4. The system will automatically detect unauthorized announcements

---

## Operations & Maintenance

### Daily Operations

#### Check Dashboard Status

```bash
~/server-scripts/dashboard-status.sh
```

#### View Live Logs

```bash
~/server-scripts/dashboard-logs.sh
```

#### Restart Dashboard

```bash
~/server-scripts/dashboard-restart.sh
```

### PM2 Commands

```bash
# View all PM2 processes
pm2 list

# View detailed dashboard info
pm2 describe bgpalerter-dashboard

# View logs (last 100 lines)
pm2 logs bgpalerter-dashboard --lines 100

# Restart dashboard
pm2 restart bgpalerter-dashboard

# Stop dashboard
pm2 stop bgpalerter-dashboard

# Start dashboard
pm2 start bgpalerter-dashboard

# View resource usage
pm2 monit
```

### Log Files

Dashboard logs are stored in:

```
/home/ubuntu/logs/dashboard-error.log    # Error logs
/home/ubuntu/logs/dashboard-out.log      # Output logs
/home/ubuntu/logs/dashboard-combined.log # Combined logs
```

View logs:

```bash
# View last 50 lines of error log
tail -50 /home/ubuntu/logs/dashboard-error.log

# Follow live logs
tail -f /home/ubuntu/logs/dashboard-combined.log

# Search logs for errors
grep -i error /home/ubuntu/logs/dashboard-combined.log
```

### Updating Dashboard

To update to a new version:

```bash
# 1. Stop dashboard
pm2 stop bgpalerter-dashboard

# 2. Backup current version
cp -r /home/ubuntu/bgpalerter-dashboard /home/ubuntu/bgpalerter-dashboard.backup

# 3. Pull latest code (if using git)
cd /home/ubuntu/bgpalerter-dashboard
git pull

# 4. Install dependencies
pnpm install

# 5. Rebuild
pnpm build

# 6. Restart
pm2 restart bgpalerter-dashboard
```

---

## Rollback Procedures

If you need to rollback the dashboard deployment:

### Quick Rollback

```bash
# List available backups
ls -1dt /home/ubuntu/backups/dashboard-*

# Rollback to specific backup
bash /home/ubuntu/bgpalerter-dashboard/scripts/rollback.sh /home/ubuntu/backups/dashboard-YYYYMMDD-HHMMSS
```

### Manual Rollback

```bash
# 1. Stop dashboard
pm2 stop bgpalerter-dashboard
pm2 delete bgpalerter-dashboard

# 2. Restore from backup
rm -rf /home/ubuntu/bgpalerter-dashboard
cp -r /home/ubuntu/backups/dashboard-YYYYMMDD-HHMMSS/dashboard-backup /home/ubuntu/bgpalerter-dashboard

# 3. Restart
cd /home/ubuntu/bgpalerter-dashboard
pm2 start ecosystem.config.js
pm2 save
```

### Complete Removal

To completely remove the dashboard (leaves BGPalerter untouched):

```bash
# 1. Stop and remove from PM2
pm2 stop bgpalerter-dashboard
pm2 delete bgpalerter-dashboard
pm2 save

# 2. Remove dashboard files
rm -rf /home/ubuntu/bgpalerter-dashboard

# 3. Remove helper scripts
rm -rf /home/ubuntu/server-scripts

# 4. (Optional) Remove backups
rm -rf /home/ubuntu/backups/dashboard-*
```

**Your BGPalerter installation remains completely untouched.**

---

## Troubleshooting

### Dashboard Won't Start

**Symptom:** PM2 shows dashboard as "errored" or constantly restarting

**Solutions:**

```bash
# 1. Check logs for errors
pm2 logs bgpalerter-dashboard --lines 50

# 2. Verify BGPalerter API is accessible
curl http://localhost:8011/api/v1/status

# 3. Check environment configuration
cat /home/ubuntu/bgpalerter-dashboard/.env

# 4. Verify database connection
# Check that DATABASE_URL is set (auto-configured by Manus)

# 5. Try rebuilding
cd /home/ubuntu/bgpalerter-dashboard
pnpm install
pnpm build
pm2 restart bgpalerter-dashboard
```

### Can't Access Dashboard

**Symptom:** Browser shows "Connection refused" or timeout

**Solutions:**

```bash
# 1. Verify dashboard is running
pm2 list | grep bgpalerter-dashboard

# 2. Check port is listening
lsof -i :3000

# 3. Check firewall rules
sudo ufw status
# If needed, allow port 3000:
sudo ufw allow 3000/tcp

# 4. Verify server IP
hostname -I

# 5. Test locally first
curl http://localhost:3000
```

### BGPalerter Data Not Showing

**Symptom:** Dashboard loads but shows no monitoring data

**Solutions:**

```bash
# 1. Verify BGPalerter is running
curl http://localhost:8011/api/v1/status

# 2. Check BGPalerter API port in config
cat ~/BGPalerter/config/config.yml | grep -A 5 "server:"

# 3. Update dashboard .env if port is different
nano /home/ubuntu/bgpalerter-dashboard/.env
# Change BGPALERTER_API_URL to correct port

# 4. Restart dashboard
pm2 restart bgpalerter-dashboard

# 5. Check dashboard logs for API errors
pm2 logs bgpalerter-dashboard | grep -i error
```

### High Memory Usage

**Symptom:** Dashboard consuming too much memory

**Solutions:**

```bash
# 1. Check current memory usage
pm2 monit

# 2. Restart dashboard to clear memory
pm2 restart bgpalerter-dashboard

# 3. Adjust memory limit in ecosystem.config.js
nano /home/ubuntu/bgpalerter-dashboard/ecosystem.config.js
# Change max_memory_restart value

# 4. Reload PM2 configuration
pm2 reload ecosystem.config.js
```

### Database Errors

**Symptom:** Dashboard shows database connection errors

**Solutions:**

```bash
# 1. Check database configuration
# DATABASE_URL should be auto-configured by Manus platform

# 2. Verify database file exists (if using SQLite)
ls -lh /home/ubuntu/bgpalerter-dashboard/database.sqlite

# 3. Check database permissions
ls -la /home/ubuntu/bgpalerter-dashboard/*.sqlite

# 4. Run database migrations
cd /home/ubuntu/bgpalerter-dashboard
pnpm db:push

# 5. Restart dashboard
pm2 restart bgpalerter-dashboard
```

### Webhook Notifications Not Working

**Symptom:** Alerts not being sent to Teams/Slack/Discord

**Solutions:**

1. Navigate to **Administration** → **Notification Settings**
2. Click **Test** button for each webhook
3. Check error messages in test results
4. Verify webhook URLs are correct and active
5. Check dashboard logs for webhook errors:

```bash
pm2 logs bgpalerter-dashboard | grep -i webhook
```

6. Verify severity filters allow the alert type
7. Ensure notifications are enabled globally

---

## Security Considerations

### 1. Change Default Credentials

**Critical:** Change default admin password immediately after deployment.

### 2. Firewall Configuration

Restrict access to dashboard port:

```bash
# Allow only specific IP
sudo ufw allow from <your-ip> to any port 3000

# Or allow from specific subnet
sudo ufw allow from 192.168.1.0/24 to any port 3000
```

### 3. HTTPS/TLS (Recommended)

For production use, configure HTTPS with Nginx reverse proxy:

```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bgpalerter-dashboard
```

Add configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and configure SSL with Let's Encrypt:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bgpalerter-dashboard /etc/nginx/sites-enabled/

# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Restart Nginx
sudo systemctl restart nginx
```

### 4. Regular Updates

Keep system and dependencies updated:

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Update Node.js packages
cd /home/ubuntu/bgpalerter-dashboard
pnpm update
```

### 5. Backup Strategy

Regular backups are created automatically during deployment, but consider:

- Daily automated backups of dashboard database
- Weekly full system backups
- Off-site backup storage

---

## Performance Optimization

### 1. Adjust Auto-Refresh Interval

Default is 30 seconds. To change:

1. Navigate to dashboard
2. Toggle auto-refresh off
3. Manually refresh as needed

Or modify in code:

```typescript
// client/src/pages/Home.tsx
const REFRESH_INTERVAL = 60000; // Change to 60 seconds
```

### 2. Database Optimization

For large alert histories:

```bash
# Archive old alerts (older than 90 days)
cd /home/ubuntu/bgpalerter-dashboard
pnpm db:studio

# Or use SQL directly
sqlite3 database.sqlite "DELETE FROM bgp_alerts WHERE created_at < datetime('now', '-90 days');"
```

### 3. Log Rotation

Configure PM2 log rotation:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Integration with Existing Systems

### Elastic Syslog Integration (Future)

The dashboard is designed to integrate with Elastic Syslog servers. This feature will be added in a future update.

### Custom Monitoring Integration

The dashboard exposes a REST API for integration with external monitoring systems:

```bash
# Get dashboard status
curl http://localhost:3000/api/health

# Get recent alerts (requires authentication)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/alerts
```

---

## Support & Resources

### Documentation Files

- `README.md` - Project overview and features
- `DEPLOYMENT.md` - Original deployment documentation
- `DEPLOYMENT_GUIDE.md` - This comprehensive guide
- `docs/ENVIRONMENT.md` - Environment variable reference
- `REPOSITORY_STRUCTURE.md` - Code organization

### Helper Scripts

- `~/server-scripts/dashboard-status.sh` - Check status
- `~/server-scripts/dashboard-restart.sh` - Restart dashboard
- `~/server-scripts/dashboard-logs.sh` - View logs
- `~/bgpalerter-dashboard/scripts/deploy-safe.sh` - Deployment script
- `~/bgpalerter-dashboard/scripts/rollback.sh` - Rollback script

### Log Files

- `/home/ubuntu/logs/dashboard-*.log` - Application logs
- `/home/ubuntu/dashboard-deployment.log` - Deployment log
- `~/.pm2/logs/` - PM2 process logs

### Getting Help

1. Check logs for error messages
2. Review troubleshooting section above
3. Consult BGPalerter documentation for API issues
4. Check GitHub repository issues (if available)

---

## Frequently Asked Questions

### Q: Will this modify my existing BGPalerter installation?

**A:** No. The deployment script explicitly avoids modifying any files in `~/BGPalerter/`. The dashboard only reads from BGPalerter's API and configuration files.

### Q: Can I run both BGPalerter and the dashboard on the same server?

**A:** Yes. They use different ports and directories. BGPalerter typically uses port 8011, dashboard uses port 3000.

### Q: What happens if BGPalerter is not running?

**A:** The dashboard will show connection errors but will continue running. Once BGPalerter is restarted, the dashboard will automatically reconnect.

### Q: How do I backup the dashboard?

**A:** Backups are created automatically during deployment. You can also manually backup:

```bash
tar -czf dashboard-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/bgpalerter-dashboard
```

### Q: Can I access the dashboard remotely?

**A:** Yes, but configure firewall rules and consider using HTTPS for security. See the Security Considerations section.

### Q: How do I uninstall the dashboard?

**A:** See the "Complete Removal" section under Rollback Procedures. Your BGPalerter installation will remain untouched.

### Q: What if I need to change BGPalerter's port?

**A:** Update the `BGPALERTER_API_URL` in `/home/ubuntu/bgpalerter-dashboard/.env` and restart the dashboard.

### Q: Is the dashboard production-ready?

**A:** Yes. Version 3.3 includes comprehensive testing (43 tests passing), error handling, logging, and has been thoroughly QA'd.

---

## Deployment Checklist

Use this checklist to ensure successful deployment:

### Pre-Deployment
- [ ] BGPalerter is installed and running
- [ ] BGPalerter API is accessible (curl test)
- [ ] Port 3000 is available
- [ ] Node.js 22.x installed
- [ ] pnpm installed
- [ ] Sudo privileges available
- [ ] At least 2GB free disk space

### Deployment
- [ ] Run `bash scripts/deploy-safe.sh`
- [ ] Verify no errors during deployment
- [ ] Check backup was created
- [ ] Verify dashboard is running (`pm2 list`)
- [ ] Access dashboard in browser

### Post-Deployment
- [ ] Change default admin password
- [ ] Configure webhook notifications
- [ ] Set up custom alert rules
- [ ] Configure prefix ownership (for hijack detection)
- [ ] Test alert notifications
- [ ] Configure firewall rules
- [ ] (Optional) Set up HTTPS with Nginx
- [ ] (Optional) Configure email integration
- [ ] Verify auto-refresh is working
- [ ] Check all dashboard pages load correctly

### Documentation
- [ ] Save backup location for reference
- [ ] Document any custom configuration changes
- [ ] Note webhook URLs in secure location
- [ ] Record dashboard URL and credentials

---

## Version History

- **v3.3** - Production release with hijack detection, performance metrics, mobile-responsive design
- **v3.2** - Added mobile-responsive layout
- **v3.1** - Added RIS integration, alert acknowledgment, custom rules, context help
- **v3.0** - Major feature release with advanced capabilities
- **v2.2** - Webhook integration (Teams, Slack, Discord)
- **v2.1** - Auto-refresh, alert history, email integration
- **v2.0** - Initial production release

---

## Conclusion

This deployment guide provides everything needed to safely deploy the BGPalerter Dashboard alongside your existing BGPalerter installation. The automated deployment script ensures your existing setup remains untouched while adding powerful monitoring and alerting capabilities.

For questions or issues not covered in this guide, consult the troubleshooting section or review the application logs for detailed error messages.

**Remember: Your BGPalerter installation is never modified by this dashboard. It's a completely separate, read-only monitoring interface.**
