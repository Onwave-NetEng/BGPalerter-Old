#!/bin/bash
# Node.js 22 Installation Module
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
    output_json "running" 25 "Running pre-installation checks" "Checking for existing Node.js"
    
    # Check if Node.js already installed
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        output_json "success" 100 "Node.js already installed" "$NODE_VERSION"
        exit 0
    fi
}

# Install function
install() {
    output_json "running" 50 "Installing Node.js 22" "Downloading and installing via NodeSource"
    
    # Install prerequisites
    sudo apt-get update -qq
    sudo apt-get install -y -qq ca-certificates curl gnupg
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    
    # Install Node.js
    sudo apt-get install -y -qq nodejs
}

# Validate function
validate() {
    output_json "running" 90 "Validating installation" "Checking Node.js version"
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        output_json "error" 90 "Node.js command not found" "Installation may have failed"
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    output_json "success" 100 "Node.js validated" "Node.js $NODE_VERSION, npm $NPM_VERSION installed"
}

# Main execution
main() {
    pre_check
    install
    validate
}

# Run main function
main
