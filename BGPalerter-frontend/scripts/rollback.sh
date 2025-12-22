#!/bin/bash

#############################################################################
# BGPalerter Dashboard - Rollback Script
# 
# Safely rollback dashboard deployment to a previous backup
# WITHOUT affecting existing BGPalerter installation
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

MONOREPO_DIR="/home/ubuntu/BGPalerter"
DASHBOARD_DIR="$MONOREPO_DIR/BGPalerter-frontend"

if [ -z "$1" ]; then
    echo -e "${RED}ERROR: Backup directory not specified${NC}"
    echo -e "Usage: $0 <backup-directory>"
    echo ""
    echo -e "Available backups:"
    ls -1dt /home/ubuntu/backups/dashboard-* 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}ERROR: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BGPalerter Dashboard Rollback${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}This will restore dashboard from backup:${NC}"
echo -e "  $BACKUP_DIR"
echo ""
echo -e "${YELLOW}Your BGPalerter installation will NOT be affected.${NC}"
echo ""

read -p "Continue with rollback? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Rollback cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}[1/3] Stopping dashboard...${NC}"
pm2 stop bgpalerter-dashboard || true
pm2 delete bgpalerter-dashboard || true
echo -e "${GREEN}✓ Dashboard stopped${NC}"
echo ""

echo -e "${BLUE}[2/3] Restoring from backup...${NC}"
if [ -d "$BACKUP_DIR/dashboard-backup" ]; then
    rm -rf "$DASHBOARD_DIR"
    cp -r "$BACKUP_DIR/dashboard-backup" "$DASHBOARD_DIR"
    echo -e "${GREEN}✓ Dashboard restored${NC}"
else
    echo -e "${YELLOW}No dashboard backup found, skipping restore${NC}"
fi
echo ""

echo -e "${BLUE}[3/3] Restarting dashboard...${NC}"
cd "$DASHBOARD_DIR"
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✓ Dashboard restarted${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Rollback completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
