#!/bin/bash
# pnpm Installation Module
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
    output_json "running" 25 "Running pre-installation checks" "Checking for existing pnpm"
    
    # Check if pnpm already installed
    if command -v pnpm &> /dev/null; then
        PNPM_VERSION=$(pnpm --version)
        output_json "success" 100 "pnpm already installed" "pnpm $PNPM_VERSION"
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
    output_json "running" 50 "Installing pnpm" "Installing via npm"
    
    # Install pnpm globally
    sudo npm install -g pnpm
}

# Validate function
validate() {
    output_json "running" 90 "Validating installation" "Checking pnpm version"
    
    # Check pnpm version
    if ! command -v pnpm &> /dev/null; then
        output_json "error" 90 "pnpm command not found" "Installation may have failed"
        exit 1
    fi
    
    PNPM_VERSION=$(pnpm --version)
    
    output_json "success" 100 "pnpm validated" "pnpm $PNPM_VERSION installed"
}

# Main execution
main() {
    pre_check
    install
    validate
}

# Run main function
main
