# HTTPS/SSL Setup Guide for BGPalerter Dashboard

## Overview

This guide provides step-by-step instructions for securing your BGPalerter Dashboard with HTTPS using Nginx as a reverse proxy and Let's Encrypt for free SSL certificates.

---

## Prerequisites

- BGPalerter Dashboard deployed and running on port 3000
- Domain name pointing to your server (e.g., `bgp.yourdomain.com`)
- Root or sudo access to the server
- Ports 80 and 443 open in firewall

---

## Step 1: Install Nginx

```bash
# Update package list
sudo apt-get update

# Install Nginx
sudo apt-get install -y nginx

# Verify installation
nginx -v

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Step 2: Configure Nginx Reverse Proxy

Create Nginx configuration for the dashboard:

```bash
sudo nano /etc/nginx/sites-available/bgpalerter-dashboard
```

Add the following configuration:

```nginx
# BGPalerter Dashboard - HTTP (will redirect to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name bgp.yourdomain.com;  # Replace with your domain

    # Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# BGPalerter Dashboard - HTTPS (will be configured by Certbot)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bgp.yourdomain.com;  # Replace with your domain

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/bgp.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/bgp.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support (for future features)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # Logging
    access_log /var/log/nginx/bgpalerter-dashboard-access.log;
    error_log /var/log/nginx/bgpalerter-dashboard-error.log;
}
```

**Important:** Replace `bgp.yourdomain.com` with your actual domain name.

---

## Step 3: Enable Nginx Configuration

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/bgpalerter-dashboard /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Step 4: Install Certbot (Let's Encrypt)

```bash
# Install Certbot and Nginx plugin
sudo apt-get install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

---

## Step 5: Obtain SSL Certificate

```bash
# Obtain and install SSL certificate
sudo certbot --nginx -d bgp.yourdomain.com

# Follow the prompts:
# 1. Enter email address for renewal notifications
# 2. Agree to Terms of Service
# 3. Choose whether to share email with EFF
# 4. Certbot will automatically configure Nginx
```

**What Certbot does:**
- Obtains SSL certificate from Let's Encrypt
- Automatically updates Nginx configuration
- Sets up automatic HTTPS redirect
- Configures SSL parameters

---

## Step 6: Test HTTPS Configuration

```bash
# Check Nginx configuration
sudo nginx -t

# Reload Nginx to apply changes
sudo systemctl reload nginx

# Test HTTPS access
curl -I https://bgp.yourdomain.com

# Check SSL certificate
openssl s_client -connect bgp.yourdomain.com:443 -servername bgp.yourdomain.com < /dev/null
```

Access dashboard in browser: `https://bgp.yourdomain.com`

---

## Step 7: Configure Automatic Certificate Renewal

Let's Encrypt certificates expire after 90 days. Certbot automatically sets up renewal.

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew
```

Certbot automatically renews certificates when they have 30 days or less remaining.

---

## Step 8: Configure Firewall

```bash
# Allow HTTP (for Let's Encrypt verification)
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Block direct access to port 3000 (optional but recommended)
sudo ufw deny 3000/tcp

# Reload firewall
sudo ufw reload

# Check firewall status
sudo ufw status
```

---

## Alternative Configuration: Self-Signed Certificate

For internal/testing use, you can create a self-signed certificate:

```bash
# Create self-signed certificate
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/bgpalerter-dashboard.key \
  -out /etc/nginx/ssl/bgpalerter-dashboard.crt

# Update Nginx configuration
sudo nano /etc/nginx/sites-available/bgpalerter-dashboard
```

Update SSL certificate paths:

```nginx
ssl_certificate /etc/nginx/ssl/bgpalerter-dashboard.crt;
ssl_certificate_key /etc/nginx/ssl/bgpalerter-dashboard.key;
```

**Note:** Self-signed certificates will show browser warnings. Use Let's Encrypt for production.

---

## Troubleshooting

### Certificate Verification Failed

```bash
# Check DNS resolution
nslookup bgp.yourdomain.com

# Verify domain points to server IP
dig bgp.yourdomain.com

# Check port 80 is accessible
curl -I http://bgp.yourdomain.com
```

### Nginx Configuration Errors

```bash
# Check Nginx error log
sudo tail -50 /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T
```

### Certificate Renewal Issues

```bash
# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Force renewal
sudo certbot renew --force-renewal

# Check timer status
sudo systemctl status certbot.timer
```

### Dashboard Not Accessible via HTTPS

```bash
# Verify dashboard is running
pm2 list

# Check Nginx is proxying correctly
sudo tail -50 /var/log/nginx/bgpalerter-dashboard-access.log

# Test proxy locally
curl http://localhost:3000

# Check Nginx proxy settings
sudo nginx -T | grep proxy_pass
```

---

## Security Best Practices

### 1. Strong SSL Configuration

Already included in the configuration above:
- TLS 1.2 and 1.3 only
- Strong cipher suites
- HSTS header
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)

### 2. Rate Limiting (Optional)

Add to Nginx configuration:

```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=dashboard_limit:10m rate=10r/s;

# Add to server block
location / {
    limit_req zone=dashboard_limit burst=20 nodelay;
    # ... rest of proxy configuration
}
```

### 3. IP Whitelisting (Optional)

Restrict access to specific IPs:

```nginx
# Add to server block
location / {
    allow 192.168.1.0/24;  # Your office network
    allow 10.0.0.0/8;      # Your VPN network
    deny all;
    
    # ... rest of proxy configuration
}
```

### 4. Basic Authentication (Additional Layer)

Add password protection:

```bash
# Install apache2-utils
sudo apt-get install apache2-utils

# Create password file
sudo htpasswd -c /etc/nginx/.htpasswd admin

# Add to Nginx location block
location / {
    auth_basic "BGPalerter Dashboard";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    # ... rest of proxy configuration
}
```

---

## Monitoring and Maintenance

### Check SSL Certificate Expiry

```bash
# Check certificate expiration
sudo certbot certificates

# Check expiry date
echo | openssl s_client -connect bgp.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Monitor Nginx Logs

```bash
# Access log (real-time)
sudo tail -f /var/log/nginx/bgpalerter-dashboard-access.log

# Error log (real-time)
sudo tail -f /var/log/nginx/bgpalerter-dashboard-error.log

# Check for errors in last hour
sudo grep -i error /var/log/nginx/bgpalerter-dashboard-error.log | tail -50
```

### Nginx Performance Tuning

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

Recommended settings for production:

```nginx
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

# Client body size (for file uploads)
client_max_body_size 10M;

# Timeouts
keepalive_timeout 65;
client_body_timeout 12;
client_header_timeout 12;
send_timeout 10;
```

---

## Testing SSL Configuration

### Online SSL Test

Use SSL Labs to test your configuration:
https://www.ssllabs.com/ssltest/analyze.html?d=bgp.yourdomain.com

### Command Line Test

```bash
# Test SSL/TLS protocols
nmap --script ssl-enum-ciphers -p 443 bgp.yourdomain.com

# Test certificate chain
openssl s_client -connect bgp.yourdomain.com:443 -showcerts

# Test HTTPS redirect
curl -I http://bgp.yourdomain.com
```

---

## Complete Configuration Example

Here's a complete, production-ready Nginx configuration:

```nginx
# /etc/nginx/sites-available/bgpalerter-dashboard

# Rate limiting
limit_req_zone $binary_remote_addr zone=dashboard_limit:10m rate=10r/s;

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bgp.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bgp.yourdomain.com;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/bgp.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bgp.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Dashboard
    location / {
        # Rate limiting
        limit_req zone=dashboard_limit burst=20 nodelay;

        # Proxy settings
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

    # Logging
    access_log /var/log/nginx/bgpalerter-dashboard-access.log;
    error_log /var/log/nginx/bgpalerter-dashboard-error.log;
}
```

---

## Summary Checklist

- [ ] Nginx installed and running
- [ ] Nginx configuration created
- [ ] Configuration enabled and tested
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] HTTPS working in browser
- [ ] HTTP redirects to HTTPS
- [ ] Automatic renewal configured
- [ ] Firewall configured
- [ ] Security headers verified
- [ ] SSL Labs test passed (A+ rating)
- [ ] Monitoring configured

---

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Testing Tool](https://www.ssllabs.com/ssltest/)

---

## Support

For issues with HTTPS setup:

1. Check Nginx error logs
2. Verify DNS configuration
3. Test certificate with SSL Labs
4. Review troubleshooting section above
5. Consult DEPLOYMENT_GUIDE.md for additional help
