#!/bin/bash
# PM2 Installation Module
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
    output_json "running" 25 "Running pre-installation checks" "Checking for existing PM2"
    
    # Check if PM2 already installed
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        output_json "success" 100 "PM2 already installed" "PM2 $PM2_VERSION"
        exit 0
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        output_json "error" 0 "npm not found" "Please install Node.js first"
        exit 1
    fi
}

# Install function
install() {
    output_json "running" 50 "Installing PM2" "Installing via npm"
    
    # Install PM2 globally
    sudo npm install -g pm2
}

# Configure function
configure() {
    output_json "running" 75 "Configuring PM2" "Setting up startup script"
    
    # Generate startup script
    sudo pm2 startup systemd -u $USER --hp $HOME
}

# Validate function
validate() {
    output_json "running" 90 "Validating installation" "Checking PM2 version"
    
    # Check PM2 version
    if ! command -v pm2 &> /dev/null; then
        output_json "error" 90 "PM2 command not found" "Installation may have failed"
        exit 1
    fi
    
    PM2_VERSION=$(pm2 --version)
    
    output_json "success" 100 "PM2 validated" "PM2 $PM2_VERSION installed with startup script"
}

# Main execution
main() {
    pre_check
    install
    configure
    validate
}

# Run main function
main
