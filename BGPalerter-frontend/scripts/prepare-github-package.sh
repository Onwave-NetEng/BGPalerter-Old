#!/bin/bash

#############################################################################
# BGPalerter Package - GitHub Repository Preparation Script
#
# This script prepares the complete BGPalerter package for GitHub export,
# including BGPalerter, BGPalerter-dashboard, and server-scripts directories.
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Directories
PACKAGE_DIR="/home/ubuntu/bgpalerter-package"
BGPALERTER_SRC="/home/ubuntu/BGPalerter"
DASHBOARD_SRC="/home/ubuntu/bgpalerter-dashboard"
SCRIPTS_SRC="/home/ubuntu/server-scripts"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}BGPalerter Package Preparation${NC}"
echo -e "${BLUE}For GitHub Export${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

#############################################################################
# Preparation Functions
#############################################################################

check_source_directories() {
    echo -e "${BLUE}[1/6] Checking source directories...${NC}"
    
    local missing=0
    
    if [ ! -d "$DASHBOARD_SRC" ]; then
        echo -e "${RED}✗ Dashboard directory not found: $DASHBOARD_SRC${NC}"
        ((missing++))
    else
        echo -e "${GREEN}✓ Dashboard directory found${NC}"
    fi
    
    if [ $missing -gt 0 ]; then
        echo -e "${RED}ERROR: Missing required directories${NC}"
        exit 1
    fi
    
    # BGPalerter and server-scripts are optional
    if [ ! -d "$BGPALERTER_SRC" ]; then
        echo -e "${YELLOW}⚠ BGPalerter directory not found (will be skipped)${NC}"
    else
        echo -e "${GREEN}✓ BGPalerter directory found${NC}"
    fi
    
    if [ ! -d "$SCRIPTS_SRC" ]; then
        echo -e "${YELLOW}⚠ Server scripts directory not found (will be created)${NC}"
    else
        echo -e "${GREEN}✓ Server scripts directory found${NC}"
    fi
    
    echo ""
}

create_package_directory() {
    echo -e "${BLUE}[2/6] Creating package directory...${NC}"
    
    # Remove existing package directory if it exists
    if [ -d "$PACKAGE_DIR" ]; then
        echo -e "  Removing existing package directory..."
        rm -rf "$PACKAGE_DIR"
    fi
    
    # Create fresh package directory
    mkdir -p "$PACKAGE_DIR"
    
    echo -e "${GREEN}✓ Package directory created: $PACKAGE_DIR${NC}"
    echo ""
}

copy_bgpalerter() {
    echo -e "${BLUE}[3/6] Copying BGPalerter...${NC}"
    
    if [ ! -d "$BGPALERTER_SRC" ]; then
        echo -e "${YELLOW}⚠ BGPalerter directory not found, creating placeholder${NC}"
        mkdir -p "$PACKAGE_DIR/BGPalerter"
        cat > "$PACKAGE_DIR/BGPalerter/README.md" << 'EOF'
# BGPalerter

This directory should contain your existing BGPalerter installation.

## Installation

If you don't have BGPalerter installed yet, follow the official installation guide:
https://github.com/nttgin/BGPalerter

## Directory Structure

```
BGPalerter/
├── config/
│   └── config.yml
├── src/
├── logs/
└── cache/
```

## Integration with Dashboard

The BGPalerter Dashboard reads from this directory but never modifies it.
See the dashboard documentation for integration details.
EOF
        echo -e "${YELLOW}✓ BGPalerter placeholder created${NC}"
    else
        echo -e "  Copying BGPalerter directory..."
        cp -r "$BGPALERTER_SRC" "$PACKAGE_DIR/BGPalerter"
        
        # Remove sensitive files
        if [ -f "$PACKAGE_DIR/BGPalerter/.env" ]; then
            rm "$PACKAGE_DIR/BGPalerter/.env"
            echo -e "  Removed .env file"
        fi
        
        echo -e "${GREEN}✓ BGPalerter copied${NC}"
    fi
    
    echo ""
}

copy_dashboard() {
    echo -e "${BLUE}[4/6] Copying BGPalerter Dashboard...${NC}"
    
    echo -e "  Copying dashboard directory..."
    cp -r "$DASHBOARD_SRC" "$PACKAGE_DIR/bgpalerter-dashboard"
    
    # Remove sensitive and build files
    echo -e "  Cleaning up sensitive and build files..."
    rm -rf "$PACKAGE_DIR/bgpalerter-dashboard/node_modules"
    rm -rf "$PACKAGE_DIR/bgpalerter-dashboard/dist"
    rm -rf "$PACKAGE_DIR/bgpalerter-dashboard/.git"
    
    if [ -f "$PACKAGE_DIR/bgpalerter-dashboard/.env" ]; then
        rm "$PACKAGE_DIR/bgpalerter-dashboard/.env"
    fi
    
    if [ -f "$PACKAGE_DIR/bgpalerter-dashboard/database.sqlite" ]; then
        rm "$PACKAGE_DIR/bgpalerter-dashboard/database.sqlite"
    fi
    
    # Copy GitHub-specific README
    if [ -f "$PACKAGE_DIR/bgpalerter-dashboard/.github/README_GITHUB.md" ]; then
        cp "$PACKAGE_DIR/bgpalerter-dashboard/.github/README_GITHUB.md" "$PACKAGE_DIR/bgpalerter-dashboard/README_GITHUB.md"
    fi
    
    echo -e "${GREEN}✓ Dashboard copied and cleaned${NC}"
    echo ""
}

copy_server_scripts() {
    echo -e "${BLUE}[5/6] Copying server scripts...${NC}"
    
    mkdir -p "$PACKAGE_DIR/server-scripts"
    
    if [ -d "$SCRIPTS_SRC" ]; then
        echo -e "  Copying existing server scripts..."
        cp -r "$SCRIPTS_SRC"/* "$PACKAGE_DIR/server-scripts/" 2>/dev/null || true
    fi
    
    # Create README for server-scripts
    cat > "$PACKAGE_DIR/server-scripts/README.md" << 'EOF'
# Server Scripts

This directory contains helper scripts for managing the BGPalerter Dashboard.

## Scripts

These scripts are automatically created during dashboard deployment:

- `dashboard-status.sh` - Check dashboard status
- `dashboard-restart.sh` - Restart dashboard
- `dashboard-logs.sh` - View dashboard logs

## Usage

After deploying the dashboard, these scripts will be available in `~/server-scripts/` on your server.

```bash
# Check status
~/server-scripts/dashboard-status.sh

# Restart dashboard
~/server-scripts/dashboard-restart.sh

# View logs
~/server-scripts/dashboard-logs.sh
```

## Note

If this directory is empty, the scripts will be created automatically during deployment.
See the dashboard DEPLOYMENT_GUIDE.md for details.
EOF
    
    echo -e "${GREEN}✓ Server scripts directory prepared${NC}"
    echo ""
}

create_package_readme() {
    echo -e "${BLUE}[6/6] Creating package README...${NC}"
    
    cat > "$PACKAGE_DIR/README.md" << 'EOF'
# BGPalerter Complete Package

This package contains the complete BGPalerter monitoring solution with dashboard.

## Package Contents

```
bgpalerter-package/
├── BGPalerter/              # BGP monitoring engine
├── bgpalerter-dashboard/    # Web dashboard
└── server-scripts/          # Helper scripts
```

## Quick Start

### 1. BGPalerter Installation

If you don't have BGPalerter installed yet:

```bash
cd BGPalerter
# Follow BGPalerter installation instructions
# https://github.com/nttgin/BGPalerter
```

### 2. Dashboard Deployment

Deploy the dashboard (non-destructive, won't modify BGPalerter):

```bash
cd bgpalerter-dashboard
bash scripts/pre-deploy-check.sh
bash scripts/deploy-safe.sh
```

Access dashboard at: `http://your-server-ip:3000`

### 3. Post-Deployment

Configure notifications and security:

```bash
# See dashboard documentation
cd bgpalerter-dashboard
cat QUICK_START.md
```

## Documentation

### BGPalerter
- Official documentation: https://github.com/nttgin/BGPalerter
- Configuration guide: `BGPalerter/config/config.yml`

### Dashboard
- **Quick Start:** `bgpalerter-dashboard/QUICK_START.md`
- **Deployment Guide:** `bgpalerter-dashboard/DEPLOYMENT_GUIDE.md`
- **HTTPS Setup:** `bgpalerter-dashboard/docs/HTTPS_SETUP.md`
- **Webhook Setup:** `bgpalerter-dashboard/docs/WEBHOOK_SETUP.md`

### Server Scripts
- Helper scripts documentation: `server-scripts/README.md`

## Architecture

```
┌─────────────────┐
│   BGPalerter    │  ← Monitors BGP routes
│   (Port 8011)   │
└────────┬────────┘
         │ API
         ↓
┌─────────────────┐
│    Dashboard    │  ← Web interface
│   (Port 3000)   │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│   Webhooks      │  ← Notifications
│ Teams/Slack/etc │
└─────────────────┘
```

## Features

### BGPalerter
- Real-time BGP monitoring
- Prefix hijack detection
- RPKI validation
- AS path monitoring
- Email notifications

### Dashboard
- Real-time status display
- Alert management
- Custom alert rules
- Multi-channel webhooks
- Performance metrics
- Mobile-responsive design

## System Requirements

- **OS:** Ubuntu Linux 18.04+ (x64)
- **Node.js:** 22.x or later
- **Memory:** 2GB minimum
- **Disk:** 5GB free space
- **Network:** Internet access

## Security

- Change default dashboard password immediately
- Configure HTTPS for production
- Restrict access with firewall rules
- Keep dependencies updated
- Monitor logs regularly

## Support

- **Dashboard Issues:** https://github.com/Onwave-NetEng/bgpalerter-dashboard/issues
- **BGPalerter Issues:** https://github.com/nttgin/BGPalerter/issues
- **Documentation:** See individual component READMEs

## License

- **BGPalerter:** BSD-3-Clause (see BGPalerter/LICENSE)
- **Dashboard:** MIT (see bgpalerter-dashboard/LICENSE)

## Contributing

Contributions welcome! See:
- Dashboard: `bgpalerter-dashboard/.github/CONTRIBUTING.md`
- BGPalerter: https://github.com/nttgin/BGPalerter

---

**Made with ❤️ for the BGP community**
EOF
    
    echo -e "${GREEN}✓ Package README created${NC}"
    echo ""
}

create_archive() {
    echo -e "${BLUE}Creating compressed archive...${NC}"
    
    cd /home/ubuntu
    tar -czf bgpalerter-package.tar.gz bgpalerter-package/
    
    echo -e "${GREEN}✓ Archive created: /home/ubuntu/bgpalerter-package.tar.gz${NC}"
    echo ""
}

#############################################################################
# Main Execution
#############################################################################

main() {
    check_source_directories
    create_package_directory
    copy_bgpalerter
    copy_dashboard
    copy_server_scripts
    create_package_readme
    create_archive
    
    # Success message
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Package preparation complete!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Package location:${NC}"
    echo -e "  Directory: $PACKAGE_DIR"
    echo -e "  Archive:   /home/ubuntu/bgpalerter-package.tar.gz"
    echo ""
    echo -e "${BLUE}Package contents:${NC}"
    ls -lh "$PACKAGE_DIR"
    echo ""
    echo -e "${BLUE}Archive size:${NC}"
    ls -lh /home/ubuntu/bgpalerter-package.tar.gz
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Download: scp user@server:/home/ubuntu/bgpalerter-package.tar.gz ."
    echo -e "  2. Extract:  tar -xzf bgpalerter-package.tar.gz"
    echo -e "  3. Push to GitHub or import to GitHub Desktop"
    echo ""
    echo -e "${BLUE}For GitHub:${NC}"
    echo -e "  cd bgpalerter-package/bgpalerter-dashboard"
    echo -e "  git init"
    echo -e "  git add ."
    echo -e "  git commit -m 'Initial commit'"
    echo -e "  git remote add origin https://github.com/Onwave-NetEng/bgpalerter-dashboard.git"
    echo -e "  git push -u origin main"
}

# Run main function
main
