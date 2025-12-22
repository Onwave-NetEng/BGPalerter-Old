# BGPalerter Dashboard - Deployment Guide

This guide provides step-by-step instructions for deploying the BGPalerter Dashboard on your Ubuntu Linux x64 server.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Ubuntu Linux x64 server with Docker installed
- [ ] BGPalerter running in Docker (container name: `bgpalerter`)
- [ ] BGPalerter REST API enabled on port 8011
- [ ] Node.js 22+ installed
- [ ] pnpm package manager installed
- [ ] MySQL or TiDB database access
- [ ] (Optional) GitHub repository for BGPalerter configuration
- [ ] (Optional) Microsoft Teams webhook URL

## Step 1: Install Node.js and pnpm

If not already installed:

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installations
node --version  # Should show v22.x.x
pnpm --version  # Should show 10.x.x
```

## Step 2: Clone and Setup Dashboard

```bash
# Navigate to home directory
cd /home/ubuntu

# Clone the repository (replace with your actual repo URL)
git clone https://github.com/Onwave-NetEng/bgpalerter-dashboard.git
cd bgpalerter-dashboard

# Install dependencies
pnpm install
```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following configuration (adjust values for your environment):

```bash
# ============================================
# Database Configuration
# ============================================
DATABASE_URL=mysql://bgpalerter_user:your_password@localhost:3306/bgpalerter_dashboard

# ============================================
# BGPalerter Integration
# ============================================
# URL to BGPalerter REST API
BGPALERTER_API_URL=http://127.0.0.1:8011

# Path to BGPalerter config directory
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config

# ============================================
# GitHub Integration (Optional but Recommended)
# ============================================
# Path to BGPalerter repository
GITHUB_REPO_PATH=/home/ubuntu/BGPalerter

# GitHub repository URL
GITHUB_REMOTE_URL=https://github.com/Onwave-NetEng/BGPalerter.git

# Branch to commit to
GITHUB_BRANCH=main

# GitHub Personal Access Token (create at https://github.com/settings/tokens)
# Required scopes: repo
GITHUB_TOKEN=ghp_your_github_token_here

# Git commit author information
GITHUB_USER_NAME="BGPalerter Dashboard"
GITHUB_USER_EMAIL=bgpalerter@onwave.com

# ============================================
# Microsoft Teams Integration (Optional)
# ============================================
# Teams Incoming Webhook URL
# Create at: Teams Channel → Connectors → Incoming Webhook
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-url-here

# Enable/disable Teams notifications
TEAMS_NOTIFICATIONS_ENABLED=true

# Dashboard URL (used in Teams notification links)
DASHBOARD_URL=https://bgpalerter.onwave.com

# ============================================
# Application Configuration
# ============================================
# Node environment (development or production)
NODE_ENV=production

# Port for the dashboard (default: 3000)
PORT=3000
```

Save and exit (Ctrl+X, Y, Enter).

## Step 4: Setup Database

### Option A: Use Existing MySQL/TiDB

If you have a MySQL or TiDB database:

```bash
# Create database and user
mysql -u root -p << EOF
CREATE DATABASE bgpalerter_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'bgpalerter_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON bgpalerter_dashboard.* TO 'bgpalerter_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Initialize database schema
pnpm db:push
```

### Option B: Use Manus Built-in Database

If deploying on Manus platform, the `DATABASE_URL` is automatically provided.

## Step 5: Initialize Git Repository (if using GitHub integration)

```bash
# Navigate to BGPalerter directory
cd /home/ubuntu/BGPalerter

# Initialize git if not already done
git init

# Add remote
git remote add origin https://github.com/Onwave-NetEng/BGPalerter.git

# Configure git user
git config user.name "BGPalerter Dashboard"
git config user.email "bgpalerter@onwave.com"

# Make initial commit if needed
git add .
git commit -m "Initial BGPalerter configuration"
git push -u origin main
```

## Step 6: Verify BGPalerter Configuration

Ensure BGPalerter has the REST API enabled:

```bash
# Check BGPalerter config
cat /home/ubuntu/BGPalerter/config/config.yml | grep -A 3 "rest:"
```

Should show:
```yaml
rest:
  host: 0.0.0.0
  port: 8011
```

If not present, add it and restart BGPalerter:

```bash
# Edit config
nano /home/ubuntu/BGPalerter/config/config.yml

# Add the rest section and processMonitors section (see README.md)

# Restart BGPalerter
cd /home/ubuntu/BGPalerter
docker compose restart bgpalerter
```

## Step 7: Build the Dashboard

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Build for production
pnpm build
```

## Step 8: Create Systemd Service

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/bgpalerter-dashboard.service
```

Add the following content:

```ini
[Unit]
Description=BGPalerter Dashboard
Documentation=https://github.com/Onwave-NetEng/bgpalerter-dashboard
After=network.target mysql.service docker.service
Wants=mysql.service docker.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/bgpalerter-dashboard
ExecStart=/usr/bin/node /home/ubuntu/bgpalerter-dashboard/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bgpalerter-dashboard

# Load environment variables
EnvironmentFile=/home/ubuntu/bgpalerter-dashboard/.env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/ubuntu/bgpalerter-dashboard/logs
ReadWritePaths=/home/ubuntu/BGPalerter/config

[Install]
WantedBy=multi-user.target
```

Save and exit.

## Step 9: Start the Dashboard

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable bgpalerter-dashboard

# Start the service
sudo systemctl start bgpalerter-dashboard

# Check status
sudo systemctl status bgpalerter-dashboard
```

## Step 10: Setup Nginx Reverse Proxy (Recommended)

For production deployment, use Nginx as a reverse proxy:

```bash
# Install Nginx if not already installed
sudo apt-get update
sudo apt-get install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/bgpalerter-dashboard
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name bgpalerter.onwave.com;  # Replace with your domain

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name bgpalerter.onwave.com;  # Replace with your domain

    # SSL certificates (use Let's Encrypt or your own)
    ssl_certificate /etc/ssl/certs/bgpalerter.crt;
    ssl_certificate_key /etc/ssl/private/bgpalerter.key;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/bgpalerter-dashboard-access.log;
    error_log /var/log/nginx/bgpalerter-dashboard-error.log;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

Enable the site:

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bgpalerter-dashboard /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 11: Setup SSL with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d bgpalerter.onwave.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 12: Verify Deployment

1. **Check service status**:
   ```bash
   sudo systemctl status bgpalerter-dashboard
   ```

2. **Check logs**:
   ```bash
   sudo journalctl -u bgpalerter-dashboard -f
   ```

3. **Test API connectivity**:
   ```bash
   curl http://localhost:3000/api/trpc/bgpalerter.status
   ```

4. **Access dashboard**:
   Open your browser to `https://bgpalerter.onwave.com` (or your configured domain)

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u bgpalerter-dashboard -n 50 --no-pager

# Check environment file
cat /home/ubuntu/bgpalerter-dashboard/.env

# Verify permissions
ls -la /home/ubuntu/bgpalerter-dashboard/dist/
```

### Can't Connect to BGPalerter API

```bash
# Test BGPalerter API directly
curl http://127.0.0.1:8011/status

# Check BGPalerter container
docker ps | grep bgpalerter
docker logs bgpalerter --tail 50
```

### Database Connection Errors

```bash
# Test database connection
mysql -h localhost -u bgpalerter_user -p bgpalerter_dashboard

# Check database exists
mysql -u root -p -e "SHOW DATABASES LIKE 'bgpalerter_dashboard';"
```

### Git/GitHub Errors

```bash
# Test git repository
cd /home/ubuntu/BGPalerter
git status

# Test GitHub authentication
git ls-remote https://github.com/Onwave-NetEng/BGPalerter.git
```

## Maintenance

### Updating the Dashboard

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Pull latest changes
git pull origin main

# Install dependencies
pnpm install

# Run database migrations (if any)
pnpm db:push

# Rebuild
pnpm build

# Restart service
sudo systemctl restart bgpalerter-dashboard
```

### Viewing Logs

```bash
# Real-time logs
sudo journalctl -u bgpalerter-dashboard -f

# Last 100 lines
sudo journalctl -u bgpalerter-dashboard -n 100 --no-pager

# Logs from today
sudo journalctl -u bgpalerter-dashboard --since today
```

### Backup

```bash
# Backup database
mysqldump -u bgpalerter_user -p bgpalerter_dashboard > backup_$(date +%Y%m%d).sql

# Backup configuration
tar -czf bgpalerter-dashboard-config-$(date +%Y%m%d).tar.gz /home/ubuntu/bgpalerter-dashboard/.env
```

## Security Recommendations

1. **Firewall Configuration**:
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Regular Updates**:
   ```bash
   # Update system packages
   sudo apt-get update && sudo apt-get upgrade -y
   ```

3. **Secure Environment File**:
   ```bash
   # Restrict .env file permissions
   chmod 600 /home/ubuntu/bgpalerter-dashboard/.env
   ```

4. **Monitor Logs**:
   Set up log monitoring and alerting for suspicious activity.

## Support

For deployment issues:
- Check the troubleshooting section above
- Review logs: `sudo journalctl -u bgpalerter-dashboard -f`
- Contact: support@onwave.com
