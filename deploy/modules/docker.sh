#!/bin/bash
# Docker Installation Module
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
    output_json "running" 25 "Running pre-installation checks" "Checking OS and architecture"
    
    # Check if Ubuntu
    if [ ! -f /etc/os-release ]; then
        output_json "error" 0 "Cannot detect OS" "Missing /etc/os-release"
        exit 1
    fi
    
    . /etc/os-release
    if [[ "$ID" != "ubuntu" ]]; then
        output_json "error" 0 "Unsupported OS" "This module requires Ubuntu"
        exit 1
    fi
    
    # Check if Docker already installed
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        output_json "success" 100 "Docker already installed" "$DOCKER_VERSION"
        exit 0
    fi
}

# Install function
install() {
    output_json "running" 50 "Installing Docker" "Downloading and installing Docker Engine"
    
    # Update package index
    sudo apt-get update -qq
    
    # Install prerequisites
    sudo apt-get install -y -qq ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update -qq
    sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

# Configure function
configure() {
    output_json "running" 75 "Configuring Docker" "Setting up user permissions and services"
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Enable Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
}

# Validate function
validate() {
    output_json "running" 90 "Validating installation" "Running Docker tests"
    
    # Check Docker version
    if ! command -v docker &> /dev/null; then
        output_json "error" 90 "Docker command not found" "Installation may have failed"
        exit 1
    fi
    
    DOCKER_VERSION=$(docker --version)
    
    # Test Docker (requires sudo for first run before group takes effect)
    if sudo docker run --rm hello-world &> /dev/null; then
        output_json "success" 100 "Docker validated" "Docker $DOCKER_VERSION installed. Log out and back in for group permissions."
    else
        output_json "error" 90 "Docker test failed" "Docker installed but test failed"
        exit 1
    fi
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
