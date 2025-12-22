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
    
    # Check if PM2 daemon is running
    if ! pm2 ping &> /dev/null; then
        echo "PM2 daemon not responding, attempting to start..."
        pm2 ping &> /dev/null || {
            output_json "error" 0 "PM2 daemon not running" "Run 'pm2 ping' to check PM2 status"
            exit 1
        }
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
    
    # Create logs directory for PM2
    echo "Creating logs directory..."
    mkdir -p logs
    
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
    echo "Waiting for PM2 to initialize process..."
    sleep 5
    
    # Check if PM2 process exists (any status)
    if ! pm2 list | grep -q "bgpalerter-dashboard"; then
        echo "❌ CRITICAL: PM2 process 'bgpalerter-dashboard' does not exist"
        echo ""
        echo "PM2 Process List:"
        pm2 list
        echo ""
        echo "Possible causes:"
        echo "  1. ecosystem.config.js has incorrect configuration"
        echo "  2. PM2 start command failed silently"
        echo "  3. Working directory mismatch"
        echo ""
        echo "Diagnostic steps:"
        echo "  cd ../BGPalerter-frontend"
        echo "  cat ecosystem.config.js  # Check configuration"
        echo "  pm2 start ecosystem.config.js  # Try manual start"
        echo "  pm2 logs --lines 100  # Check all PM2 logs"
        output_json "error" 95 "PM2 process does not exist" "Dashboard was never added to PM2. Check ecosystem.config.js"
        exit 1
    fi
    
    # Check if PM2 process is online
    if ! pm2 list | grep -q "bgpalerter-dashboard.*online"; then
        echo "❌ ERROR: Dashboard process exists but is not 'online'"
        echo ""
        echo "PM2 Status:"
        pm2 list
        echo ""
        echo "PM2 Logs (last 100 lines):"
        pm2 logs bgpalerter-dashboard --lines 100 --nostream || true
        echo ""
        echo "Common issues:"
        echo "  - Application crashed on startup (check logs above)"
        echo "  - Missing dependencies (run: pnpm install)"
        echo "  - Port 3000 already in use (check: netstat -tlnp | grep 3000)"
        echo "  - Database connection failed (check .env file)"
        echo ""
        echo "Recovery steps:"
        echo "  cd ../BGPalerter-frontend"
        echo "  ./scripts/diagnose-dashboard.sh  # Run full diagnostic"
        echo "  ./scripts/recover-dashboard.sh   # Automated recovery"
        output_json "error" 95 "Dashboard not running in PM2" "PM2 process failed to start. Check logs above."
        exit 1
    fi
    
    echo "✅ PM2 process is online"
    
    # Verify PM2 process details
    echo ""
    echo "PM2 Process Details:"
    pm2 show bgpalerter-dashboard || true
    
    # Check if dashboard is responding (with retry)
    echo ""
    echo "Waiting for dashboard HTTP endpoint to respond on port 3000..."
    MAX_WAIT=30
    WAIT_TIME=0
    HTTP_ATTEMPTS=0
    while [ $WAIT_TIME -lt $MAX_WAIT ]; do
        HTTP_ATTEMPTS=$((HTTP_ATTEMPTS + 1))
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            echo "✅ Dashboard HTTP endpoint responding (attempt $HTTP_ATTEMPTS)"
            
            # Additional validation: Check if API endpoint works
            echo ""
            echo "Validating dashboard API endpoint..."
            if curl -sf http://localhost:3000/api/trpc/system.getStatus > /dev/null 2>&1; then
                echo "✅ Dashboard API endpoint responding"
            else
                echo "⚠️  Dashboard HTTP works but API may not be ready yet"
            fi
            
            output_json "success" 100 "Dashboard deployed successfully" "BGPalerter dashboard running on port 3000"
            echo ""
            echo "============================================================"
            echo "✅ DEPLOYMENT SUCCESSFUL"
            echo "============================================================"
            echo "Dashboard URL: http://localhost:3000"
            echo "PM2 Status: pm2 status"
            echo "PM2 Logs: pm2 logs bgpalerter-dashboard"
            echo "Restart: pm2 restart bgpalerter-dashboard"
            echo "Stop: pm2 stop bgpalerter-dashboard"
            echo "============================================================"
            return 0
        fi
        echo "  Attempt $HTTP_ATTEMPTS: No response, waiting 3s..."
        sleep 3
        WAIT_TIME=$((WAIT_TIME + 3))
    done
    
    # Dashboard not responding after timeout
    echo ""
    echo "⚠️  WARNING: Dashboard not responding after ${MAX_WAIT}s"
    echo ""
    echo "PM2 shows process is online but HTTP endpoint not responding."
    echo "This usually indicates:"
    echo "  1. Application is still starting up (wait longer)"
    echo "  2. Port 3000 is not being listened to (check application logs)"
    echo "  3. Firewall blocking port 3000 (check: sudo ufw status)"
    echo ""
    echo "PM2 Logs (last 100 lines):"
    pm2 logs bgpalerter-dashboard --lines 100 --nostream || true
    echo ""
    echo "Network Status:"
    netstat -tlnp 2>/dev/null | grep 3000 || echo "Port 3000 not listening"
    echo ""
    echo "Next steps:"
    echo "  1. Wait 30 more seconds and try: curl http://localhost:3000"
    echo "  2. Check PM2 logs: pm2 logs bgpalerter-dashboard"
    echo "  3. Run diagnostic: cd ../BGPalerter-frontend && ./scripts/diagnose-dashboard.sh"
    echo "  4. Try recovery: cd ../BGPalerter-frontend && ./scripts/recover-dashboard.sh"
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
