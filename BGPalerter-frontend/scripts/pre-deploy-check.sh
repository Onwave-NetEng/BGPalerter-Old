#!/bin/bash

#############################################################################
# BGPalerter Dashboard - Pre-Deployment Validation Script
# 
# Run this script BEFORE deployment to verify system readiness
# Checks all prerequisites and provides detailed feedback
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MONOREPO_DIR="/home/ubuntu/BGPalerter"
BGPALERTER_DIR="$MONOREPO_DIR/BGPalerter"
DASHBOARD_DIR="$MONOREPO_DIR/BGPalerter-frontend"

ERRORS=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BGPalerter Dashboard${NC}"
echo -e "${BLUE}Pre-Deployment Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

#############################################################################
# Check Functions
#############################################################################

check_bgpalerter_installation() {
    echo -e "${BLUE}[1/10] Checking BGPalerter installation...${NC}"
    
    if [ ! -d "$BGPALERTER_DIR" ]; then
        echo -e "${RED}✗ BGPalerter directory not found: $BGPALERTER_DIR${NC}"
        echo -e "${RED}  Dashboard requires existing BGPalerter installation${NC}"
        ((ERRORS++))
        return
    fi
    echo -e "${GREEN}✓ BGPalerter directory found${NC}"
    
    if [ ! -f "$BGPALERTER_DIR/config/config.yml" ]; then
        echo -e "${RED}✗ BGPalerter config.yml not found${NC}"
        ((ERRORS++))
        return
    fi
    echo -e "${GREEN}✓ BGPalerter config.yml found${NC}"
    
    echo ""
}

check_bgpalerter_api() {
    echo -e "${BLUE}[2/10] Checking BGPalerter API...${NC}"
    
    # Try common ports
    for port in 8011 8080 8081; do
        if curl -s -f "http://localhost:$port/api/v1/status" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ BGPalerter API responding on port $port${NC}"
            echo -e "  API URL: http://localhost:$port"
            echo ""
            return
        fi
    done
    
    echo -e "${YELLOW}⚠ BGPalerter API not responding on common ports${NC}"
    echo -e "${YELLOW}  Checked ports: 8011, 8080, 8081${NC}"
    echo -e "${YELLOW}  Please verify BGPalerter is running${NC}"
    echo -e "${YELLOW}  Check with: docker ps | grep bgpalerter${NC}"
    ((WARNINGS++))
    echo ""
}

check_nodejs() {
    echo -e "${BLUE}[3/10] Checking Node.js...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not installed${NC}"
        echo -e "${RED}  Install with:${NC}"
        echo -e "${RED}    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -${NC}"
        echo -e "${RED}    sudo apt-get install -y nodejs${NC}"
        ((ERRORS++))
        echo ""
        return
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}✗ Node.js version too old: v$NODE_VERSION${NC}"
        echo -e "${RED}  Required: v18.x or later${NC}"
        echo -e "${RED}  Recommended: v22.x${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Node.js v$NODE_VERSION${NC}"
    fi
    echo ""
}

check_pnpm() {
    echo -e "${BLUE}[4/10] Checking pnpm...${NC}"
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}✗ pnpm not installed${NC}"
        echo -e "${RED}  Install with: npm install -g pnpm${NC}"
        ((ERRORS++))
    else
        PNPM_VERSION=$(pnpm --version)
        echo -e "${GREEN}✓ pnpm v$PNPM_VERSION${NC}"
    fi
    echo ""
}

check_pm2() {
    echo -e "${BLUE}[5/10] Checking PM2...${NC}"
    
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}⚠ PM2 not installed (will be installed during deployment)${NC}"
        echo -e "  PM2 is required for process management"
        ((WARNINGS++))
    else
        PM2_VERSION=$(pm2 --version)
        echo -e "${GREEN}✓ PM2 v$PM2_VERSION${NC}"
    fi
    echo ""
}

check_port_3000() {
    echo -e "${BLUE}[6/10] Checking port 3000 availability...${NC}"
    
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        PROCESS=$(lsof -Pi :3000 -sTCP:LISTEN | tail -n 1)
        echo -e "${YELLOW}⚠ Port 3000 is already in use${NC}"
        echo -e "${YELLOW}  Process: $PROCESS${NC}"
        echo -e "${YELLOW}  You may need to use a different port${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓ Port 3000 is available${NC}"
    fi
    echo ""
}

check_disk_space() {
    echo -e "${BLUE}[7/10] Checking disk space...${NC}"
    
    AVAILABLE=$(df -BG /home/ubuntu | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [ "$AVAILABLE" -lt 2 ]; then
        echo -e "${RED}✗ Insufficient disk space: ${AVAILABLE}GB available${NC}"
        echo -e "${RED}  Required: at least 2GB free${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Sufficient disk space: ${AVAILABLE}GB available${NC}"
    fi
    echo ""
}

check_permissions() {
    echo -e "${BLUE}[8/10] Checking permissions...${NC}"
    
    if [ ! -w "/home/ubuntu" ]; then
        echo -e "${RED}✗ No write permission in /home/ubuntu${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Write permission verified${NC}"
    fi
    
    # Check sudo access
    if sudo -n true 2>/dev/null; then
        echo -e "${GREEN}✓ Sudo access available${NC}"
    else
        echo -e "${YELLOW}⚠ Sudo access may require password${NC}"
        echo -e "${YELLOW}  Required for PM2 startup configuration${NC}"
        ((WARNINGS++))
    fi
    echo ""
}

check_network() {
    echo -e "${BLUE}[9/10] Checking network connectivity...${NC}"
    
    if ping -c 1 8.8.8.8 &> /dev/null; then
        echo -e "${GREEN}✓ Internet connectivity verified${NC}"
    else
        echo -e "${RED}✗ No internet connectivity${NC}"
        echo -e "${RED}  Required for installing dependencies${NC}"
        ((ERRORS++))
    fi
    echo ""
}

check_dashboard_files() {
    echo -e "${BLUE}[10/10] Checking dashboard files...${NC}"
    
    if [ ! -d "$DASHBOARD_DIR" ]; then
        echo -e "${RED}✗ Dashboard directory not found: $DASHBOARD_DIR${NC}"
        echo -e "${RED}  Please download/clone dashboard files first${NC}"
        ((ERRORS++))
        echo ""
        return
    fi
    echo -e "${GREEN}✓ Dashboard directory found${NC}"
    
    if [ ! -f "$DASHBOARD_DIR/package.json" ]; then
        echo -e "${RED}✗ package.json not found${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ package.json found${NC}"
    fi
    
    if [ ! -f "$DASHBOARD_DIR/scripts/deploy-safe.sh" ]; then
        echo -e "${RED}✗ Deployment script not found${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Deployment script found${NC}"
    fi
    
    echo ""
}

#############################################################################
# Run All Checks
#############################################################################

check_bgpalerter_installation
check_bgpalerter_api
check_nodejs
check_pnpm
check_pm2
check_port_3000
check_disk_space
check_permissions
check_network
check_dashboard_files

#############################################################################
# Summary
#############################################################################

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo -e "${GREEN}  System is ready for deployment${NC}"
    echo ""
    echo -e "${BLUE}Next step:${NC}"
    echo -e "  cd $DASHBOARD_DIR"
    echo -e "  bash scripts/deploy-safe.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo -e "${YELLOW}  Deployment can proceed but review warnings above${NC}"
    echo ""
    echo -e "${BLUE}To proceed with deployment:${NC}"
    echo -e "  cd $DASHBOARD_DIR"
    echo -e "  bash scripts/deploy-safe.sh"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo -e "${RED}  Please fix errors before deployment${NC}"
    echo ""
    echo -e "${BLUE}Review the errors above and:${NC}"
    echo -e "  1. Install missing dependencies"
    echo -e "  2. Verify BGPalerter is running"
    echo -e "  3. Free up disk space if needed"
    echo -e "  4. Run this check again"
    exit 1
fi
