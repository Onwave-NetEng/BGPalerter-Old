# BGPalerter Dashboard - Systems Administration Guide

**Document Version:** 1.0  
**Date:** December 19, 2024  
**Author:** Manus AI  
**Classification:** Operations Manual  
**Audience:** System Administrators, DevOps Engineers, IT Operations  

---

## Document Purpose

This comprehensive systems administration guide provides detailed procedures, best practices, and troubleshooting information for operating and maintaining the BGPalerter Dashboard in production environments. It covers daily operations, monitoring, maintenance, security, backup/recovery, and incident response.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Installation & Deployment](#2-installation--deployment)
3. [Daily Operations](#3-daily-operations)
4. [Monitoring & Alerting](#4-monitoring--alerting)
5. [Maintenance Procedures](#5-maintenance-procedures)
6. [Security Operations](#6-security-operations)
7. [Backup & Recovery](#7-backup--recovery)
8. [Troubleshooting](#8-troubleshooting)
9. [Performance Tuning](#9-performance-tuning)
10. [Incident Response](#10-incident-response)
11. [Change Management](#11-change-management)
12. [Operational Runbooks](#12-operational-runbooks)

---

## 1. System Overview

### 1.1 System Architecture

The BGPalerter Dashboard is a Node.js web application that provides a monitoring interface for BGPalerter, a BGP monitoring tool. The system consists of the following components running on a single Ubuntu Linux server:

**Application Components:**
- **Frontend:** React 19 single-page application served as static files
- **Backend:** Node.js 22 + Express server with tRPC API layer
- **Database:** SQLite for data persistence
- **Process Manager:** PM2 for application lifecycle management
- **Reverse Proxy:** Nginx for HTTPS termination and static file serving (recommended)

**External Dependencies:**
- **BGPalerter:** Existing BGP monitoring engine (localhost:8011)
- **RIPE RIS API:** External BGP routing data source (https://stat.ripe.net)
- **Webhook Services:** Microsoft Teams, Slack, Discord APIs (optional)

### 1.2 System Requirements

**Hardware Requirements:**
- **CPU:** 2 cores minimum, 4 cores recommended
- **Memory:** 2GB minimum, 4GB recommended
- **Disk:** 5GB free space minimum, 20GB recommended
- **Network:** 100 Mbps network interface

**Software Requirements:**
- **Operating System:** Ubuntu Linux 18.04 LTS or later (x64)
- **Node.js:** Version 22.x or later
- **pnpm:** Version 9.x or later
- **PM2:** Latest version
- **Nginx:** Latest version (for HTTPS)

**Network Requirements:**
- **Inbound:** Port 80 (HTTP), Port 443 (HTTPS)
- **Outbound:** Port 443 (HTTPS for external APIs)
- **Internal:** Port 3000 (dashboard), Port 8011 (BGPalerter)

### 1.3 File System Layout

```
/home/ubuntu/
├── BGPalerter/                    # Existing BGPalerter installation
│   ├── config/config.yml          # BGPalerter configuration
│   ├── logs/                      # BGPalerter logs
│   └── cache/                     # BGPalerter cache
├── bgpalerter-dashboard/          # Dashboard installation
│   ├── dist/                      # Built application
│   │   ├── public/                # Static frontend files
│   │   └── index.js               # Backend bundle
│   ├── database.sqlite            # Application database
│   ├── logs/                      # Application logs
│   │   ├── out.log                # Standard output
│   │   └── error.log              # Error output
│   ├── .env                       # Environment configuration
│   ├── ecosystem.config.js        # PM2 configuration
│   └── package.json               # Dependencies
├── server-scripts/                # Helper scripts
│   ├── dashboard-status.sh        # Check status
│   ├── dashboard-restart.sh       # Restart dashboard
│   └── dashboard-logs.sh          # View logs
└── bgpalerter-dashboard-backups/  # Automatic backups
    └── backup-YYYYMMDD-HHMMSS/    # Timestamped backups
```

### 1.4 Process Architecture

**PM2 Process:**
- **Process Name:** bgpalerter-dashboard
- **Script:** /home/ubuntu/bgpalerter-dashboard/dist/index.js
- **Working Directory:** /home/ubuntu/bgpalerter-dashboard
- **User:** ubuntu
- **Restart Policy:** Always restart on failure
- **Memory Limit:** 500MB (restart if exceeded)

**Nginx Process (if configured):**
- **Configuration:** /etc/nginx/sites-available/bgpalerter-dashboard
- **Enabled:** /etc/nginx/sites-enabled/bgpalerter-dashboard
- **Logs:** /var/log/nginx/bgpalerter-dashboard-*.log

---

## 2. Installation & Deployment

### 2.1 Initial Installation

The dashboard includes automated installation scripts that handle the complete deployment process.

**Prerequisites Verification:**

Before installation, verify all prerequisites are met:

```bash
# Run pre-deployment check
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/pre-deploy-check.sh
```

The script checks:
1. BGPalerter installation exists at ~/BGPalerter/
2. BGPalerter API is accessible at http://127.0.0.1:8011
3. Node.js version 18 or later is installed
4. pnpm package manager is installed
5. PM2 process manager is installed
6. Port 3000 is available
7. Sufficient disk space (minimum 2GB free)
8. Write permissions in installation directory
9. Network connectivity to external APIs
10. Dashboard files are present

**Automated Deployment:**

If all prerequisites are met, proceed with automated deployment:

```bash
# Run deployment script
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/deploy-safe.sh
```

The deployment script performs the following steps:

1. **User Confirmation:** Displays deployment plan and requests confirmation
2. **Backup Creation:** Creates timestamped backup of existing installation
3. **Directory Setup:** Ensures proper directory structure
4. **File Copying:** Copies dashboard files to installation directory
5. **Dependency Installation:** Runs `pnpm install` to install Node.js dependencies
6. **Environment Configuration:** Auto-configures environment variables from BGPalerter
7. **Database Migration:** Runs pending database migrations
8. **Application Build:** Runs `pnpm build` to compile frontend and backend
9. **PM2 Configuration:** Starts or restarts dashboard with PM2
10. **Helper Scripts:** Creates operational helper scripts in ~/server-scripts/

**Post-Installation Verification:**

After deployment completes, verify the installation:

```bash
# Check PM2 status
pm2 list

# View dashboard logs
pm2 logs bgpalerter-dashboard --lines 50

# Check HTTP endpoint
curl http://localhost:3000

# Access dashboard in browser
# http://your-server-ip:3000
```

### 2.2 Manual Installation

For manual installation or troubleshooting, follow these steps:

**Step 1: Install Dependencies**

```bash
cd /home/ubuntu/bgpalerter-dashboard
pnpm install
```

**Step 2: Configure Environment**

Create `.env` file:

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
DATABASE_URL=./database.sqlite
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
LOG_LEVEL=info
EOF
```

**Step 3: Run Database Migrations**

```bash
pnpm drizzle-kit migrate
```

**Step 4: Build Application**

```bash
pnpm build
```

**Step 5: Start with PM2**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 2.3 HTTPS Configuration

For production deployments, configure HTTPS with Nginx:

**Step 1: Install Nginx and Certbot**

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

**Step 2: Configure Nginx**

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/bgpalerter-dashboard
```

Add configuration (see `docs/HTTPS_SETUP.md` for complete configuration).

**Step 3: Enable Configuration**

```bash
sudo ln -s /etc/nginx/sites-available/bgpalerter-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Step 4: Obtain SSL Certificate**

```bash
sudo certbot --nginx -d bgp.yourdomain.com
```

**Step 5: Verify HTTPS**

```bash
curl -I https://bgp.yourdomain.com
```

### 2.4 Firewall Configuration

Configure firewall to allow necessary traffic:

```bash
# Allow HTTP (for Let's Encrypt verification)
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Block direct access to port 3000 (optional but recommended)
sudo ufw deny 3000/tcp

# Allow SSH (if not already allowed)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 3. Daily Operations

### 3.1 Starting the Dashboard

The dashboard should start automatically on system boot via PM2. To start manually:

```bash
# Start dashboard
pm2 start bgpalerter-dashboard

# Or use helper script
~/server-scripts/dashboard-restart.sh
```

### 3.2 Stopping the Dashboard

To stop the dashboard:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard

# Stop and remove from PM2
pm2 delete bgpalerter-dashboard
```

### 3.3 Restarting the Dashboard

To restart the dashboard:

```bash
# Restart dashboard
pm2 restart bgpalerter-dashboard

# Or use helper script
~/server-scripts/dashboard-restart.sh

# Restart with zero-downtime reload
pm2 reload bgpalerter-dashboard
```

### 3.4 Checking Status

To check dashboard status:

```bash
# PM2 status
pm2 list

# Detailed status
pm2 describe bgpalerter-dashboard

# Or use helper script
~/server-scripts/dashboard-status.sh

# Check HTTP endpoint
curl http://localhost:3000/api/health
```

### 3.5 Viewing Logs

To view dashboard logs:

```bash
# View real-time logs
pm2 logs bgpalerter-dashboard

# View last 100 lines
pm2 logs bgpalerter-dashboard --lines 100

# View error logs only
pm2 logs bgpalerter-dashboard --err

# Or use helper script
~/server-scripts/dashboard-logs.sh

# View log files directly
tail -f ~/bgpalerter-dashboard/logs/out.log
tail -f ~/bgpalerter-dashboard/logs/error.log
```

### 3.6 Monitoring Resource Usage

To monitor resource usage:

```bash
# PM2 monitoring dashboard
pm2 monit

# Process details
pm2 describe bgpalerter-dashboard

# System resource usage
top -p $(pm2 pid bgpalerter-dashboard)

# Memory usage
pm2 describe bgpalerter-dashboard | grep memory

# CPU usage
pm2 describe bgpalerter-dashboard | grep cpu
```

---

## 4. Monitoring & Alerting

### 4.1 Application Monitoring

**PM2 Monitoring:**

PM2 provides built-in monitoring capabilities:

```bash
# Real-time monitoring dashboard
pm2 monit

# Process metrics
pm2 describe bgpalerter-dashboard

# CPU and memory usage
pm2 list
```

**Key Metrics to Monitor:**

| Metric | Normal Range | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Memory Usage | 100-200 MB | > 400 MB | > 500 MB |
| CPU Usage | 1-5% | > 20% | > 50% |
| Restart Count | 0 | > 5/day | > 10/day |
| Uptime | Continuous | < 1 hour | < 10 minutes |
| Response Time | < 200ms | > 500ms | > 1000ms |

### 4.2 Log Monitoring

**Log Files to Monitor:**

1. **Application Logs:**
   - Location: `~/bgpalerter-dashboard/logs/out.log`
   - Contains: Info and debug messages
   - Monitor for: Normal operations, performance metrics

2. **Error Logs:**
   - Location: `~/bgpalerter-dashboard/logs/error.log`
   - Contains: Warnings and errors
   - Monitor for: Errors, exceptions, failures

3. **Nginx Access Logs (if configured):**
   - Location: `/var/log/nginx/bgpalerter-dashboard-access.log`
   - Contains: HTTP requests
   - Monitor for: Traffic patterns, unusual requests

4. **Nginx Error Logs (if configured):**
   - Location: `/var/log/nginx/bgpalerter-dashboard-error.log`
   - Contains: Nginx errors
   - Monitor for: Proxy errors, SSL issues

**Log Monitoring Commands:**

```bash
# Monitor error log in real-time
tail -f ~/bgpalerter-dashboard/logs/error.log

# Search for errors in last hour
grep -i error ~/bgpalerter-dashboard/logs/error.log | grep "$(date +%Y-%m-%d)" | tail -100

# Count errors by type
grep -i error ~/bgpalerter-dashboard/logs/error.log | awk '{print $4}' | sort | uniq -c | sort -rn

# Monitor Nginx errors
sudo tail -f /var/log/nginx/bgpalerter-dashboard-error.log
```

### 4.3 Dependency Monitoring

**BGPalerter Connectivity:**

Monitor BGPalerter API availability:

```bash
# Check BGPalerter API
curl -s http://127.0.0.1:8011/api/v1/status | jq .

# Monitor BGPalerter process
ps aux | grep BGPalerter

# Check BGPalerter logs
tail -f ~/BGPalerter/logs/bgpalerter.log
```

**External API Monitoring:**

Monitor external API connectivity:

```bash
# Check RIPE RIS API
curl -s "https://stat.ripe.net/data/routing-status/data.json?resource=203.0.113.0/24" | jq .

# Check webhook connectivity
curl -I https://outlook.office.com/
curl -I https://hooks.slack.com/
curl -I https://discord.com/
```

### 4.4 Database Monitoring

**Database Health:**

Monitor SQLite database:

```bash
# Check database file size
ls -lh ~/bgpalerter-dashboard/database.sqlite

# Check database integrity
sqlite3 ~/bgpalerter-dashboard/database.sqlite "PRAGMA integrity_check;"

# Check table sizes
sqlite3 ~/bgpalerter-dashboard/database.sqlite << 'EOF'
SELECT 
  name,
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=m.name) as tables,
  (SELECT COUNT(*) FROM pragma_table_info(m.name)) as columns
FROM sqlite_master m
WHERE type='table';
EOF

# Check alert count
sqlite3 ~/bgpalerter-dashboard/database.sqlite "SELECT COUNT(*) FROM bgp_alerts;"
```

### 4.5 Alerting Configuration

**PM2 Monitoring (Future Enhancement):**

Configure PM2 Plus for advanced monitoring and alerting:

```bash
# Install PM2 Plus
pm2 install pm2-server-monit

# Link to PM2 Plus
pm2 link <secret_key> <public_key>
```

**External Monitoring (Recommended):**

Integrate with external monitoring services:

1. **Uptime Monitoring:** Pingdom, UptimeRobot, StatusCake
2. **Log Aggregation:** Elastic Stack, Splunk, Datadog
3. **Error Tracking:** Sentry, Rollbar, Bugsnag
4. **APM:** New Relic, DataDog, AppDynamics

---

## 5. Maintenance Procedures

### 5.1 Regular Maintenance Schedule

Establish a regular maintenance schedule:

| Task | Frequency | Estimated Time | Downtime |
|------|-----------|----------------|----------|
| Log rotation | Daily (automatic) | N/A | None |
| Database backup | Daily | 1 minute | None |
| Security updates | Weekly | 10 minutes | None |
| Database vacuum | Weekly | 5 minutes | None |
| Log review | Weekly | 30 minutes | None |
| Dependency updates | Monthly | 30 minutes | 1 minute |
| Full system backup | Monthly | 10 minutes | None |
| Database integrity check | Monthly | 2 minutes | None |
| SSL certificate renewal | Quarterly (automatic) | N/A | None |
| Disaster recovery test | Quarterly | 2 hours | None |

### 5.2 Log Rotation

PM2 automatically rotates logs. To manually configure:

```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

**Manual Log Rotation:**

```bash
# Rotate logs manually
pm2 flush bgpalerter-dashboard

# Or use logrotate
sudo nano /etc/logrotate.d/bgpalerter-dashboard
```

Add configuration:

```
/home/ubuntu/bgpalerter-dashboard/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 5.3 Database Maintenance

**Weekly Vacuum:**

Reclaim space and optimize database:

```bash
# Create vacuum script
cat > ~/server-scripts/vacuum-database.sh << 'EOF'
#!/bin/bash
DB_FILE="/home/ubuntu/bgpalerter-dashboard/database.sqlite"
echo "Starting database vacuum..."
sqlite3 "$DB_FILE" "VACUUM;"
echo "Vacuum completed."
EOF

chmod +x ~/server-scripts/vacuum-database.sh

# Add to cron (weekly on Sunday at 3 AM)
crontab -e
# Add line:
0 3 * * 0 /home/ubuntu/server-scripts/vacuum-database.sh >> /home/ubuntu/bgpalerter-dashboard/logs/maintenance.log 2>&1
```

**Monthly Integrity Check:**

```bash
# Create integrity check script
cat > ~/server-scripts/check-database.sh << 'EOF'
#!/bin/bash
DB_FILE="/home/ubuntu/bgpalerter-dashboard/database.sqlite"
echo "Starting database integrity check..."
RESULT=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")
if [ "$RESULT" = "ok" ]; then
    echo "Database integrity: OK"
else
    echo "Database integrity: FAILED"
    echo "$RESULT"
    # Send alert
    echo "Database integrity check failed on $(hostname)" | mail -s "Database Alert" admin@example.com
fi
EOF

chmod +x ~/server-scripts/check-database.sh

# Add to cron (monthly on 1st at 4 AM)
crontab -e
# Add line:
0 4 1 * * /home/ubuntu/server-scripts/check-database.sh >> /home/ubuntu/bgpalerter-dashboard/logs/maintenance.log 2>&1
```

### 5.4 Security Updates

**Weekly Security Updates:**

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Update Node.js (if needed)
# Check current version
node --version

# Update via nvm (if using nvm)
nvm install 22
nvm use 22

# Or update via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Restart dashboard after Node.js update
pm2 restart bgpalerter-dashboard
```

### 5.5 Dependency Updates

**Monthly Dependency Updates:**

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Check for outdated dependencies
pnpm outdated

# Update dependencies (minor and patch versions)
pnpm update

# Rebuild application
pnpm build

# Restart dashboard
pm2 restart bgpalerter-dashboard

# Verify functionality
curl http://localhost:3000
```

**Major Version Updates:**

For major version updates, follow change management procedures:

1. Review changelog for breaking changes
2. Test in development environment
3. Create backup before update
4. Schedule maintenance window
5. Update dependencies
6. Run tests
7. Deploy to production
8. Monitor for issues
9. Rollback if necessary

### 5.6 SSL Certificate Renewal

**Automatic Renewal:**

Certbot automatically renews certificates. Verify automatic renewal:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Check certificate expiry
sudo certbot certificates
```

**Manual Renewal:**

If automatic renewal fails:

```bash
# Renew certificates
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx

# Verify renewal
sudo certbot certificates
```

---

## 6. Security Operations

### 6.1 Access Control

**User Management:**

The dashboard uses role-based access control with three roles:

| Role | Permissions |
|------|------------|
| **Viewer** | View dashboard, alerts, rules (read-only) |
| **Operator** | Viewer permissions + acknowledge alerts |
| **Admin** | Operator permissions + manage rules, configure notifications |

**Managing Users:**

Users are created automatically on first login via OAuth. To change user roles:

```bash
# Connect to database
sqlite3 ~/bgpalerter-dashboard/database.sqlite

# List users
SELECT id, name, email, role FROM users;

# Change user role to admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

# Change user role to operator
UPDATE users SET role = 'operator' WHERE email = 'user@example.com';

# Change user role to viewer
UPDATE users SET role = 'viewer' WHERE email = 'user@example.com';

# Exit
.quit
```

**SSH Access Control:**

Restrict SSH access to authorized personnel:

```bash
# Edit SSH configuration
sudo nano /etc/ssh/sshd_config

# Recommended settings:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AllowUsers ubuntu admin

# Restart SSH
sudo systemctl restart sshd
```

### 6.2 Firewall Management

**UFW Firewall:**

Manage firewall rules:

```bash
# Check firewall status
sudo ufw status verbose

# Allow specific IP
sudo ufw allow from 192.168.1.100 to any port 443

# Remove rule
sudo ufw delete allow from 192.168.1.100 to any port 443

# Reset firewall (caution!)
sudo ufw reset
```

### 6.3 Security Auditing

**Regular Security Audits:**

Perform regular security audits:

```bash
# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log | tail -20

# Check for sudo usage
sudo grep "sudo" /var/log/auth.log | tail -20

# Check open ports
sudo netstat -tulpn

# Check running processes
ps aux | grep node

# Check file permissions
ls -la ~/bgpalerter-dashboard/

# Check for unauthorized changes
sudo find /home/ubuntu/bgpalerter-dashboard -type f -mtime -1
```

**Audit Logs:**

Review dashboard audit logs:

```bash
# Connect to database
sqlite3 ~/bgpalerter-dashboard/database.sqlite

# View recent audit logs
SELECT 
  datetime(created_at, 'unixepoch') as time,
  u.name as user,
  action,
  resource_type,
  resource_id
FROM audit_logs a
JOIN users u ON a.user_id = u.id
ORDER BY created_at DESC
LIMIT 50;

# Exit
.quit
```

### 6.4 Secret Rotation

**Rotating JWT Secret:**

Rotate JWT secret periodically (invalidates all sessions):

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Update .env file
cd ~/bgpalerter-dashboard
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" .env

# Restart dashboard
pm2 restart bgpalerter-dashboard

# Users will need to log in again
```

**Rotating Webhook URLs:**

Rotate webhook URLs every 90 days:

1. Create new webhook in Teams/Slack/Discord
2. Log in to dashboard as admin
3. Navigate to Administration → Notification Settings
4. Update webhook URL
5. Test webhook
6. Save settings
7. Delete old webhook in Teams/Slack/Discord

### 6.5 Security Incident Response

**Suspected Compromise:**

If you suspect a security compromise:

1. **Isolate:** Disconnect server from network (if severe)
2. **Assess:** Review logs for unauthorized access
3. **Contain:** Change all passwords and secrets
4. **Eradicate:** Remove malicious code or backdoors
5. **Recover:** Restore from clean backup if necessary
6. **Document:** Record all actions taken
7. **Report:** Notify security team and stakeholders

**Commands for Investigation:**

```bash
# Check active connections
sudo netstat -tulpn | grep ESTABLISHED

# Check recent logins
last -20

# Check current logged-in users
w

# Check command history
history | tail -50

# Check for suspicious processes
ps aux | grep -v grep | grep -E "nc|ncat|netcat|bash|sh"

# Check crontab for unauthorized jobs
crontab -l
sudo crontab -l

# Check for suspicious files
sudo find /tmp -type f -mtime -1
sudo find /var/tmp -type f -mtime -1
```

---

## 7. Backup & Recovery

### 7.1 Backup Strategy

**Automated Backups:**

The deployment script creates automatic backups before each deployment. Additionally, configure daily database backups:

```bash
# Create backup script
cat > ~/server-scripts/backup-database.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/bgpalerter-dashboard-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DB_FILE="/home/ubuntu/bgpalerter-dashboard/database.sqlite"
BACKUP_FILE="$BACKUP_DIR/database-$TIMESTAMP.sqlite"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create backup
cp "$DB_FILE" "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "database-*.sqlite.gz" -mtime +30 -delete

echo "Backup completed: database-$TIMESTAMP.sqlite.gz"
EOF

chmod +x ~/server-scripts/backup-database.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/ubuntu/server-scripts/backup-database.sh >> /home/ubuntu/bgpalerter-dashboard/logs/backup.log 2>&1
```

**Full System Backup:**

Create full system backup monthly:

```bash
# Create full backup script
cat > ~/server-scripts/backup-full.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/bgpalerter-dashboard-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SOURCE_DIR="/home/ubuntu/bgpalerter-dashboard"
BACKUP_FILE="$BACKUP_DIR/full-backup-$TIMESTAMP.tar.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create full backup (exclude node_modules and dist)
tar -czf "$BACKUP_FILE" \
  --exclude="$SOURCE_DIR/node_modules" \
  --exclude="$SOURCE_DIR/dist" \
  -C /home/ubuntu bgpalerter-dashboard

# Delete backups older than 90 days
find "$BACKUP_DIR" -name "full-backup-*.tar.gz" -mtime +90 -delete

echo "Full backup completed: full-backup-$TIMESTAMP.tar.gz"
EOF

chmod +x ~/server-scripts/backup-full.sh

# Add to cron (monthly on 1st at 1 AM)
crontab -e
# Add line:
0 1 1 * * /home/ubuntu/server-scripts/backup-full.sh >> /home/ubuntu/bgpalerter-dashboard/logs/backup.log 2>&1
```

### 7.2 Offsite Backups

**Recommended Offsite Backup Solutions:**

1. **AWS S3:** Cost-effective object storage
2. **Google Cloud Storage:** Reliable cloud storage
3. **Backblaze B2:** Affordable cloud backup
4. **rsync to remote server:** Self-hosted option

**Example: Sync to AWS S3**

```bash
# Install AWS CLI
sudo apt-get install -y awscli

# Configure AWS credentials
aws configure

# Create sync script
cat > ~/server-scripts/sync-to-s3.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/ubuntu/bgpalerter-dashboard-backups"
S3_BUCKET="s3://your-backup-bucket/bgpalerter-dashboard/"

# Sync backups to S3
aws s3 sync "$BACKUP_DIR" "$S3_BUCKET" --storage-class STANDARD_IA

echo "Sync to S3 completed"
EOF

chmod +x ~/server-scripts/sync-to-s3.sh

# Add to cron (daily at 3 AM)
crontab -e
# Add line:
0 3 * * * /home/ubuntu/server-scripts/sync-to-s3.sh >> /home/ubuntu/bgpalerter-dashboard/logs/backup.log 2>&1
```

### 7.3 Recovery Procedures

**Database Recovery:**

To restore database from backup:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard

# List available backups
ls -lh ~/bgpalerter-dashboard-backups/database-*.sqlite.gz

# Restore specific backup
gunzip -c ~/bgpalerter-dashboard-backups/database-20241219-020000.sqlite.gz > ~/bgpalerter-dashboard/database.sqlite

# Restart dashboard
pm2 restart bgpalerter-dashboard

# Verify functionality
curl http://localhost:3000
```

**Full Application Recovery:**

To restore full application from backup:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard

# List available backups
ls -lh ~/bgpalerter-dashboard-backups/full-backup-*.tar.gz

# Backup current installation (just in case)
mv ~/bgpalerter-dashboard ~/bgpalerter-dashboard-old

# Restore from backup
tar -xzf ~/bgpalerter-dashboard-backups/full-backup-20241201-010000.tar.gz -C /home/ubuntu

# Reinstall dependencies
cd ~/bgpalerter-dashboard
pnpm install

# Rebuild application
pnpm build

# Restart dashboard
pm2 restart bgpalerter-dashboard

# Verify functionality
curl http://localhost:3000
```

**Rollback to Previous Version:**

Use the rollback script:

```bash
cd ~/bgpalerter-dashboard
bash scripts/rollback.sh

# Follow prompts to select backup
```

### 7.4 Disaster Recovery Testing

**Quarterly DR Test:**

Perform disaster recovery test quarterly:

1. **Document current state:**
   ```bash
   pm2 list > ~/dr-test-before.txt
   sqlite3 ~/bgpalerter-dashboard/database.sqlite "SELECT COUNT(*) FROM bgp_alerts;" >> ~/dr-test-before.txt
   ```

2. **Simulate failure:**
   ```bash
   pm2 stop bgpalerter-dashboard
   mv ~/bgpalerter-dashboard/database.sqlite ~/bgpalerter-dashboard/database.sqlite.old
   ```

3. **Restore from backup:**
   ```bash
   gunzip -c ~/bgpalerter-dashboard-backups/database-latest.sqlite.gz > ~/bgpalerter-dashboard/database.sqlite
   pm2 restart bgpalerter-dashboard
   ```

4. **Verify recovery:**
   ```bash
   pm2 list > ~/dr-test-after.txt
   sqlite3 ~/bgpalerter-dashboard/database.sqlite "SELECT COUNT(*) FROM bgp_alerts;" >> ~/dr-test-after.txt
   curl http://localhost:3000
   ```

5. **Document results:**
   - Recovery time
   - Data loss (if any)
   - Issues encountered
   - Lessons learned

6. **Restore original state:**
   ```bash
   pm2 stop bgpalerter-dashboard
   mv ~/bgpalerter-dashboard/database.sqlite.old ~/bgpalerter-dashboard/database.sqlite
   pm2 restart bgpalerter-dashboard
   ```

---

## 8. Troubleshooting

### 8.1 Common Issues

#### Issue: Dashboard Not Accessible

**Symptoms:**
- Cannot access dashboard in browser
- Connection refused or timeout

**Diagnosis:**

```bash
# Check if dashboard is running
pm2 list

# Check dashboard logs
pm2 logs bgpalerter-dashboard --lines 50

# Check if port 3000 is listening
sudo netstat -tulpn | grep 3000

# Check firewall
sudo ufw status

# Check Nginx (if configured)
sudo nginx -t
sudo systemctl status nginx
```

**Resolution:**

```bash
# If dashboard not running
pm2 restart bgpalerter-dashboard

# If port not listening
# Check for errors in logs
pm2 logs bgpalerter-dashboard --err

# If firewall blocking
sudo ufw allow 3000/tcp

# If Nginx error
sudo nginx -t
sudo systemctl restart nginx
```

#### Issue: High Memory Usage

**Symptoms:**
- Dashboard using > 400MB memory
- PM2 restarting dashboard frequently
- System slow or unresponsive

**Diagnosis:**

```bash
# Check memory usage
pm2 describe bgpalerter-dashboard | grep memory

# Check system memory
free -h

# Check for memory leaks
pm2 logs bgpalerter-dashboard | grep -i memory
```

**Resolution:**

```bash
# Restart dashboard
pm2 restart bgpalerter-dashboard

# If problem persists, increase memory limit
nano ~/bgpalerter-dashboard/ecosystem.config.js
# Change max_memory_restart to '1G'

# Reload PM2 config
pm2 reload ecosystem.config.js

# If still high, check for memory leaks in logs
# Consider upgrading server memory
```

#### Issue: BGPalerter Connection Failed

**Symptoms:**
- Dashboard shows "BGPalerter Unavailable"
- No alerts or monitors displayed
- Logs show connection errors

**Diagnosis:**

```bash
# Check BGPalerter is running
ps aux | grep BGPalerter

# Check BGPalerter API
curl http://127.0.0.1:8011/api/v1/status

# Check BGPalerter logs
tail -f ~/BGPalerter/logs/bgpalerter.log

# Check dashboard logs
pm2 logs bgpalerter-dashboard | grep -i bgpalerter
```

**Resolution:**

```bash
# Start BGPalerter if not running
cd ~/BGPalerter
npm start

# Check BGPalerter configuration
cat ~/BGPalerter/config/config.yml | grep -A 5 "rest:"

# Verify API port in dashboard config
cat ~/bgpalerter-dashboard/.env | grep BGPALERTER_API_URL

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

#### Issue: Webhook Notifications Not Working

**Symptoms:**
- Alerts not appearing in Teams/Slack/Discord
- Webhook test fails
- Logs show webhook errors

**Diagnosis:**

```bash
# Check notification settings in database
sqlite3 ~/bgpalerter-dashboard/database.sqlite << 'EOF'
SELECT 
  teams_enabled,
  slack_enabled,
  discord_enabled,
  severity_filter
FROM notification_settings;
EOF

# Check dashboard logs for webhook errors
pm2 logs bgpalerter-dashboard | grep -i webhook

# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

**Resolution:**

1. **Verify webhook URL is correct:**
   - Log in to dashboard as admin
   - Navigate to Administration → Notification Settings
   - Re-enter webhook URL
   - Test webhook

2. **Check severity filter:**
   - Ensure severity filter includes alert severity
   - Example: If filter is ["critical"], only critical alerts are sent

3. **Check network connectivity:**
   ```bash
   # Test connectivity to webhook service
   curl -I https://outlook.office.com/
   curl -I https://hooks.slack.com/
   curl -I https://discord.com/
   ```

4. **Check firewall:**
   ```bash
   # Ensure outbound HTTPS is allowed
   sudo ufw status
   ```

#### Issue: Database Locked

**Symptoms:**
- Errors about database being locked
- Slow database operations
- Timeout errors

**Diagnosis:**

```bash
# Check for database locks
sqlite3 ~/bgpalerter-dashboard/database.sqlite "PRAGMA locking_mode;"

# Check database integrity
sqlite3 ~/bgpalerter-dashboard/database.sqlite "PRAGMA integrity_check;"

# Check for long-running queries
ps aux | grep sqlite
```

**Resolution:**

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard

# Wait for locks to clear
sleep 5

# Restart dashboard
pm2 restart bgpalerter-dashboard

# If problem persists, check database integrity
sqlite3 ~/bgpalerter-dashboard/database.sqlite "PRAGMA integrity_check;"

# If integrity check fails, restore from backup
```

### 8.2 Log Analysis

**Analyzing Error Logs:**

```bash
# Find most common errors
grep -i error ~/bgpalerter-dashboard/logs/error.log | \
  awk '{print $4}' | \
  sort | uniq -c | sort -rn | head -10

# Find errors in last hour
grep -i error ~/bgpalerter-dashboard/logs/error.log | \
  grep "$(date +%Y-%m-%d)" | \
  grep "$(date +%H):" | \
  tail -50

# Find webhook errors
grep -i webhook ~/bgpalerter-dashboard/logs/error.log | tail -20

# Find database errors
grep -i database ~/bgpalerter-dashboard/logs/error.log | tail -20

# Find authentication errors
grep -i auth ~/bgpalerter-dashboard/logs/error.log | tail -20
```

**Analyzing Performance:**

```bash
# Find slow requests
grep "duration" ~/bgpalerter-dashboard/logs/out.log | \
  awk '{print $NF}' | \
  sort -rn | head -20

# Find memory warnings
grep -i memory ~/bgpalerter-dashboard/logs/out.log | tail -20

# Find CPU warnings
grep -i cpu ~/bgpalerter-dashboard/logs/out.log | tail -20
```

### 8.3 Performance Issues

**Slow Dashboard:**

1. **Check resource usage:**
   ```bash
   pm2 monit
   top -p $(pm2 pid bgpalerter-dashboard)
   ```

2. **Check database size:**
   ```bash
   ls -lh ~/bgpalerter-dashboard/database.sqlite
   ```

3. **Vacuum database:**
   ```bash
   ~/server-scripts/vacuum-database.sh
   ```

4. **Check for slow queries:**
   ```bash
   # Enable query logging (development only)
   # Check logs for slow queries
   ```

5. **Restart dashboard:**
   ```bash
   pm2 restart bgpalerter-dashboard
   ```

**High CPU Usage:**

1. **Check for infinite loops:**
   ```bash
   pm2 logs bgpalerter-dashboard | grep -i loop
   ```

2. **Check for excessive polling:**
   ```bash
   pm2 logs bgpalerter-dashboard | grep -i poll
   ```

3. **Restart dashboard:**
   ```bash
   pm2 restart bgpalerter-dashboard
   ```

4. **If problem persists, check for bugs in recent changes**

---

## 9. Performance Tuning

### 9.1 Application Tuning

**PM2 Configuration:**

Optimize PM2 settings:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bgpalerter-dashboard',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    // Performance tuning
    node_args: '--max-old-space-size=512',
    kill_timeout: 5000,
    listen_timeout: 10000,
  }],
};
```

**Node.js Tuning:**

Optimize Node.js settings:

```bash
# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=512"

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

### 9.2 Database Tuning

**SQLite Optimization:**

Optimize SQLite settings:

```bash
# Create optimization script
cat > ~/server-scripts/optimize-database.sh << 'EOF'
#!/bin/bash
DB_FILE="/home/ubuntu/bgpalerter-dashboard/database.sqlite"

echo "Optimizing database..."

# Analyze database
sqlite3 "$DB_FILE" "ANALYZE;"

# Optimize database
sqlite3 "$DB_FILE" "PRAGMA optimize;"

# Vacuum database
sqlite3 "$DB_FILE" "VACUUM;"

echo "Optimization completed."
EOF

chmod +x ~/server-scripts/optimize-database.sh

# Run optimization
~/server-scripts/optimize-database.sh
```

**Index Optimization:**

Verify indexes are being used:

```bash
sqlite3 ~/bgpalerter-dashboard/database.sqlite << 'EOF'
-- Check indexes
SELECT name, tbl_name FROM sqlite_master WHERE type='index';

-- Analyze query plan
EXPLAIN QUERY PLAN
SELECT * FROM bgp_alerts WHERE severity = 'critical' ORDER BY created_at DESC LIMIT 50;
EOF
```

### 9.3 Nginx Tuning

**Nginx Configuration:**

Optimize Nginx for performance:

```nginx
# /etc/nginx/nginx.conf

worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Client settings
client_max_body_size 10M;
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 65;
send_timeout 10;

# Buffer settings
client_body_buffer_size 128k;
client_header_buffer_size 1k;
large_client_header_buffers 4 16k;
output_buffers 1 32k;
postpone_output 1460;
```

**Nginx Caching:**

Enable caching for static assets:

```nginx
# /etc/nginx/sites-available/bgpalerter-dashboard

location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 9.4 Network Tuning

**TCP Tuning:**

Optimize TCP settings for better network performance:

```bash
# Edit sysctl configuration
sudo nano /etc/sysctl.conf

# Add or modify these settings:
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq

# Apply settings
sudo sysctl -p
```

---

## 10. Incident Response

### 10.1 Incident Classification

Classify incidents by severity:

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| **Critical** | Complete service outage | Immediate | Dashboard down, database corrupted |
| **High** | Major functionality impaired | < 1 hour | BGPalerter connection lost, webhooks failing |
| **Medium** | Minor functionality impaired | < 4 hours | Slow performance, intermittent errors |
| **Low** | Cosmetic or minor issues | < 24 hours | UI glitches, non-critical warnings |

### 10.2 Incident Response Procedures

**Critical Incident Response:**

1. **Detect:** Monitor alerts, user reports, automated checks
2. **Assess:** Determine severity and impact
3. **Notify:** Alert on-call engineer and stakeholders
4. **Investigate:** Review logs, check status, identify root cause
5. **Mitigate:** Implement temporary fix or workaround
6. **Resolve:** Implement permanent fix
7. **Verify:** Confirm resolution and normal operation
8. **Document:** Record incident details and resolution
9. **Review:** Post-incident review to prevent recurrence

**Incident Response Checklist:**

```
[ ] Incident detected and logged
[ ] Severity assessed
[ ] Stakeholders notified
[ ] Investigation started
[ ] Root cause identified
[ ] Mitigation implemented
[ ] Resolution implemented
[ ] Verification completed
[ ] Documentation updated
[ ] Post-incident review scheduled
```

### 10.3 Escalation Procedures

**Escalation Path:**

1. **Level 1:** System Administrator (first responder)
2. **Level 2:** Senior System Administrator or DevOps Engineer
3. **Level 3:** Development Team or Vendor Support
4. **Level 4:** Management and Executive Team

**Escalation Criteria:**

- Incident unresolved after 1 hour
- Incident severity increases
- Multiple systems affected
- Data loss or corruption suspected
- Security breach suspected

### 10.4 Communication Plan

**Internal Communication:**

- **Status Updates:** Every 30 minutes during critical incidents
- **Resolution Notification:** Immediate notification when resolved
- **Post-Incident Report:** Within 24 hours of resolution

**External Communication:**

- **User Notification:** If service is unavailable for > 15 minutes
- **Status Page:** Update status page with incident details
- **Email Notification:** Send email to affected users

---

## 11. Change Management

### 11.1 Change Types

Classify changes by risk:

| Change Type | Risk | Approval Required | Testing Required | Rollback Plan Required |
|-------------|------|-------------------|------------------|----------------------|
| **Emergency** | High | Post-implementation | Minimal | Yes |
| **Standard** | Medium | Manager | Full | Yes |
| **Minor** | Low | Self-approval | Basic | Optional |

### 11.2 Change Process

**Standard Change Process:**

1. **Request:** Submit change request with details
2. **Review:** Manager reviews and approves/rejects
3. **Plan:** Create implementation plan and rollback plan
4. **Test:** Test changes in development environment
5. **Schedule:** Schedule maintenance window
6. **Notify:** Notify users of scheduled maintenance
7. **Implement:** Execute change during maintenance window
8. **Verify:** Verify changes work as expected
9. **Document:** Update documentation
10. **Close:** Close change request

**Change Request Template:**

```
Change Request #: CR-YYYYMMDD-NNN
Requested By: [Name]
Date: [YYYY-MM-DD]
Priority: [Low/Medium/High]

Description:
[Describe the change]

Justification:
[Why is this change needed?]

Impact:
[What systems/users are affected?]

Implementation Plan:
[Step-by-step implementation]

Rollback Plan:
[How to undo if needed]

Testing:
[Testing performed]

Maintenance Window:
[Date and time]

Approval:
[Manager signature]
```

### 11.3 Maintenance Windows

**Scheduling Maintenance:**

1. **Identify low-traffic period:** Typically early morning or weekends
2. **Notify users:** At least 24 hours in advance
3. **Prepare:** Test changes, prepare rollback
4. **Execute:** Implement changes during window
5. **Verify:** Confirm successful implementation
6. **Notify:** Inform users of completion

**Maintenance Notification Template:**

```
Subject: Scheduled Maintenance - BGPalerter Dashboard

Dear Users,

We will be performing scheduled maintenance on the BGPalerter Dashboard:

Date: [YYYY-MM-DD]
Time: [HH:MM - HH:MM] [Timezone]
Duration: Approximately [X] hours
Impact: Dashboard will be unavailable during this time

Changes:
- [List of changes]

We apologize for any inconvenience.

Thank you,
IT Operations Team
```

---

## 12. Operational Runbooks

### 12.1 Daily Operations Runbook

**Morning Checklist:**

```bash
# 1. Check dashboard status
pm2 list

# 2. Check for errors in last 24 hours
grep -i error ~/bgpalerter-dashboard/logs/error.log | grep "$(date +%Y-%m-%d)" | wc -l

# 3. Check BGPalerter connectivity
curl -s http://127.0.0.1:8011/api/v1/status | jq .

# 4. Check disk space
df -h

# 5. Check memory usage
free -h

# 6. Check for security updates
sudo apt-get update
sudo apt-get upgrade -s | grep -i security
```

**Evening Checklist:**

```bash
# 1. Review error logs
tail -100 ~/bgpalerter-dashboard/logs/error.log

# 2. Check backup status
ls -lh ~/bgpalerter-dashboard-backups/ | tail -5

# 3. Check database size
ls -lh ~/bgpalerter-dashboard/database.sqlite

# 4. Check alert statistics
sqlite3 ~/bgpalerter-dashboard/database.sqlite "SELECT COUNT(*) FROM bgp_alerts WHERE date(created_at, 'unixepoch') = date('now');"
```

### 12.2 Weekly Operations Runbook

**Weekly Checklist:**

```bash
# 1. Review logs for patterns
grep -i error ~/bgpalerter-dashboard/logs/error.log | awk '{print $4}' | sort | uniq -c | sort -rn

# 2. Check security updates
sudo apt-get update
sudo apt-get upgrade -y

# 3. Vacuum database
~/server-scripts/vacuum-database.sh

# 4. Review user activity
sqlite3 ~/bgpalerter-dashboard/database.sqlite << 'EOF'
SELECT 
  u.name,
  COUNT(a.id) as actions
FROM users u
LEFT JOIN audit_logs a ON u.id = a.user_id
WHERE a.created_at >= unixepoch('now', '-7 days')
GROUP BY u.id
ORDER BY actions DESC;
EOF

# 5. Check webhook delivery success rate
grep -i webhook ~/bgpalerter-dashboard/logs/out.log | grep "$(date +%Y-%m-%d)" | grep -c "success"
grep -i webhook ~/bgpalerter-dashboard/logs/error.log | grep "$(date +%Y-%m-%d)" | grep -c "failed"
```

### 12.3 Monthly Operations Runbook

**Monthly Checklist:**

```bash
# 1. Full system backup
~/server-scripts/backup-full.sh

# 2. Database integrity check
~/server-scripts/check-database.sh

# 3. Update dependencies
cd ~/bgpalerter-dashboard
pnpm outdated
pnpm update
pnpm build
pm2 restart bgpalerter-dashboard

# 4. Review and rotate logs
# (Automatic with logrotate)

# 5. Review disk usage
du -sh ~/bgpalerter-dashboard/*
du -sh ~/bgpalerter-dashboard-backups/*

# 6. Review performance metrics
sqlite3 ~/bgpalerter-dashboard/database.sqlite << 'EOF'
SELECT 
  metric_type,
  AVG(metric_value) as avg_value,
  MAX(metric_value) as max_value
FROM performance_metrics
WHERE timestamp >= unixepoch('now', '-30 days')
GROUP BY metric_type;
EOF

# 7. Security audit
sudo grep "Failed password" /var/log/auth.log | grep "$(date +%Y-%m)" | wc -l
```

### 12.4 Quarterly Operations Runbook

**Quarterly Checklist:**

```bash
# 1. Disaster recovery test
# See section 7.4

# 2. SSL certificate check
sudo certbot certificates

# 3. Review and update documentation
# Review all operational documentation
# Update as needed based on changes

# 4. Capacity planning review
# Review resource usage trends
# Plan for capacity upgrades if needed

# 5. Security review
# Review user access
# Review firewall rules
# Review audit logs
# Rotate secrets if needed

# 6. Performance review
# Review performance metrics
# Identify optimization opportunities
# Implement performance improvements
```

---

## Appendix A: Quick Reference

### Common Commands

```bash
# Dashboard Operations
pm2 list                              # List all processes
pm2 describe bgpalerter-dashboard     # Detailed process info
pm2 restart bgpalerter-dashboard      # Restart dashboard
pm2 logs bgpalerter-dashboard         # View logs
pm2 monit                             # Resource monitoring

# Database Operations
sqlite3 ~/bgpalerter-dashboard/database.sqlite  # Connect to database
~/server-scripts/vacuum-database.sh             # Vacuum database
~/server-scripts/check-database.sh              # Check integrity

# Backup Operations
~/server-scripts/backup-database.sh   # Backup database
~/server-scripts/backup-full.sh       # Full backup
bash scripts/rollback.sh              # Rollback to backup

# Log Operations
tail -f ~/bgpalerter-dashboard/logs/out.log    # View output log
tail -f ~/bgpalerter-dashboard/logs/error.log  # View error log
pm2 flush bgpalerter-dashboard                 # Rotate logs

# System Operations
sudo systemctl status nginx           # Check Nginx status
sudo systemctl reload nginx           # Reload Nginx config
sudo ufw status                       # Check firewall
df -h                                 # Check disk space
free -h                               # Check memory
```

### Important File Locations

```
Application:
  /home/ubuntu/bgpalerter-dashboard/

Configuration:
  /home/ubuntu/bgpalerter-dashboard/.env
  /home/ubuntu/bgpalerter-dashboard/ecosystem.config.js

Database:
  /home/ubuntu/bgpalerter-dashboard/database.sqlite

Logs:
  /home/ubuntu/bgpalerter-dashboard/logs/out.log
  /home/ubuntu/bgpalerter-dashboard/logs/error.log

Backups:
  /home/ubuntu/bgpalerter-dashboard-backups/

Scripts:
  /home/ubuntu/server-scripts/
  /home/ubuntu/bgpalerter-dashboard/scripts/

Nginx (if configured):
  /etc/nginx/sites-available/bgpalerter-dashboard
  /etc/nginx/sites-enabled/bgpalerter-dashboard
  /var/log/nginx/bgpalerter-dashboard-*.log
```

### Emergency Contacts

```
System Administrator: [Name] - [Email] - [Phone]
DevOps Engineer: [Name] - [Email] - [Phone]
Development Team: [Email] - [Slack Channel]
Management: [Name] - [Email] - [Phone]
```

---

## Appendix B: Troubleshooting Flowcharts

### Dashboard Not Accessible

```
Dashboard not accessible
  ├─ Is PM2 running?
  │   ├─ No → Start PM2: pm2 start ecosystem.config.js
  │   └─ Yes → Continue
  ├─ Is dashboard process running?
  │   ├─ No → Start dashboard: pm2 restart bgpalerter-dashboard
  │   └─ Yes → Continue
  ├─ Is port 3000 listening?
  │   ├─ No → Check logs: pm2 logs bgpalerter-dashboard
  │   └─ Yes → Continue
  ├─ Is firewall allowing traffic?
  │   ├─ No → Allow port: sudo ufw allow 3000/tcp
  │   └─ Yes → Continue
  ├─ Is Nginx configured correctly?
  │   ├─ No → Fix config: sudo nginx -t
  │   └─ Yes → Continue
  └─ Escalate to Level 2 support
```

### High Memory Usage

```
High memory usage (> 400MB)
  ├─ Check current usage: pm2 describe bgpalerter-dashboard
  ├─ Is usage > 500MB?
  │   ├─ Yes → PM2 will auto-restart
  │   └─ No → Continue
  ├─ Check for memory leaks in logs
  ├─ Restart dashboard: pm2 restart bgpalerter-dashboard
  ├─ Monitor for 1 hour
  ├─ Is memory still high?
  │   ├─ Yes → Increase limit or investigate code
  │   └─ No → Resolved
  └─ Document findings
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-19 | Manus AI | Initial release |

---

**End of Systems Administration Guide**
