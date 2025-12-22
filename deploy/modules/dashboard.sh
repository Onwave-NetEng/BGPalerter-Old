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
    if ! pm2 status | grep -q bgpalerter-dashboard; then
        output_json "error" 95 "Dashboard not running in PM2" "PM2 process failed to start"
        exit 1
    fi
    
    # Check if dashboard is responding
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        output_json "success" 100 "Dashboard deployed" "BGPalerter dashboard running on port 3000"
    else
        output_json "warning" 98 "Dashboard deployed but not responding" "PM2 running but HTTP not ready yet. May need more time to start."
    fi
}

# Main execution
main() {
    pre_check
    install
    build
    deploy
    validate
}

# Run main function
main
