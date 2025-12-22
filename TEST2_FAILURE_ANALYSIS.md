# Test 2 Failure Analysis

**Date:** December 22, 2024  
**Test:** Dashboard Deployment (Post Bug Fix)  
**Status:** ❌ FAILED  
**Server:** onlab01bgpa02

---

## Test Results

### Backend Status: ✅ PASS
```bash
$ curl http://localhost:8011/status
{"warning":false,"connectors":[{"name":"ConnectorRIS","connected":true}],"rpki":{"data":true,"stale":false,"provider":"rpkiclient"}}
```
**Analysis:** BGPalerter backend is running correctly, connected to RIPE RIS, RPKI data available.

### Dashboard Status: ❌ FAIL
```bash
$ pm2 status
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘

$ curl http://localhost:3000
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Couldn't connect to server
```
**Analysis:** PM2 shows no processes. Dashboard is not running.

---

## Root Cause Analysis

### Issue: Dashboard Deployment Script Completed But PM2 Never Started

**Evidence:**
1. PM2 status table is empty (no `bgpalerter-dashboard` process)
2. Port 3000 is not listening (connection refused)
3. No PM2 logs available (process never started)
4. Syslog shows no PM2 or dashboard-related errors

**Hypothesis:** The updated `dashboard.sh` script has one or more of these issues:

1. **Missing Dependencies:** `pnpm` or `pm2` not installed or not in PATH
2. **Working Directory Issue:** Script running from wrong directory
3. **Build Failure:** `pnpm build` failed silently
4. **PM2 Start Failure:** `pm2 start` command failed without proper error handling
5. **Environment Variables:** Missing required env vars despite .env generation
6. **Database Migration Failure:** `pnpm db:push` failed, preventing startup
7. **Permission Issues:** User doesn't have permission to write to required directories

### Most Likely Causes (Prioritized)

**1. Missing `ecosystem.config.js` file** (CRITICAL)
- The script runs `pm2 start ecosystem.config.js`
- If this file doesn't exist in BGPalerter-frontend/, PM2 will fail silently
- Original deployment used `deploy-safe.sh` which may have created this file

**2. `pnpm` not in PATH for the deployment user**
- Script assumes `pnpm` is globally available
- If run as different user than installer, PATH may not include pnpm
- Need to use absolute path or verify pnpm installation

**3. Database migration requires existing database connection**
- `pnpm db:push` may fail if DATABASE_URL is invalid
- SQLite file path may not be writable
- Need better error handling for db:push failures

**4. PM2 not started as daemon**
- PM2 may not be running as a service
- `pm2 start` may fail if PM2 daemon isn't initialized
- Need to check `pm2 ping` before attempting start

---

## Missing Information

To properly diagnose, we need:

1. **Dashboard deployment logs:** Output from `./modules/dashboard.sh`
2. **PM2 logs:** `pm2 logs --lines 100` (if any processes exist)
3. **File existence check:**
   - `/home/onwave/BGPalerter-frontend/.env`
   - `/home/onwave/BGPalerter-frontend/ecosystem.config.js`
   - `/home/onwave/BGPalerter-frontend/bgpalerter.db`
4. **Build output:** Check if `pnpm build` completed successfully
5. **PM2 daemon status:** `pm2 ping` output

---

## Proposed Fix Strategy

### Phase 1: Enhanced Diagnostic Script

Create `diagnose-dashboard.sh` to check:
- All required files exist
- Dependencies are installed (node, pnpm, pm2)
- PM2 daemon is running
- Database file is writable
- Environment variables are set
- Port 3000 is available

### Phase 2: Improved Dashboard Deployment Script

**Key improvements:**
1. **Pre-flight checks:**
   - Verify pnpm is installed and in PATH
   - Verify PM2 is installed and daemon is running
   - Check for required files (package.json, etc.)

2. **Better error handling:**
   - Exit immediately on any command failure (`set -e`)
   - Capture and log all command output
   - Provide actionable error messages

3. **Explicit file creation:**
   - Create `ecosystem.config.js` if it doesn't exist
   - Verify .env file was created successfully
   - Check database file after migration

4. **PM2 process management:**
   - Stop existing process before starting new one
   - Use `pm2 delete` to clean up old processes
   - Verify process is actually running after start
   - Save PM2 process list after successful start

5. **Comprehensive validation:**
   - Wait for HTTP endpoint to respond (not just PM2 status)
   - Check actual port binding with `netstat`
   - Verify dashboard serves content

### Phase 3: Recovery Script

Create `recover-dashboard.sh` for manual recovery:
- Stop all PM2 processes
- Clean PM2 cache
- Rebuild dashboard
- Regenerate .env
- Re-run database migrations
- Start fresh PM2 process

---

## Implementation Plan

### Step 1: Create Diagnostic Script
```bash
#!/bin/bash
# diagnose-dashboard.sh
# Comprehensive dashboard deployment diagnostic

echo "=== BGPalerter Dashboard Diagnostic ==="
echo ""

# Check Node.js
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node --version)"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check pnpm
echo "Checking pnpm..."
if command -v pnpm &> /dev/null; then
    echo "✅ pnpm installed: $(pnpm --version)"
else
    echo "❌ pnpm not found"
    exit 1
fi

# Check PM2
echo "Checking PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 installed: $(pm2 --version)"
    pm2 ping &> /dev/null && echo "✅ PM2 daemon running" || echo "❌ PM2 daemon not running"
else
    echo "❌ PM2 not found"
    exit 1
fi

# Check dashboard directory
echo "Checking dashboard directory..."
DASHBOARD_DIR="../BGPalerter-frontend"
if [ -d "$DASHBOARD_DIR" ]; then
    echo "✅ Dashboard directory exists"
    cd "$DASHBOARD_DIR" || exit 1
else
    echo "❌ Dashboard directory not found: $DASHBOARD_DIR"
    exit 1
fi

# Check required files
echo "Checking required files..."
[ -f "package.json" ] && echo "✅ package.json" || echo "❌ package.json missing"
[ -f ".env" ] && echo "✅ .env" || echo "❌ .env missing"
[ -f "ecosystem.config.js" ] && echo "✅ ecosystem.config.js" || echo "❌ ecosystem.config.js missing"
[ -f "bgpalerter.db" ] && echo "✅ bgpalerter.db" || echo "⚠️  bgpalerter.db missing (will be created)"

# Check node_modules
[ -d "node_modules" ] && echo "✅ node_modules installed" || echo "❌ node_modules missing (run pnpm install)"

# Check PM2 processes
echo "Checking PM2 processes..."
pm2 list

# Check port 3000
echo "Checking port 3000..."
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "✅ Port 3000 is in use"
    netstat -tlnp 2>/dev/null | grep ":3000 "
else
    echo "❌ Port 3000 is not in use"
fi

# Check BGPalerter backend
echo "Checking BGPalerter backend..."
if curl -sf http://localhost:8011/status > /dev/null 2>&1; then
    echo "✅ BGPalerter backend responding"
else
    echo "⚠️  BGPalerter backend not responding"
fi

echo ""
echo "=== Diagnostic Complete ==="
```

### Step 2: Enhanced Dashboard Deployment Script

See `deploy/modules/dashboard-v2.sh` (implementation below)

### Step 3: Recovery Script

See `scripts/recover-dashboard.sh` (implementation below)

---

## Success Criteria

After implementing fixes, Test 2 should show:

```bash
$ pm2 status
┌────┬─────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                    │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼─────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ bgpalerter-dashboard    │ default     │ 1.0.0   │ fork    │ 12345    │ 5m     │ 0    │ online    │ 0%       │ 150.0mb  │ onwave   │ disabled │
└────┴─────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

$ curl -I http://localhost:3000
HTTP/1.1 200 OK
...

$ curl http://localhost:3000/api/trpc/system.getStatus
{"result":{"data":{"bgpalerter":{"status":"connected",...}}}}
```

---

## Next Steps

1. Create diagnostic script
2. Run diagnostic on production server to identify exact failure point
3. Implement enhanced dashboard deployment script based on findings
4. Test on production server
5. Update documentation with actual error messages and solutions
6. Commit fixes to GitHub

---

**Report Generated:** December 22, 2024  
**Author:** Manus AI
