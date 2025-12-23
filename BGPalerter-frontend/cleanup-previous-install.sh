#!/bin/bash

#############################################################################
# BGPalerter Installation Cleanup Script
# 
# This script removes previous BGPalerter installations to ensure a clean
# platform for fresh deployment.
#
# WARNING: This will remove:
# - BGPalerter directories
# - BGPalerter-frontend directories
# - PM2 processes
# - Docker containers (BGPalerter)
# - MySQL database (optional)
#
# Usage: sudo bash cleanup-previous-install.sh
#############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_question() {
    echo -e "${BLUE}[?]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

echo "========================================================================="
echo "BGPalerter Installation Cleanup Script"
echo "========================================================================="
echo ""
log_warn "This script will remove previous BGPalerter installations."
echo ""
echo "The following will be cleaned up:"
echo "  - PM2 processes (bgpalerter-dashboard)"
echo "  - Docker containers (bgpalerter)"
echo "  - Installation directories"
echo "  - Configuration files"
echo ""
read -p "Do you want to continue? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "Cleanup cancelled by user"
    exit 0
fi

echo ""
log_info "Starting cleanup process..."

#############################################################################
# Step 1: Stop and Remove PM2 Processes
#############################################################################

log_info "Stopping PM2 processes..."

if command -v pm2 &> /dev/null; then
    # Stop and delete bgpalerter-dashboard
    if pm2 list | grep -q "bgpalerter-dashboard"; then
        log_info "Stopping bgpalerter-dashboard PM2 process..."
        pm2 stop bgpalerter-dashboard 2>/dev/null || true
        pm2 delete bgpalerter-dashboard 2>/dev/null || true
        log_info "PM2 process removed"
    else
        log_info "No bgpalerter-dashboard PM2 process found"
    fi
    
    # Save PM2 configuration
    pm2 save --force 2>/dev/null || true
else
    log_info "PM2 not installed, skipping PM2 cleanup"
fi

#############################################################################
# Step 2: Stop and Remove Docker Containers
#############################################################################

log_info "Stopping Docker containers..."

if command -v docker &> /dev/null; then
    # Stop and remove bgpalerter container
    if docker ps -a | grep -q "bgpalerter"; then
        log_info "Stopping and removing bgpalerter Docker container..."
        docker stop bgpalerter 2>/dev/null || true
        docker rm bgpalerter 2>/dev/null || true
        log_info "Docker container removed"
    else
        log_info "No bgpalerter Docker container found"
    fi
else
    log_info "Docker not installed, skipping Docker cleanup"
fi

#############################################################################
# Step 3: Backup Important Files
#############################################################################

log_info "Creating backup of configuration files..."

BACKUP_DIR="/root/bgpalerter-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup BGPalerter config if exists
if [ -d "/home/ubuntu/BGPalerter/config" ]; then
    cp -r /home/ubuntu/BGPalerter/config "$BACKUP_DIR/bgpalerter-config" 2>/dev/null || true
    log_info "BGPalerter config backed up"
fi

if [ -d "/home/onwave/BGPalerter/config" ]; then
    cp -r /home/onwave/BGPalerter/config "$BACKUP_DIR/bgpalerter-config-onwave" 2>/dev/null || true
    log_info "BGPalerter config (onwave) backed up"
fi

# Backup dashboard .env if exists
if [ -f "/home/ubuntu/BGPalerter/BGPalerter-frontend/.env" ]; then
    cp /home/ubuntu/BGPalerter/BGPalerter-frontend/.env "$BACKUP_DIR/dashboard-env" 2>/dev/null || true
    log_info "Dashboard .env backed up"
fi

if [ -f "/home/onwave/BGPalerter/BGPalerter-frontend/.env" ]; then
    cp /home/onwave/BGPalerter/BGPalerter-frontend/.env "$BACKUP_DIR/dashboard-env-onwave" 2>/dev/null || true
    log_info "Dashboard .env (onwave) backed up"
fi

# Backup database credentials if exists
if [ -f "/root/bgpalerter-dashboard-credentials.txt" ]; then
    cp /root/bgpalerter-dashboard-credentials.txt "$BACKUP_DIR/" 2>/dev/null || true
    log_info "Database credentials backed up"
fi

log_info "Backup created at: $BACKUP_DIR"

#############################################################################
# Step 4: Remove Installation Directories
#############################################################################

log_info "Removing installation directories..."

# Common installation paths
INSTALL_PATHS=(
    "/home/ubuntu/BGPalerter"
    "/home/ubuntu/bgpalerter-dashboard"
    "/home/onwave/BGPalerter"
    "/home/net-eng/BGPalerter"
)

for path in "${INSTALL_PATHS[@]}"; do
    if [ -d "$path" ]; then
        log_info "Removing: $path"
        rm -rf "$path"
    fi
done

#############################################################################
# Step 5: Clean Up Systemd Services (if any)
#############################################################################

log_info "Checking for systemd services..."

if [ -f "/etc/systemd/system/bgpalerter-dashboard.service" ]; then
    log_info "Removing systemd service..."
    systemctl stop bgpalerter-dashboard 2>/dev/null || true
    systemctl disable bgpalerter-dashboard 2>/dev/null || true
    rm -f /etc/systemd/system/bgpalerter-dashboard.service
    systemctl daemon-reload
    log_info "Systemd service removed"
fi

#############################################################################
# Step 6: Optional Database Cleanup
#############################################################################

echo ""
log_question "Do you want to remove the MySQL database? (yes/no)"
log_warn "This will delete all BGPalerter dashboard data (alerts, settings, etc.)"
read -p "Remove database? (yes/no): " REMOVE_DB

if [[ "$REMOVE_DB" == "yes" ]]; then
    if command -v mysql &> /dev/null; then
        log_info "Removing MySQL database..."
        
        mysql << EOF 2>/dev/null || true
DROP DATABASE IF EXISTS bgpalerter_dashboard;
DROP USER IF EXISTS 'bgp_user'@'localhost';
FLUSH PRIVILEGES;
EOF
        
        log_info "Database removed"
    else
        log_warn "MySQL not installed, skipping database cleanup"
    fi
else
    log_info "Database preserved"
fi

#############################################################################
# Step 7: Clean Up Nginx Configuration (if any)
#############################################################################

log_info "Checking for Nginx configuration..."

if [ -f "/etc/nginx/sites-enabled/bgpalerter-dashboard" ]; then
    log_info "Removing Nginx configuration..."
    rm -f /etc/nginx/sites-enabled/bgpalerter-dashboard
    rm -f /etc/nginx/sites-available/bgpalerter-dashboard
    
    if command -v nginx &> /dev/null; then
        nginx -t && systemctl reload nginx 2>/dev/null || true
    fi
    
    log_info "Nginx configuration removed"
fi

#############################################################################
# Step 8: Clean Up Log Files
#############################################################################

log_info "Cleaning up log files..."

LOG_PATHS=(
    "/var/log/bgpalerter"
    "/var/log/bgpalerter-dashboard"
)

for log_path in "${LOG_PATHS[@]}"; do
    if [ -d "$log_path" ]; then
        log_info "Removing logs: $log_path"
        rm -rf "$log_path"
    fi
done

#############################################################################
# Step 9: Summary
#############################################################################

echo ""
echo "========================================================================="
echo -e "${GREEN}Cleanup Complete!${NC}"
echo "========================================================================="
echo ""
echo "Removed:"
echo "  ✓ PM2 processes"
echo "  ✓ Docker containers"
echo "  ✓ Installation directories"
echo "  ✓ Systemd services"
if [[ "$REMOVE_DB" == "yes" ]]; then
    echo "  ✓ MySQL database"
else
    echo "  - MySQL database (preserved)"
fi
echo ""
echo "Backup Location:"
echo "  $BACKUP_DIR"
echo ""
echo "Files backed up:"
echo "  - BGPalerter configuration"
echo "  - Dashboard .env file"
echo "  - Database credentials"
echo ""
echo "Next Steps:"
echo "  1. Review backup files if needed"
echo "  2. Run fresh deployment: sudo bash deploy.sh"
echo ""
echo "========================================================================="

# Create cleanup report
cat > "$BACKUP_DIR/cleanup-report.txt" << EOF
BGPalerter Cleanup Report
Generated: $(date)

Cleanup Actions:
- PM2 processes stopped and removed
- Docker containers stopped and removed
- Installation directories removed
- Systemd services removed
- Database: $(if [[ "$REMOVE_DB" == "yes" ]]; then echo "Removed"; else echo "Preserved"; fi)

Backup Location: $BACKUP_DIR

Configuration files backed up:
$(ls -la "$BACKUP_DIR")

To restore configuration:
1. Copy backed up files to new installation
2. Update paths and credentials as needed

To deploy fresh installation:
cd ~/BGPalerter/BGPalerter-frontend
sudo bash deploy.sh
EOF

log_info "Cleanup report saved to: $BACKUP_DIR/cleanup-report.txt"

exit 0
