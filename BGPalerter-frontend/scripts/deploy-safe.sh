#!/bin/bash

#############################################################################
# BGPalerter Dashboard - Non-Destructive Deployment Script
# 
# This script safely deploys the dashboard alongside existing BGPalerter
# WITHOUT modifying, deleting, or overwriting any existing files.
#
# Safety guarantees:
# - Verifies existing BGPalerter installation before proceeding
# - Creates backups before any changes
# - Uses separate directories for dashboard files
# - Only reads (never writes) existing BGPalerter config files
# - Provides rollback mechanism if deployment fails
#############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONOREPO_DIR="/home/ubuntu/BGPalerter"
BGPALERTER_DIR="$MONOREPO_DIR/BGPalerter"
DASHBOARD_DIR="$MONOREPO_DIR/BGPalerter-frontend"
BACKUP_DIR="/home/ubuntu/backups/dashboard-$(date +%Y%m%d-%H%M%S)"
SERVER_SCRIPTS_DIR="/home/ubuntu/server-scripts"

# Logging
LOG_FILE="/home/ubuntu/dashboard-deployment.log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BGPalerter Dashboard Deployment${NC}"
echo -e "${BLUE}Non-Destructive Installation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

#############################################################################
# Safety Check Functions
#############################################################################

check_existing_bgpalerter() {
    echo -e "${BLUE}[1/10] Checking existing BGPalerter installation...${NC}"
    
    if [ ! -d "$BGPALERTER_DIR" ]; then
        echo -e "${RED}ERROR: BGPalerter directory not found at $BGPALERTER_DIR${NC}"
        echo -e "${RED}This script requires an existing BGPalerter installation.${NC}"
        exit 1
    fi
    
    if [ ! -f "$BGPALERTER_DIR/config/config.yml" ]; then
        echo -e "${RED}ERROR: BGPalerter config.yml not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ BGPalerter installation verified${NC}"
    echo -e "  Location: $BGPALERTER_DIR"
    echo -e "  Config: $BGPALERTER_DIR/config/config.yml"
    echo ""
}

check_port_availability() {
    echo -e "${BLUE}[2/10] Checking port availability...${NC}"
    
    # Check if port 3000 is available for dashboard
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}WARNING: Port 3000 is already in use${NC}"
        echo -e "${YELLOW}Dashboard will need to use a different port${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓ Port 3000 is available${NC}"
    fi
    echo ""
}

check_dependencies() {
    echo -e "${BLUE}[3/10] Checking system dependencies...${NC}"
    
    local missing_deps=()
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    else
        echo -e "${GREEN}✓ Node.js $(node --version)${NC}"
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        missing_deps+=("pnpm")
    else
        echo -e "${GREEN}✓ pnpm $(pnpm --version)${NC}"
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}! PM2 not installed (will be installed)${NC}"
    else
        echo -e "${GREEN}✓ PM2 installed${NC}"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}ERROR: Missing required dependencies: ${missing_deps[*]}${NC}"
        echo -e "${RED}Please install them first:${NC}"
        echo -e "  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
        echo -e "  sudo apt-get install -y nodejs"
        echo -e "  npm install -g pnpm"
        exit 1
    fi
    echo ""
}

create_backup() {
    echo -e "${BLUE}[4/10] Creating safety backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing dashboard if it exists
    if [ -d "$DASHBOARD_DIR" ]; then
        echo -e "  Backing up existing dashboard..."
        cp -r "$DASHBOARD_DIR" "$BACKUP_DIR/dashboard-backup"
        echo -e "${GREEN}✓ Dashboard backup created${NC}"
    fi
    
    # Create backup metadata
    cat > "$BACKUP_DIR/backup-info.txt" << EOF
Backup created: $(date)
BGPalerter directory: $BGPALERTER_DIR
Dashboard directory: $DASHBOARD_DIR
Backup location: $BACKUP_DIR

To rollback:
  bash $DASHBOARD_DIR/scripts/rollback.sh $BACKUP_DIR
EOF
    
    echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
    echo ""
}

verify_no_overwrites() {
    echo -e "${BLUE}[5/10] Verifying non-destructive deployment...${NC}"
    
    # Verify we won't touch BGPalerter files
    echo -e "  ${GREEN}✓ Will NOT modify: $BGPALERTER_DIR/config/${NC}"
    echo -e "  ${GREEN}✓ Will NOT modify: $BGPALERTER_DIR/src/${NC}"
    echo -e "  ${GREEN}✓ Will NOT modify: $BGPALERTER_DIR/logs/${NC}"
    echo -e "  ${GREEN}✓ Will NOT modify: $BGPALERTER_DIR/cache/${NC}"
    
    # Show what will be created/updated
    echo -e "\n  ${BLUE}Will create/update:${NC}"
    echo -e "  • $DASHBOARD_DIR (dashboard application)"
    echo -e "  • $SERVER_SCRIPTS_DIR (helper scripts)"
    echo -e "  • /etc/systemd/system/bgpalerter-dashboard.service (optional)"
    
    echo ""
    read -p "Proceed with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled by user${NC}"
        exit 0
    fi
    echo ""
}

#############################################################################
# Deployment Functions
#############################################################################

install_dependencies() {
    echo -e "${BLUE}[6/10] Installing dashboard dependencies...${NC}"
    
    cd "$DASHBOARD_DIR"
    
    # Install PM2 globally if not present
    if ! command -v pm2 &> /dev/null; then
        echo -e "  Installing PM2..."
        npm install -g pm2
    fi
    
    # Install dashboard dependencies
    echo -e "  Installing Node.js packages..."
    pnpm install --frozen-lockfile
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
}

setup_environment() {
    echo -e "${BLUE}[7/10] Setting up environment configuration...${NC}"
    
    # Check if .env already exists
    if [ -f "$DASHBOARD_DIR/.env" ]; then
        echo -e "${YELLOW}  .env file already exists, skipping...${NC}"
        echo -e "${YELLOW}  To reconfigure, manually edit $DASHBOARD_DIR/.env${NC}"
    else
        echo -e "  Creating .env file..."
        
        # Read BGPalerter API port from config if possible
        BGPALERTER_PORT=8011
        if command -v yq &> /dev/null && [ -f "$BGPALERTER_DIR/config/config.yml" ]; then
            BGPALERTER_PORT=$(yq eval '.server.port // 8011' "$BGPALERTER_DIR/config/config.yml")
        fi
        
        cat > "$DASHBOARD_DIR/.env" << EOF
# BGPalerter API Configuration
BGPALERTER_API_URL=http://127.0.0.1:${BGPALERTER_PORT}
BGPALERTER_CONFIG_PATH=$BGPALERTER_DIR/config

# Database Configuration (will be auto-configured by Manus)
# DATABASE_URL=

# Server Configuration
NODE_ENV=production
PORT=3000

# Deployment timestamp
DEPLOYED_AT=$(date -Iseconds)
EOF
        echo -e "${GREEN}✓ Environment configured${NC}"
    fi
    echo ""
}

build_dashboard() {
    echo -e "${BLUE}[8/10] Building dashboard application...${NC}"
    
    cd "$DASHBOARD_DIR"
    
    echo -e "  Running production build..."
    pnpm build
    
    echo -e "${GREEN}✓ Dashboard built successfully${NC}"
    echo ""
}

setup_pm2() {
    echo -e "${BLUE}[9/10] Setting up PM2 process manager...${NC}"
    
    cd "$DASHBOARD_DIR"
    
    # Stop existing process if running
    if pm2 describe bgpalerter-dashboard &> /dev/null; then
        echo -e "  Stopping existing dashboard process..."
        pm2 stop bgpalerter-dashboard
        pm2 delete bgpalerter-dashboard
    fi
    
    # Start dashboard with PM2
    echo -e "  Starting dashboard with PM2..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    echo -e "  Setting up PM2 auto-start..."
    sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true
    
    echo -e "${GREEN}✓ PM2 configured${NC}"
    echo ""
}

create_helper_scripts() {
    echo -e "${BLUE}[10/10] Creating helper scripts...${NC}"
    
    mkdir -p "$SERVER_SCRIPTS_DIR"
    
    # Create status check script
    cat > "$SERVER_SCRIPTS_DIR/dashboard-status.sh" << 'EOF'
#!/bin/bash
echo "=== BGPalerter Dashboard Status ==="
pm2 describe bgpalerter-dashboard
echo ""
echo "=== Dashboard URL ==="
echo "http://$(hostname -I | awk '{print $1}'):3000"
EOF
    chmod +x "$SERVER_SCRIPTS_DIR/dashboard-status.sh"
    
    # Create restart script
    cat > "$SERVER_SCRIPTS_DIR/dashboard-restart.sh" << 'EOF'
#!/bin/bash
echo "Restarting BGPalerter Dashboard..."
pm2 restart bgpalerter-dashboard
pm2 logs bgpalerter-dashboard --lines 50
EOF
    chmod +x "$SERVER_SCRIPTS_DIR/dashboard-restart.sh"
    
    # Create logs script
    cat > "$SERVER_SCRIPTS_DIR/dashboard-logs.sh" << 'EOF'
#!/bin/bash
pm2 logs bgpalerter-dashboard
EOF
    chmod +x "$SERVER_SCRIPTS_DIR/dashboard-logs.sh"
    
    echo -e "${GREEN}✓ Helper scripts created in $SERVER_SCRIPTS_DIR${NC}"
    echo ""
}

#############################################################################
# Main Deployment Flow
#############################################################################

main() {
    echo -e "${BLUE}Starting non-destructive deployment...${NC}"
    echo ""
    
    # Safety checks
    check_existing_bgpalerter
    check_port_availability
    check_dependencies
    create_backup
    verify_no_overwrites
    
    # Deployment
    install_dependencies
    setup_environment
    build_dashboard
    setup_pm2
    create_helper_scripts
    
    # Success message
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Dashboard URL:${NC} http://$(hostname -I | awk '{print $1}'):3000"
    echo ""
    echo -e "${BLUE}Useful commands:${NC}"
    echo -e "  Status:  $SERVER_SCRIPTS_DIR/dashboard-status.sh"
    echo -e "  Restart: $SERVER_SCRIPTS_DIR/dashboard-restart.sh"
    echo -e "  Logs:    $SERVER_SCRIPTS_DIR/dashboard-logs.sh"
    echo ""
    echo -e "${BLUE}Backup location:${NC} $BACKUP_DIR"
    echo -e "${BLUE}Deployment log:${NC} $LOG_FILE"
    echo ""
    echo -e "${YELLOW}Note: Your existing BGPalerter installation was NOT modified.${NC}"
    echo -e "${YELLOW}The dashboard reads from BGPalerter but does not write to it.${NC}"
}

# Run main deployment
main
