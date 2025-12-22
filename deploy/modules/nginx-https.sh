#!/bin/bash
# Nginx HTTPS Configuration Module
# Sets up Nginx reverse proxy with SSL/TLS for BGPalerter Dashboard

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
    output_json "running" 10 "Running pre-deployment checks" "Checking system requirements"
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then
        echo "This module requires root privileges. Please run with sudo."
        output_json "error" 0 "Root privileges required" "Run with: sudo ./orchestrator.py nginx-https"
        exit 1
    fi
    
    # Check if dashboard is running
    if ! curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo "Warning: Dashboard not responding on port 3000"
        echo "Please deploy dashboard first: ./orchestrator.py dashboard"
        output_json "error" 0 "Dashboard not running" "Deploy dashboard before configuring HTTPS"
        exit 1
    fi
}

# Install function
install() {
    output_json "running" 30 "Installing Nginx and Certbot" "Installing packages"
    
    # Update package list
    apt-get update -qq
    
    # Install Nginx
    apt-get install -y nginx
    
    # Install Certbot for Let's Encrypt
    apt-get install -y certbot python3-certbot-nginx
    
    echo "Nginx and Certbot installed successfully"
}

# Configure function
configure() {
    output_json "running" 60 "Configuring Nginx" "Setting up reverse proxy"
    
    # Create Nginx configuration for BGPalerter Dashboard
    cat > /etc/nginx/sites-available/bgpalerter << 'EOF'
# BGPalerter Dashboard - HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# BGPalerter Dashboard - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name _;
    
    # SSL Configuration (self-signed for now, replace with Let's Encrypt)
    ssl_certificate /etc/ssl/certs/ssl-cert-snakeoil.pem;
    ssl_certificate_key /etc/ssl/private/ssl-cert-snakeoil.key;
    
    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    
    # SSL session cache
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Proxy settings for dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Proxy headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Remove default Nginx site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable BGPalerter site
    ln -sf /etc/nginx/sites-available/bgpalerter /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    echo "Nginx configuration created successfully"
}

# Deploy function
deploy() {
    output_json "running" 80 "Starting Nginx" "Restarting Nginx service"
    
    # Restart Nginx to apply configuration
    systemctl restart nginx
    
    # Enable Nginx to start on boot
    systemctl enable nginx
    
    echo "Nginx started and enabled"
}

# Validate function
validate() {
    output_json "running" 95 "Validating HTTPS setup" "Testing configuration"
    
    # Check if Nginx is running
    if ! systemctl is-active --quiet nginx; then
        output_json "error" 95 "Nginx not running" "Nginx service failed to start"
        exit 1
    fi
    
    # Test HTTPS (self-signed certificate)
    if curl -sfk https://localhost > /dev/null 2>&1; then
        echo "✅ HTTPS is working (self-signed certificate)"
    else
        echo "Warning: HTTPS not responding"
        output_json "warning" 98 "HTTPS not responding" "Check Nginx logs: journalctl -u nginx"
        return 0
    fi
    
    # Test HTTP redirect
    HTTP_RESPONSE=$(curl -sI http://localhost | head -n 1)
    if echo "$HTTP_RESPONSE" | grep -q "301"; then
        echo "✅ HTTP to HTTPS redirect working"
    else
        echo "Warning: HTTP redirect not working as expected"
    fi
    
    output_json "success" 100 "HTTPS configured successfully" "Dashboard accessible via HTTPS"
    
    # Print next steps
    echo ""
    echo "============================================================"
    echo "HTTPS Configuration Complete"
    echo "============================================================"
    echo ""
    echo "Dashboard is now accessible via HTTPS (self-signed certificate)"
    echo ""
    echo "Next steps:"
    echo "1. Access dashboard: https://your-server-ip"
    echo "   (You'll see a certificate warning - this is normal for self-signed certs)"
    echo ""
    echo "2. To obtain a valid SSL certificate from Let's Encrypt:"
    echo "   a. Ensure your server has a public domain name (e.g., bgp.example.com)"
    echo "   b. Update DNS A record to point to your server's public IP"
    echo "   c. Run: sudo certbot --nginx -d your-domain.com"
    echo "   d. Follow the prompts to obtain and install the certificate"
    echo ""
    echo "3. Certbot will automatically:"
    echo "   - Obtain SSL certificate from Let's Encrypt"
    echo "   - Update Nginx configuration"
    echo "   - Set up automatic certificate renewal"
    echo ""
    echo "4. To test certificate renewal:"
    echo "   sudo certbot renew --dry-run"
    echo ""
    echo "============================================================"
}

# Main execution
main() {
    pre_check
    install
    configure
    deploy
    validate
}

# Run main function
main
