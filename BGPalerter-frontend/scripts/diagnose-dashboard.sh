#!/bin/bash
# BGPalerter Dashboard Diagnostic Script
# Comprehensive system check for troubleshooting deployment issues

set +e  # Don't exit on errors, we want to see all checks

echo "============================================================"
echo "BGPalerter Dashboard Diagnostic"
echo "============================================================"
echo ""
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "User: $(whoami)"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check Node.js
echo "============================================================"
echo "1. Node.js Environment"
echo "============================================================"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"
    
    # Check version is 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        check_pass "Node.js version is compatible (18+)"
    else
        check_warn "Node.js version may be too old (need 18+)"
    fi
else
    check_fail "Node.js not found in PATH"
fi
echo ""

# 2. Check pnpm
echo "============================================================"
echo "2. Package Manager (pnpm)"
echo "============================================================"
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    check_pass "pnpm installed: $PNPM_VERSION"
else
    check_fail "pnpm not found in PATH"
    echo "Install with: npm install -g pnpm"
fi
echo ""

# 3. Check PM2
echo "============================================================"
echo "3. Process Manager (PM2)"
echo "============================================================"
if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 --version)
    check_pass "PM2 installed: $PM2_VERSION"
    
    # Check PM2 daemon
    if pm2 ping &> /dev/null; then
        check_pass "PM2 daemon is running"
    else
        check_fail "PM2 daemon is not responding"
        echo "Try: pm2 ping"
    fi
    
    # Show PM2 processes
    echo ""
    echo "PM2 Processes:"
    pm2 list
else
    check_fail "PM2 not found in PATH"
    echo "Install with: npm install -g pm2"
fi
echo ""

# 4. Check Dashboard Directory
echo "============================================================"
echo "4. Dashboard Directory Structure"
echo "============================================================"
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Dashboard directory: $DASHBOARD_DIR"

if [ -d "$DASHBOARD_DIR" ]; then
    check_pass "Dashboard directory exists"
    cd "$DASHBOARD_DIR" || exit 1
    
    # Check required files
    echo ""
    echo "Required Files:"
    [ -f "package.json" ] && check_pass "package.json" || check_fail "package.json missing"
    [ -f ".env" ] && check_pass ".env" || check_warn ".env missing (will be created on deployment)"
    [ -f "ecosystem.config.js" ] && check_pass "ecosystem.config.js" || check_fail "ecosystem.config.js missing"
    [ -f "bgpalerter.db" ] && check_pass "bgpalerter.db" || check_warn "bgpalerter.db missing (will be created on first run)"
    
    # Check node_modules
    echo ""
    if [ -d "node_modules" ]; then
        check_pass "node_modules installed"
        
        # Count packages
        PKG_COUNT=$(ls -1 node_modules | wc -l)
        echo "  Packages: $PKG_COUNT"
    else
        check_warn "node_modules missing (run: pnpm install)"
    fi
    
    # Check logs directory
    echo ""
    if [ -d "logs" ]; then
        check_pass "logs directory exists"
        LOG_COUNT=$(ls -1 logs 2>/dev/null | wc -l)
        echo "  Log files: $LOG_COUNT"
    else
        check_warn "logs directory missing (will be created on deployment)"
    fi
else
    check_fail "Dashboard directory not found: $DASHBOARD_DIR"
    exit 1
fi
echo ""

# 5. Check Environment Variables
echo "============================================================"
echo "5. Environment Configuration"
echo "============================================================"
if [ -f ".env" ]; then
    check_pass ".env file exists"
    
    # Check key variables (without showing values)
    echo ""
    echo "Environment Variables:"
    grep -q "^DATABASE_URL=" .env && check_pass "DATABASE_URL configured" || check_warn "DATABASE_URL not set"
    grep -q "^JWT_SECRET=" .env && check_pass "JWT_SECRET configured" || check_warn "JWT_SECRET not set"
    grep -q "^BGPALERTER_API_URL=" .env && check_pass "BGPALERTER_API_URL configured" || check_warn "BGPALERTER_API_URL not set"
    
    # Check .env permissions
    ENV_PERMS=$(stat -c "%a" .env 2>/dev/null || stat -f "%OLp" .env 2>/dev/null)
    if [ "$ENV_PERMS" = "600" ]; then
        check_pass ".env permissions are secure (600)"
    else
        check_warn ".env permissions: $ENV_PERMS (should be 600)"
        echo "Fix with: chmod 600 .env"
    fi
else
    check_warn ".env file not found (will be created on deployment)"
fi
echo ""

# 6. Check Network Ports
echo "============================================================"
echo "6. Network Ports"
echo "============================================================"

# Check port 3000 (Dashboard)
if netstat -tlnp 2>/dev/null | grep -q ":3000 " || lsof -i :3000 &>/dev/null; then
    check_pass "Port 3000 is in use (Dashboard may be running)"
    echo ""
    echo "Port 3000 Details:"
    netstat -tlnp 2>/dev/null | grep ":3000 " || lsof -i :3000
else
    check_warn "Port 3000 is not in use (Dashboard not running)"
fi

echo ""

# Check port 8011 (BGPalerter Backend)
if netstat -tlnp 2>/dev/null | grep -q ":8011 " || lsof -i :8011 &>/dev/null; then
    check_pass "Port 8011 is in use (BGPalerter backend may be running)"
else
    check_warn "Port 8011 is not in use (BGPalerter backend not running)"
fi
echo ""

# 7. Check BGPalerter Backend
echo "============================================================"
echo "7. BGPalerter Backend Connectivity"
echo "============================================================"
if curl -sf http://localhost:8011/status > /dev/null 2>&1; then
    check_pass "BGPalerter backend is responding"
    echo ""
    echo "Backend Status:"
    curl -s http://localhost:8011/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8011/status
else
    check_warn "BGPalerter backend is not responding"
    echo "Check if BGPalerter container is running:"
    echo "  cd ../BGPalerter && sudo docker compose ps"
fi
echo ""

# 8. Check Dashboard HTTP Endpoint
echo "============================================================"
echo "8. Dashboard HTTP Endpoint"
echo "============================================================"
if curl -sf http://localhost:3000 > /dev/null 2>&1; then
    check_pass "Dashboard is responding on port 3000"
    
    # Get HTTP status
    HTTP_STATUS=$(curl -sI http://localhost:3000 | head -n 1)
    echo "  HTTP Response: $HTTP_STATUS"
else
    check_fail "Dashboard is not responding on port 3000"
    
    # Try to diagnose why
    if pm2 list | grep -q "bgpalerter-dashboard.*online"; then
        check_warn "PM2 shows process is online but HTTP not responding"
        echo "Check PM2 logs: pm2 logs bgpalerter-dashboard"
    elif pm2 list | grep -q "bgpalerter-dashboard"; then
        check_fail "PM2 process exists but not in 'online' status"
        echo "Check PM2 logs: pm2 logs bgpalerter-dashboard"
    else
        check_fail "PM2 process does not exist"
        echo "Start with: pm2 start ecosystem.config.js"
    fi
fi
echo ""

# 9. Check Disk Space
echo "============================================================"
echo "9. System Resources"
echo "============================================================"
DISK_USAGE=$(df -h "$DASHBOARD_DIR" | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 90 ]; then
    check_pass "Disk space: ${DISK_USAGE}% used"
else
    check_warn "Disk space: ${DISK_USAGE}% used (running low)"
fi

# Check memory
FREE_MEM=$(free -m | awk 'NR==2 {print $7}')
if [ "$FREE_MEM" -gt 500 ]; then
    check_pass "Available memory: ${FREE_MEM}MB"
else
    check_warn "Available memory: ${FREE_MEM}MB (running low)"
fi
echo ""

# 10. Summary and Recommendations
echo "============================================================"
echo "10. Summary and Recommendations"
echo "============================================================"

# Count issues
ERRORS=0
WARNINGS=0

# Re-check critical items
command -v node &> /dev/null || ((ERRORS++))
command -v pnpm &> /dev/null || ((ERRORS++))
command -v pm2 &> /dev/null || ((ERRORS++))
[ -f "$DASHBOARD_DIR/ecosystem.config.js" ] || ((ERRORS++))

[ -f "$DASHBOARD_DIR/.env" ] || ((WARNINGS++))
[ -d "$DASHBOARD_DIR/node_modules" ] || ((WARNINGS++))
curl -sf http://localhost:8011/status > /dev/null 2>&1 || ((WARNINGS++))

echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    check_pass "All checks passed! Dashboard should be ready to deploy."
elif [ $ERRORS -eq 0 ]; then
    check_warn "No critical errors, but $WARNINGS warnings found."
    echo ""
    echo "Recommended actions:"
    [ ! -f "$DASHBOARD_DIR/.env" ] && echo "  - Run deployment script to create .env file"
    [ ! -d "$DASHBOARD_DIR/node_modules" ] && echo "  - Run: pnpm install"
    curl -sf http://localhost:8011/status > /dev/null 2>&1 || echo "  - Start BGPalerter backend: cd ../BGPalerter && sudo docker compose up -d"
else
    check_fail "$ERRORS critical errors found. Dashboard cannot be deployed."
    echo ""
    echo "Required actions:"
    command -v node &> /dev/null || echo "  - Install Node.js 18+"
    command -v pnpm &> /dev/null || echo "  - Install pnpm: npm install -g pnpm"
    command -v pm2 &> /dev/null || echo "  - Install PM2: npm install -g pm2"
    [ -f "$DASHBOARD_DIR/ecosystem.config.js" ] || echo "  - Restore ecosystem.config.js from repository"
fi

echo ""
echo "============================================================"
echo "Diagnostic Complete"
echo "============================================================"
echo ""
echo "For more help, see: INSTALL.md"
echo "To recover from failed deployment: ./scripts/recover-dashboard.sh"
echo ""
