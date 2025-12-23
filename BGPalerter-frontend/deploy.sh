#!/bin/bash

#############################################################################
# BGPalerter Dashboard - Automated Deployment Script
# 
# This script automates the deployment of the BGPalerter Dashboard on
# Ubuntu 20.04+ servers with MySQL database setup.
#
# Usage: sudo bash deploy.sh
#############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

log_info "Starting BGPalerter Dashboard deployment..."

#############################################################################
# Step 1: Install System Dependencies
#############################################################################

log_info "Installing system dependencies..."

# Update package lists
apt update

# Install Node.js 22.x
if ! command -v node &> /dev/null; then
    log_info "Installing Node.js 22.x..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
else
    log_info "Node.js already installed: $(node --version)"
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    log_info "Installing pnpm..."
    npm install -g pnpm
else
    log_info "pnpm already installed: $(pnpm --version)"
fi

# Install MySQL Server
if ! command -v mysql &> /dev/null; then
    log_info "Installing MySQL Server..."
    apt install -y mysql-server
else
    log_info "MySQL already installed: $(mysql --version)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    log_info "Installing PM2..."
    npm install -g pm2
else
    log_info "PM2 already installed: $(pm2 --version)"
fi

# Install Docker (required for BGPalerter)
if ! command -v docker &> /dev/null; then
    log_info "Installing Docker..."
    apt install -y ca-certificates curl gnupg lsb-release
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt update
    apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    if [ -n "$SUDO_USER" ]; then
        usermod -aG docker $SUDO_USER
        log_info "User $SUDO_USER added to docker group (logout/login required)"
    fi
else
    log_info "Docker already installed: $(docker --version)"
fi

#############################################################################
# Step 2: Configure MySQL Database
#############################################################################

log_info "Configuring MySQL database..."

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
mysql << EOF
CREATE DATABASE IF NOT EXISTS bgpalerter_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'bgp_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON bgpalerter_dashboard.* TO 'bgp_user'@'localhost';
FLUSH PRIVILEGES;
EOF

log_info "Database created successfully"
log_info "Database: bgpalerter_dashboard"
log_info "User: bgp_user"
log_info "Password: ${DB_PASSWORD}"

#############################################################################
# Step 3: Configure Environment
#############################################################################

log_info "Creating environment configuration..."

# Get BGPalerter API URL (default to localhost:8011)
read -p "Enter BGPalerter API URL [http://127.0.0.1:8011]: " BGPALERTER_URL
BGPALERTER_URL=${BGPALERTER_URL:-http://127.0.0.1:8011}

# Create .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL=mysql://bgp_user:${DB_PASSWORD}@localhost:3306/bgpalerter_dashboard

# BGPalerter Integration
BGPALERTER_API_URL=${BGPALERTER_URL}

# Application Configuration
NODE_ENV=production
PORT=3000
EOF

log_info "Environment configuration created"

#############################################################################
# Step 4: Install Dependencies
#############################################################################

log_info "Installing application dependencies..."
pnpm install

#############################################################################
# Step 5: Initialize Database
#############################################################################

log_info "Initializing database schema..."
pnpm db:push

log_info "Verifying database tables..."
mysql -u bgp_user -p${DB_PASSWORD} bgpalerter_dashboard -e "SHOW TABLES;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log_info "Database tables created successfully"
else
    log_error "Failed to create database tables"
    exit 1
fi

#############################################################################
# Step 6: Build Application
#############################################################################

log_info "Building application..."
pnpm build

if [ ! -f "dist/index.js" ]; then
    log_error "Build failed - dist/index.js not found"
    exit 1
fi

log_info "Build completed successfully"

#############################################################################
# Step 7: Configure PM2
#############################################################################

log_info "Configuring PM2 process manager..."

# Stop existing process if running
pm2 delete bgpalerter-dashboard 2>/dev/null || true

# Start application
pm2 start dist/index.js --name bgpalerter-dashboard

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

log_info "PM2 configured successfully"

#############################################################################
# Step 8: Verify Installation
#############################################################################

log_info "Verifying installation..."

sleep 3

# Check if PM2 process is running
if pm2 list | grep -q "bgpalerter-dashboard.*online"; then
    log_info "Dashboard is running"
else
    log_error "Dashboard failed to start"
    log_info "Check logs with: pm2 logs bgpalerter-dashboard"
    exit 1
fi

# Check if HTTP server is responding
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    log_info "Dashboard HTTP server is responding"
else
    log_warn "Dashboard HTTP server not responding yet (may need more time to start)"
fi

#############################################################################
# Step 9: Display Summary
#############################################################################

echo ""
echo "========================================================================="
echo -e "${GREEN}BGPalerter Dashboard Deployment Complete!${NC}"
echo "========================================================================="
echo ""
echo "Dashboard URL: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Database Configuration:"
echo "  Database: bgpalerter_dashboard"
echo "  User: bgp_user"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo "IMPORTANT: Save the database password above!"
echo ""
echo "Useful Commands:"
echo "  Dashboard logs:    pm2 logs bgpalerter-dashboard"
echo "  Dashboard restart: pm2 restart bgpalerter-dashboard"
echo "  Dashboard stop:    pm2 stop bgpalerter-dashboard"
echo "  Dashboard status:  pm2 status"
echo ""
echo "  BGPalerter logs:   docker logs bgpalerter --tail 50"
echo "  BGPalerter status: docker ps | grep bgpalerter"
echo ""
echo "Next Steps:"
echo "  1. Access the dashboard in your browser"
echo "  2. Configure webhook notifications in Administration panel"
echo "  3. Set up Nginx reverse proxy with HTTPS (see DEPLOYMENT.md)"
echo ""
echo "========================================================================="

# Save credentials to file
cat > /root/bgpalerter-dashboard-credentials.txt << EOF
BGPalerter Dashboard Credentials
Generated: $(date)

Database: bgpalerter_dashboard
User: bgp_user
Password: ${DB_PASSWORD}

Dashboard URL: http://$(hostname -I | awk '{print $1}'):3000
BGPalerter API: ${BGPALERTER_URL}
EOF

chmod 600 /root/bgpalerter-dashboard-credentials.txt
log_info "Credentials saved to: /root/bgpalerter-dashboard-credentials.txt"

exit 0
