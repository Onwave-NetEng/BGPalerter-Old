# BGPalerter Deployment Bugs and Fixes

**Date:** December 22, 2024  
**Deployment Version:** v3.4-integrated  
**Test Environment:** Ubuntu 24.04 LTS (onlab01bgpa02)

---

## Executive Summary

The automated deployment system successfully installed all dependencies (Docker, Node.js, pnpm, PM2) and deployed the BGPalerter backend. However, **the dashboard failed to start** despite the deployment module reporting success. PM2 shows no running processes, indicating the dashboard was never launched.

---

## Deployment Results

### Successful Components ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Docker** | ✅ Success | Docker Engine installed and validated |
| **Node.js** | ✅ Success | Node.js 22 installed and validated |
| **pnpm** | ✅ Success | pnpm package manager installed |
| **PM2** | ✅ Success | PM2 process manager installed |
| **BGPalerter Backend** | ⚠️ Warning | Container running, API responding, but health check timeout |

### Failed Components ❌

| Component | Status | Issue |
|-----------|--------|-------|
| **Dashboard** | ❌ Failed | PM2 shows no processes, dashboard not accessible on port 3000 |

---

## Root Cause Analysis

### Issue 1: Dashboard Not Starting (Critical)

**Symptom:**
```bash
$ pm2 status
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
# Empty - no processes running
```

**Expected:**
```bash
$ pm2 status
┌─────┬────────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ status  │ restart │ uptime   │
├─────┼────────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ bgpalerter-dashboard   │ online  │ 0       │ 2m       │
└─────┴────────────────────────┴─────────┴─────────┴──────────┘
```

**Root Causes:**

1. **Missing `.env` file** - Dashboard requires environment variables (DATABASE_URL, JWT_SECRET, etc.) that are not created during deployment
2. **Missing database migration** - `pnpm db:push` not executed, database schema not created
3. **Incorrect working directory** - PM2 may not be starting from the correct directory (`BGPalerter-frontend`)
4. **Build artifacts missing** - `dist/` directory may not exist if build failed silently
5. **PM2 ecosystem.config.js issues** - Configuration may have incorrect paths or environment setup

### Issue 2: BGPalerter API Health Check Timeout (Warning)

**Symptom:**
```
Status: warning
Progress: 95%
Message: BGPalerter deployed but API not ready
```

**Analysis:**
- Container is running and healthy: `Up 20 minutes (healthy)`
- API responds correctly: `curl http://localhost:8011/status` returns valid JSON
- This is a **false alarm** - the deployment script's health check timeout is too aggressive

**Root Cause:**
- BGPalerter takes 30-60 seconds to fully initialize (connect to RIPE RIS, load prefixes)
- Deployment script only waits 10 seconds before timing out

### Issue 3: Dashboard Accessibility (Secondary)

**Symptom:**
```bash
$ curl -I http://localhost:3000
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Couldn't connect to server
```

**Root Cause:**
- Dashboard never started (see Issue 1)
- Port 3000 is not bound because no process is listening

---

## Bug/Fix List

### Priority 1: Critical (Blocks Deployment)

#### Bug #1: Dashboard Deployment Script Incomplete

**File:** `deploy/modules/dashboard.sh`

**Problem:**
- Script does not create `.env` file with required environment variables
- Script does not run database migrations (`pnpm db:push`)
- Script does not verify PM2 actually started the process
- Script reports success even if PM2 start fails

**Fix:**
1. Add `.env` file generation with all required variables
2. Add `pnpm db:push` to create database schema
3. Add PM2 process verification (check `pm2 list` output)
4. Add proper error handling for each step

**Implementation:**
```bash
# Add to dashboard.sh after pnpm install

# Generate .env file
echo "Generating .env file..."
cat > "$DASHBOARD_DIR/.env" << EOF
# Database
DATABASE_URL=mysql://user:password@localhost:3306/bgpalerter

# JWT Secret (generate random)
JWT_SECRET=$(openssl rand -base64 32)

# BGPalerter Integration
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=../BGPalerter/config/config.yml

# Owner Info (placeholder)
OWNER_NAME=Administrator
OWNER_OPEN_ID=admin

# OAuth (Manus-specific, can be empty for standalone)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
EOF

# Run database migrations
echo "Running database migrations..."
cd "$DASHBOARD_DIR"
pnpm db:push || {
    echo "Error: Database migration failed"
    exit 1
}

# Start with PM2
pm2 start ecosystem.config.js || {
    echo "Error: PM2 start failed"
    exit 1
}

# Verify PM2 process is running
sleep 5
if ! pm2 list | grep -q "bgpalerter-dashboard.*online"; then
    echo "Error: Dashboard process not running"
    pm2 logs bgpalerter-dashboard --lines 50
    exit 1
fi
```

#### Bug #2: Missing Database Setup

**Problem:**
- Dashboard requires MySQL/TiDB database
- No database creation or configuration in deployment
- DATABASE_URL environment variable not set

**Fix:**
1. Add database setup module or instructions
2. Provide option to use SQLite for standalone deployments
3. Add database connectivity check before starting dashboard

**Implementation Options:**

**Option A: SQLite (Simpler, Standalone)**
```bash
# Modify drizzle.config.ts to support SQLite
DATABASE_URL=sqlite:///home/ubuntu/BGPalerter/bgpalerter.db
```

**Option B: MySQL (Production)**
```bash
# Add MySQL installation to deployment
sudo apt-get install -y mysql-server
sudo mysql -e "CREATE DATABASE bgpalerter;"
sudo mysql -e "CREATE USER 'bgpalerter'@'localhost' IDENTIFIED BY 'secure_password';"
sudo mysql -e "GRANT ALL PRIVILEGES ON bgpalerter.* TO 'bgpalerter'@'localhost';"
DATABASE_URL=mysql://bgpalerter:secure_password@localhost:3306/bgpalerter
```

### Priority 2: High (Improves Reliability)

#### Bug #3: BGPalerter Health Check Timeout Too Short

**File:** `deploy/modules/bgpalerter.sh`

**Problem:**
- Health check waits only 10 seconds
- BGPalerter needs 30-60 seconds to fully initialize
- Causes false "warning" status

**Fix:**
Increase timeout to 60 seconds and add retry logic

**Implementation:**
```bash
# Wait for BGPalerter API to be ready (increase timeout)
echo "Waiting for BGPalerter API..."
MAX_WAIT=60
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:8011/status > /dev/null 2>&1; then
        echo "BGPalerter API is ready"
        break
    fi
    sleep 5
    WAIT_TIME=$((WAIT_TIME + 5))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "Warning: BGPalerter API not responding after ${MAX_WAIT}s"
    echo "Container may still be initializing. Check logs: docker compose logs -f bgpalerter"
fi
```

#### Bug #4: No Dashboard Health Check

**File:** `deploy/modules/dashboard.sh`

**Problem:**
- Script doesn't verify dashboard is actually accessible
- No HTTP health check on port 3000
- Can report success even if dashboard crashes immediately

**Fix:**
Add HTTP health check with retry logic

**Implementation:**
```bash
# Verify dashboard is accessible
echo "Verifying dashboard accessibility..."
MAX_WAIT=30
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo "Dashboard is accessible at http://localhost:3000"
        break
    fi
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "Error: Dashboard not accessible after ${MAX_WAIT}s"
    pm2 logs bgpalerter-dashboard --lines 50
    exit 1
fi
```

### Priority 3: Medium (Security & Best Practices)

#### Bug #5: No HTTPS Configuration

**Problem:**
- Dashboard runs on HTTP only (port 3000)
- User requirement: "Dashboard should only be HTTPS"
- No SSL/TLS configuration in deployment

**Fix:**
1. Add Nginx reverse proxy with SSL termination
2. Redirect HTTP to HTTPS
3. Use Let's Encrypt for SSL certificate

**Implementation:**

Create new deployment module: `deploy/modules/nginx-https.sh`

```bash
#!/bin/bash
set -e

# Install Nginx and Certbot
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/bgpalerter << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;

    # SSL configuration (will be managed by certbot)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to dashboard
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
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/bgpalerter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo "HTTPS setup complete. To obtain SSL certificate, run:"
echo "sudo certbot --nginx -d your-domain.com"
```

#### Bug #6: Insecure Default Secrets

**Problem:**
- JWT_SECRET and other secrets generated during deployment
- No secure storage or rotation mechanism
- Secrets visible in `.env` file

**Fix:**
1. Generate strong random secrets
2. Set restrictive file permissions on `.env`
3. Document secret rotation procedures

**Implementation:**
```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 48)

# Set restrictive permissions
chmod 600 "$DASHBOARD_DIR/.env"
chown $USER:$USER "$DASHBOARD_DIR/.env"
```

### Priority 4: Low (Nice to Have)

#### Bug #7: No Rollback on Failure

**Problem:**
- If deployment fails midway, system is left in inconsistent state
- No automatic cleanup or rollback

**Fix:**
Add rollback logic to orchestrator

**Implementation:**
```python
# In orchestrator.py
def rollback_module(module_name):
    """Rollback changes made by a module"""
    rollback_script = f"modules/{module_name}-rollback.sh"
    if os.path.exists(rollback_script):
        subprocess.run([rollback_script], check=True)
```

#### Bug #8: No Deployment Logs

**Problem:**
- Deployment output only shown on console
- No persistent logs for troubleshooting

**Fix:**
Add logging to orchestrator

**Implementation:**
```python
import logging

logging.basicConfig(
    filename='/var/log/bgpalerter-deployment.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
```

---

## Testing Plan

### Test 1: Dashboard Deployment Fix

**Environment:** Fresh Ubuntu 24.04 VM

**Steps:**
1. Clone repository
2. Run deployment: `./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard`
3. Verify PM2 status: `pm2 status` shows `bgpalerter-dashboard` online
4. Verify dashboard accessible: `curl -I http://localhost:3000` returns 200 OK
5. Verify database created: `ls -la ~/.local/share/bgpalerter.db` (if SQLite)

**Success Criteria:**
- PM2 shows dashboard process running
- Dashboard accessible on port 3000
- No errors in PM2 logs: `pm2 logs bgpalerter-dashboard`

### Test 2: HTTPS Configuration

**Environment:** Ubuntu 24.04 with domain name

**Steps:**
1. Run HTTPS module: `./modules/nginx-https.sh`
2. Obtain SSL certificate: `sudo certbot --nginx -d your-domain.com`
3. Verify HTTPS: `curl -I https://your-domain.com`
4. Verify HTTP redirect: `curl -I http://your-domain.com` returns 301

**Success Criteria:**
- HTTPS accessible with valid certificate
- HTTP redirects to HTTPS
- Security headers present in response

### Test 3: End-to-End Deployment

**Environment:** Fresh Ubuntu 24.04 VM

**Steps:**
1. Clone repository
2. Run full deployment: `./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard nginx-https`
3. Configure domain and SSL
4. Access dashboard via HTTPS
5. Verify BGPalerter integration (status, alerts, prefixes)

**Success Criteria:**
- All modules deploy successfully
- Dashboard accessible via HTTPS only
- BGPalerter backend connected and monitoring
- No errors in logs

---

## Documentation Updates Required

### INSTALL.md

**Section 3: Validate Deployment**
- Add troubleshooting for empty PM2 status
- Add database connectivity check
- Add dashboard logs inspection: `pm2 logs bgpalerter-dashboard`

**Section 4: Testing**
- Add PM2 process verification test
- Add database schema verification test

**Troubleshooting Section**
- Add "Issue: PM2 shows no processes"
- Add "Issue: Dashboard fails to start"
- Add "Issue: Database connection error"

### README.md

**Quick Start Section**
- Add note about HTTPS-only deployment option
- Add database setup requirements

### deploy/README.md

**Module Documentation**
- Update dashboard.sh description with database requirements
- Add nginx-https.sh module documentation
- Add troubleshooting section for each module

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. Fix dashboard.sh to create `.env` and run migrations
2. Add database setup (SQLite for simplicity)
3. Add PM2 process verification
4. Test in sandbox environment

### Phase 2: HTTPS Implementation (High Priority)
1. Create nginx-https.sh module
2. Update orchestrator to support optional HTTPS
3. Update documentation with HTTPS setup
4. Test HTTPS deployment

### Phase 3: Reliability Improvements (Medium Priority)
1. Increase BGPalerter health check timeout
2. Add dashboard health check
3. Improve error messages and logging
4. Add rollback capability

### Phase 4: Documentation (Ongoing)
1. Update INSTALL.md with fixes
2. Update troubleshooting sections
3. Add deployment best practices
4. Create video tutorial (optional)

---

## Estimated Token Cost

| Phase | Estimated Tokens | % of Budget |
|-------|------------------|-------------|
| Phase 1: Critical Fixes | 8,000 | 4.0% |
| Phase 2: HTTPS Implementation | 6,000 | 3.0% |
| Phase 3: Reliability Improvements | 4,000 | 2.0% |
| Phase 4: Documentation | 3,000 | 1.5% |
| **Total** | **21,000** | **10.5%** |

**Current Budget:** 115,763 tokens remaining (57.9%)  
**After fixes:** 94,763 tokens remaining (47.4%)

---

## Conclusion

The deployment system is 80% complete but has a critical bug preventing the dashboard from starting. The root cause is missing environment configuration and database setup in the dashboard deployment module. With the fixes outlined above, the system will be production-ready with HTTPS support and robust error handling.

**Next Steps:**
1. Implement Phase 1 critical fixes
2. Test in sandbox environment
3. Deploy Phase 2 HTTPS implementation
4. Update all documentation
5. Push fixes to GitHub
6. Notify user of completion

---

**Report Generated:** December 22, 2024  
**Author:** Manus AI  
**Version:** 1.0
