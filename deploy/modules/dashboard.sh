#!/bin/bash
# BGPalerter Dashboard Deployment Module
# Adapted from PDeploy architecture

set -e

# Output JSON status
output_json() {
    local status=$1
    local progress=$2
    local message=$3
    local logs=$4
    echo "{\"status\":\"$status\",\"progress\":$progress,\"message\":\"$message\",\"logs\":\"$logs\"}"
}

# Pre-check function
pre_check() {
    output_json "running" 25 "Running pre-deployment checks" "Checking dependencies"
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        output_json "error" 0 "pnpm not found" "Please install pnpm first"
        exit 1
    fi
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        output_json "error" 0 "PM2 not found" "Please install PM2 first"
        exit 1
    fi
    
    # Check if dashboard directory exists
    if [ ! -d "../BGPalerter-frontend" ]; then
        output_json "error" 0 "Dashboard directory not found" "Expected ../BGPalerter-frontend directory"
        exit 1
    fi
}

# Install function
install() {
    output_json "running" 50 "Installing dashboard dependencies" "Running pnpm install"
    
    # Navigate to dashboard directory
    cd ../BGPalerter-frontend
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    cd - > /dev/null
}

# Configure function
configure() {
    output_json "running" 60 "Configuring dashboard" "Setting up environment"
    
    # Navigate to dashboard directory
    cd ../BGPalerter-frontend
    
    # Generate .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo "Generating .env file..."
        
        # Generate secure JWT secret
        JWT_SECRET=$(openssl rand -base64 48)
        
        # Create .env file
        cat > .env << EOF
# Database (SQLite for standalone deployment)
DATABASE_URL=file:./bgpalerter.db

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# BGPalerter Integration
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=../BGPalerter/config/config.yml

# Owner Info
OWNER_NAME=Administrator
OWNER_OPEN_ID=admin

# OAuth (optional for standalone)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
EOF
        
        # Set restrictive permissions
        chmod 600 .env
        echo ".env file created successfully"
    else
        echo ".env file already exists, skipping generation"
    fi
    
    # Run database migrations
    echo "Running database migrations..."
    pnpm db:push || {
        echo "Warning: Database migration failed. This may be normal if database already exists."
    }
    
    cd - > /dev/null
}

# Build function
build() {
    output_json "running" 70 "Building dashboard" "Running pnpm build"
    
    # Navigate to dashboard directory
    cd ../BGPalerter-frontend
    
    # Build dashboard
    pnpm build
    
    cd - > /dev/null
}

# Deploy function
deploy() {
    output_json "running" 85 "Deploying dashboard" "Starting with PM2"
    
    # Navigate to dashboard directory
    cd ../BGPalerter-frontend
    
    # Stop existing instance if running
    pm2 delete bgpalerter-dashboard 2>/dev/null || true
    
    # Start dashboard with PM2
    pm2 start ecosystem.config.js
    pm2 save
    
    cd - > /dev/null
}

# Validate function
validate() {
    output_json "running" 95 "Validating deployment" "Checking dashboard status"
    
    # Wait for dashboard to start
    sleep 5
    
    # Check if PM2 process is running
    if ! pm2 list | grep -q "bgpalerter-dashboard.*online"; then
        echo "Error: Dashboard process not running in PM2"
        echo "PM2 Status:"
        pm2 list
        echo "\nPM2 Logs (last 50 lines):"
        pm2 logs bgpalerter-dashboard --lines 50 --nostream || true
        output_json "error" 95 "Dashboard not running in PM2" "PM2 process failed to start. Check logs above."
        exit 1
    fi
    
    # Check if dashboard is responding (with retry)
    echo "Waiting for dashboard to respond on port 3000..."
    MAX_WAIT=30
    WAIT_TIME=0
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            output_json "success" 100 "Dashboard deployed successfully" "BGPalerter dashboard running on port 3000"
            echo "\n✅ Dashboard accessible at http://localhost:3000"
            return 0
        fi
        sleep 3
        WAIT_TIME=$((WAIT_TIME + 3))
    done
    
    # Dashboard not responding after timeout
    echo "Warning: Dashboard not responding after ${MAX_WAIT}s"
    echo "PM2 Logs (last 50 lines):"
    pm2 logs bgpalerter-dashboard --lines 50 --nostream || true
    output_json "warning" 98 "Dashboard deployed but not responding" "PM2 running but HTTP not ready. Check logs above."
}

# Main execution
main() {
    pre_check
    install
    configure
    build
    deploy
    validate
}

# Run main function
main
