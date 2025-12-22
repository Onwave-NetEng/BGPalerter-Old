# BGPalerter Deployment Automation

Basic deployment automation system adapted from PDeploy architecture for BGPalerter integrated monitoring system.

## Overview

This deployment system provides modular, sequential installation of dependencies and deployment of BGPalerter components with automated validation and error handling.

## Architecture

```
deploy/
├── orchestrator.py      # Module execution engine
├── modules/             # Deployment modules
│   ├── docker.sh        # Docker installation
│   ├── nodejs.sh        # Node.js 22 installation
│   ├── pnpm.sh          # pnpm installation
│   ├── pm2.sh           # PM2 installation
│   ├── bgpalerter.sh    # BGPalerter backend deployment
│   └── dashboard.sh     # Dashboard deployment
└── README.md            # This file
```

## Module Structure

Each module follows a standardized 4-phase pattern:

1. **Pre-check**: Verify prerequisites and detect existing installations
2. **Install/Deploy**: Execute installation or deployment
3. **Configure**: Set up permissions, services, and configuration
4. **Validate**: Test installation and report status

All modules output JSON status for orchestrator tracking:
```json
{
  "status": "success|error|running",
  "progress": 0-100,
  "message": "Human-readable message",
  "logs": "Detailed logs"
}
```

## Quick Start

### Full Deployment (All Components)

```bash
cd deploy
./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard
```

### Selective Deployment

**Dependencies Only:**
```bash
./orchestrator.py docker nodejs pnpm pm2
```

**Backend Only:**
```bash
./orchestrator.py bgpalerter
```

**Dashboard Only:**
```bash
./orchestrator.py dashboard
```

## Available Modules

### docker.sh
Installs Docker Engine with Docker Compose plugin.

**Prerequisites:** Ubuntu 18.04+  
**Checks:** Existing Docker installation  
**Configures:** User permissions, systemd service  
**Validates:** Docker version, hello-world test

### nodejs.sh
Installs Node.js 22.x via NodeSource repository.

**Prerequisites:** Ubuntu with apt  
**Checks:** Existing Node.js installation  
**Validates:** Node.js and npm versions

### pnpm.sh
Installs pnpm package manager globally.

**Prerequisites:** Node.js and npm  
**Checks:** Existing pnpm installation  
**Validates:** pnpm version

### pm2.sh
Installs PM2 process manager with startup script.

**Prerequisites:** Node.js and npm  
**Checks:** Existing PM2 installation  
**Configures:** Systemd startup script  
**Validates:** PM2 version

### bgpalerter.sh
Deploys BGPalerter backend using Docker Compose.

**Prerequisites:** Docker, BGPalerter directory with config files  
**Checks:** Docker installation, config files  
**Deploys:** Creates logs/cache directories, starts container  
**Validates:** Container status, API health check (port 8011)

### dashboard.sh
Deploys BGPalerter dashboard with PM2.

**Prerequisites:** pnpm, PM2, dashboard directory  
**Checks:** Dependencies, dashboard directory  
**Installs:** Dashboard dependencies (pnpm install)  
**Builds:** Production build (pnpm build)  
**Deploys:** Starts with PM2, saves process list  
**Validates:** PM2 status, HTTP health check (port 3000)

## Usage Examples

### Example 1: Fresh Ubuntu Server

```bash
# Install all dependencies and deploy both components
cd deploy
./orchestrator.py docker nodejs pnpm pm2 bgpalerter dashboard
```

### Example 2: Existing Node.js Environment

```bash
# Skip Node.js, install other dependencies
./orchestrator.py docker pnpm pm2 bgpalerter dashboard
```

### Example 3: Update Dashboard Only

```bash
# Redeploy dashboard (will rebuild and restart)
./orchestrator.py dashboard
```

### Example 4: Manual Module Execution

```bash
# Run individual module directly
./modules/docker.sh
```

## Error Handling

The orchestrator stops execution on the first module failure:

```
Executing module: docker
✅ Module docker completed successfully

Executing module: nodejs
❌ Module nodejs failed. Stopping deployment.
Logs: npm not found
```

**Recovery:**
1. Fix the issue (install missing dependencies, resolve conflicts)
2. Re-run orchestrator starting from failed module
3. Modules detect existing installations and skip if already complete

## Output Format

**Console Output:**
- Progress indicators for each module
- Real-time status updates
- Summary report at completion

**JSON Output (from modules):**
```json
{
  "module": "docker",
  "status": "success",
  "progress": 100,
  "message": "Docker validated",
  "logs": "Docker 24.0.5 installed. Log out and back in for group permissions."
}
```

## Deployment Sequence

**Recommended order:**
1. `docker` - Container platform
2. `nodejs` - JavaScript runtime
3. `pnpm` - Package manager
4. `pm2` - Process manager
5. `bgpalerter` - Backend monitoring engine
6. `dashboard` - Web interface

**Dependencies:**
- `pnpm` requires `nodejs`
- `pm2` requires `nodejs`
- `bgpalerter` requires `docker`
- `dashboard` requires `pnpm` and `pm2`

## Validation

Each module validates its installation:

**Docker:**
- Command availability
- Version check
- Hello-world container test

**Node.js:**
- Command availability
- Version check (Node.js and npm)

**pnpm:**
- Command availability
- Version check

**PM2:**
- Command availability
- Version check
- Startup script configuration

**BGPalerter:**
- Container running status
- API health check (http://localhost:8011/status)

**Dashboard:**
- PM2 process status
- HTTP health check (http://localhost:3000)

## Troubleshooting

### Module Fails with "Command not found"

**Cause:** Dependency not installed  
**Solution:** Install prerequisite modules first

```bash
# For pnpm or pm2 errors
./orchestrator.py nodejs

# For bgpalerter errors
./orchestrator.py docker

# For dashboard errors
./orchestrator.py nodejs pnpm pm2
```

### Module Fails with "Permission denied"

**Cause:** Insufficient permissions  
**Solution:** Ensure user has sudo privileges

```bash
# Check sudo access
sudo -v

# Add user to sudo group if needed
sudo usermod -aG sudo $USER
```

### Module Fails with "Directory not found"

**Cause:** Incorrect working directory  
**Solution:** Run from deploy/ directory

```bash
cd /path/to/BGPalerter-integrated/deploy
./orchestrator.py <modules>
```

### BGPalerter API Not Responding

**Cause:** Container starting, needs more time  
**Solution:** Wait 30 seconds and check manually

```bash
# Check container logs
cd ../BGPalerter
sudo docker compose logs -f bgpalerter

# Check API manually
curl http://localhost:8011/status
```

### Dashboard Not Responding

**Cause:** Build process incomplete or PM2 issue  
**Solution:** Check PM2 logs

```bash
# Check PM2 status
pm2 status

# Check PM2 logs
pm2 logs bgpalerter-dashboard

# Restart manually
cd ../BGPalerter-frontend
pm2 restart bgpalerter-dashboard
```

## Extending

### Adding New Modules

1. Create new module script in `modules/`
2. Follow 4-phase pattern (pre-check, install, configure, validate)
3. Output JSON status at each phase
4. Make script executable (`chmod +x`)
5. Test individually before orchestrator integration

**Template:**
```bash
#!/bin/bash
set -e

output_json() {
    local status=$1
    local progress=$2
    local message=$3
    local logs=$4
    echo "{\"status\":\"$status\",\"progress\":$progress,\"message\":\"$message\",\"logs\":\"$logs\"}"
}

pre_check() {
    output_json "running" 25 "Pre-check phase" "Checking prerequisites"
    # Check logic here
}

install() {
    output_json "running" 50 "Install phase" "Installing component"
    # Install logic here
}

configure() {
    output_json "running" 75 "Configure phase" "Configuring component"
    # Configure logic here
}

validate() {
    output_json "running" 90 "Validate phase" "Validating installation"
    # Validate logic here
    output_json "success" 100 "Completed" "Component installed"
}

main() {
    pre_check
    install
    configure
    validate
}

main
```

## Design Principles

**Modularity:** Each module is self-contained and independent  
**Idempotency:** Modules can be run multiple times safely  
**Validation:** Every module validates its own success  
**Error Handling:** Clear error messages with actionable logs  
**Simplicity:** Basic functionality, no "whistles and bells"  
**Reusability:** Modules can be reused for other applications

## Comparison with PDeploy

**Adapted from PDeploy:**
- ✅ Modular architecture (modules directory)
- ✅ 4-phase pattern (pre-check, install, configure, validate)
- ✅ JSON status output
- ✅ Sequential orchestrator
- ✅ Error handling and validation

**Simplified for BGPalerter:**
- ❌ No web UI (command-line only)
- ❌ No AI assistant
- ❌ No manifest/checksum verification
- ❌ No rollback capability
- ❌ No retry logic

**Focus:** Basic, reliable deployment automation for BGPalerter

## System Requirements

- **OS:** Ubuntu 18.04+ (x64)
- **RAM:** Minimum 2GB, 4GB recommended
- **Disk:** 10GB free space minimum
- **Network:** Internet connection required
- **Permissions:** Sudo access required

## Support

**Documentation:**
- `README.md` - This file
- `../README.md` - Main BGPalerter documentation
- `../DEPLOYMENT_GUIDE.md` - Detailed deployment guide

**Troubleshooting:**
- Check module logs for specific errors
- Verify prerequisites are installed
- Ensure correct working directory
- Check system resources (disk space, memory)

## License

Part of BGPalerter integrated monitoring system.

---

**BGPalerter Deployment Automation** - Making deployment simple and reliable.

**Version:** 1.0.0 | **Status:** Basic | **Architecture:** PDeploy-inspired
