#!/bin/bash
# BGPalerter Backend Deployment Module
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
    output_json "running" 25 "Running pre-deployment checks" "Checking Docker and BGPalerter directory"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        output_json "error" 0 "Docker not found" "Please install Docker first"
        exit 1
    fi
    
    # Check if BGPalerter directory exists
    if [ ! -d "../BGPalerter" ]; then
        output_json "error" 0 "BGPalerter directory not found" "Expected ../BGPalerter directory"
        exit 1
    fi
    
    # Check if config files exist
    if [ ! -f "../BGPalerter/config/config.yml" ]; then
        output_json "error" 0 "config.yml not found" "Missing BGPalerter configuration"
        exit 1
    fi
}

# Deploy function
deploy() {
    output_json "running" 50 "Deploying BGPalerter" "Starting Docker container"
    
    # Navigate to BGPalerter directory
    cd ../BGPalerter
    
    # Create required directories
    mkdir -p logs cache
    
    # Start BGPalerter with Docker Compose
    sudo docker compose up -d
    
    cd - > /dev/null
}

# Validate function
validate() {
    output_json "running" 90 "Validating deployment" "Checking BGPalerter status"
    
    # Wait for BGPalerter to start
    sleep 10
    
    # Check if container is running
    if ! sudo docker ps | grep -q bgpalerter; then
        output_json "error" 90 "BGPalerter container not running" "Docker container failed to start"
        exit 1
    fi
    
    # Check if API is responding
    if curl -sf http://localhost:8011/status > /dev/null 2>&1; then
        output_json "success" 100 "BGPalerter deployed" "BGPalerter backend running on port 8011"
    else
        output_json "warning" 95 "BGPalerter deployed but API not ready" "Container running but API not responding yet. May need more time to start."
    fi
}

# Main execution
main() {
    pre_check
    deploy
    validate
}

# Run main function
main
