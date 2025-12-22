# BGPalerter Backend

This directory contains the BGPalerter backend monitoring engine configuration and deployment files.

## Overview

BGPalerter is an open-source BGP monitoring tool that detects:
- **Prefix hijacks** - Unauthorized BGP announcements
- **Route leaks** - Incorrect route propagation
- **RPKI violations** - Invalid RPKI signatures
- **Visibility issues** - Route withdrawals
- **AS path anomalies** - Unexpected routing paths
- **New prefix announcements** - New routes being advertised

**Official Repository:** https://github.com/nttgin/BGPalerter

---

## Directory Structure

```
BGPalerter/
├── config/
│   ├── config.yml        # Main BGPalerter configuration
│   ├── groups.yml        # Prefix grouping (optional)
│   └── config.yml.old.backup  # Backup configuration
├── logs/                 # BGPalerter logs (created at runtime)
├── docker-compose.yml    # Docker deployment configuration
└── README.md             # This file
```

---

## Quick Start

### Prerequisites

- Docker >= 20.x
- Docker Compose v2
- Internet access to RIPE RIS Live
- Port 8011 available (for REST API)

### Start BGPalerter

```bash
cd BGPalerter
docker compose up -d
```

### Verify Status

```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f bgpalerter

# Check health
docker inspect --format='{{.State.Health.Status}}' bgpalerter

# Test REST API
curl http://localhost:8011/api/v1/status
```

### Stop BGPalerter

```bash
docker compose down
```

---

## Configuration

### Main Configuration (config/config.yml)

The `config.yml` file contains:
- **Connectors:** Data sources (RIPE RIS Live WebSocket)
- **Monitors:** Detection modules (hijack, newprefix, visibility, path, AS)
- **Reports:** Alert channels (email, webhooks, file)
- **Process Monitors:** REST API and health check settings

**Key Settings:**
```yaml
environment: production

connectors:
  - file: connectorRIS
    name: ris
    params:
      url: ws://ris-live.ripe.net/v1/ws/

monitors:
  - file: monitorHijack      # Hijack detection
  - file: monitorNewPrefix   # New prefix detection
  - file: monitorVisibility  # Withdrawal detection
  - file: monitorPath        # AS path monitoring
  - file: monitorAS          # ASN monitoring

reports:
  - file: reportEmail        # Email alerts
  - file: reportFile         # File-based logging

processMonitors:
  - file: uptimeApi          # REST API on port 8011
    params:
      port: 8011
      host: 0.0.0.0
```

### Monitored Prefixes

BGPalerter monitors prefixes defined in the `prefixes` section of `config.yml`:

```yaml
prefixes:
  - prefix: "103.253.146.0/24"
    description: "Onwave Primary"
    asn: 58173
    ignoreMorespecifics: false
```

**To add new prefixes:**
1. Edit `config/config.yml`
2. Add prefix entries under the `prefixes` section
3. Restart BGPalerter: `docker compose restart`

---

## Integration with Dashboard

The BGPalerter Dashboard (in `../BGPalerter-frontend/`) connects to this backend via the REST API.

**API Endpoint:** `http://localhost:8011/api/v1/`

**Dashboard Configuration:**
```bash
# In BGPalerter-frontend/.env
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/BGPalerter/config/config.yml
```

**Available API Endpoints:**
- `GET /api/v1/status` - BGPalerter health status
- `GET /api/v1/monitors` - List of active monitors
- `GET /api/v1/prefixes` - Monitored prefixes
- `GET /api/v1/alerts` - Recent alerts (if configured)

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
cd BGPalerter
docker compose up -d
```

**Advantages:**
- Isolated environment
- Easy updates (`docker compose pull && docker compose up -d`)
- Automatic restarts
- Resource limits
- Health checks

### Option 2: Native Installation

```bash
# Install BGPalerter globally
npm install -g bgpalerter

# Run with config
bgpalerter -c /path/to/config.yml
```

**Advantages:**
- No Docker dependency
- Direct file system access
- Easier debugging

---

## Monitoring & Logs

### View Logs

```bash
# Real-time logs
docker compose logs -f bgpalerter

# Last 100 lines
docker compose logs --tail 100 bgpalerter

# Logs since 1 hour ago
docker compose logs --since 1h bgpalerter
```

### Log Files

BGPalerter writes logs to `./logs/` directory:
- `error.log` - Error messages
- `reports.log` - Alert reports (if file reporter enabled)

### Health Check

```bash
# Docker health status
docker inspect --format='{{.State.Health.Status}}' bgpalerter

# API health check
curl http://localhost:8011/api/v1/status

# Expected response:
# {"status":"ok","uptime":12345,"version":"2.x.x"}
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs bgpalerter
```

**Common issues:**
- Configuration syntax error in `config.yml`
- Port 8011 already in use
- Insufficient memory

**Solutions:**
```bash
# Validate YAML syntax
yamllint config/config.yml

# Check port availability
lsof -i :8011

# Increase memory limit in docker-compose.yml
```

### API Not Responding

**Verify processMonitors is enabled:**
```yaml
processMonitors:
  - file: uptimeApi
    params:
      port: 8011
      host: 0.0.0.0
```

**Check firewall:**
```bash
# Allow port 8011
sudo ufw allow 8011/tcp
```

### No Alerts Received

**Check monitor configuration:**
```yaml
monitors:
  - file: monitorHijack
    channel: hijack
    params:
      thresholdMinPeers: 3  # Adjust threshold
```

**Verify prefixes are being monitored:**
```bash
docker compose logs bgpalerter | grep "Monitoring"
```

### Connection to RIPE RIS Failed

**Check internet connectivity:**
```bash
ping ris-live.ripe.net
```

**Check RIPE RIS status:**
https://ris-live.ripe.net/

**BGPalerter will automatically reconnect when service is restored.**

---

## Updates

### Update BGPalerter

```bash
cd BGPalerter

# Pull latest image
docker compose pull

# Restart with new image
docker compose up -d

# Verify version
docker compose logs bgpalerter | grep version
```

### Update Configuration

```bash
# Edit config
nano config/config.yml

# Restart to apply changes
docker compose restart
```

---

## Security Considerations

### API Access

The REST API on port 8011 is **not authenticated** by default. Recommendations:

1. **Firewall:** Only allow localhost access
   ```bash
   sudo ufw deny 8011/tcp
   sudo ufw allow from 127.0.0.1 to any port 8011
   ```

2. **Reverse Proxy:** Use Nginx with authentication
   ```nginx
   location /bgpalerter/ {
       auth_basic "BGPalerter API";
       auth_basic_user_file /etc/nginx/.htpasswd;
       proxy_pass http://127.0.0.1:8011/;
   }
   ```

3. **Network Isolation:** Use Docker networks
   ```yaml
   networks:
     bgpalerter-network:
       internal: true  # No external access
   ```

### Configuration Files

- Store sensitive data (SMTP passwords) in environment variables
- Use read-only mounts for config: `./config:/opt/bgpalerter/config:ro`
- Backup configuration regularly

---

## Performance Tuning

### Resource Limits

Adjust in `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
```

### Monitor Thresholds

Adjust sensitivity in `config.yml`:
```yaml
monitors:
  - file: monitorHijack
    params:
      thresholdMinPeers: 3  # Lower = more sensitive
```

### Logging

Reduce log verbosity:
```yaml
logging:
  level: warn  # Options: debug, info, warn, error
```

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup config directory
tar -czf bgpalerter-config-$(date +%Y%m%d).tar.gz config/

# Backup Docker volumes
docker run --rm -v bgpalerter-data:/data -v $(pwd):/backup \
  alpine tar -czf /backup/bgpalerter-data-$(date +%Y%m%d).tar.gz /data
```

### Restore Configuration

```bash
# Stop BGPalerter
docker compose down

# Restore config
tar -xzf bgpalerter-config-20241222.tar.gz

# Restart
docker compose up -d
```

---

## Support & Documentation

### Official Documentation
- **GitHub:** https://github.com/nttgin/BGPalerter
- **Documentation:** https://bgpalerter.readthedocs.io/
- **Issues:** https://github.com/nttgin/BGPalerter/issues

### Dashboard Integration
- See `../BGPalerter-frontend/README.md`
- See `../BGPalerter-frontend/DEPLOYMENT_GUIDE.md`

### Community
- **Mailing List:** bgpalerter@googlegroups.com
- **Slack:** #bgpalerter on network-operators.slack.com

---

## Version Information

- **BGPalerter Version:** 2.x (nttgin/bgpalerter:latest)
- **Configuration Version:** 2
- **Docker Compose Version:** 3.8
- **Deployment Type:** Production

---

## License

BGPalerter is licensed under the BSD-3-Clause License.

See: https://github.com/nttgin/BGPalerter/blob/main/LICENSE

---

**Last Updated:** December 22, 2024  
**Maintained By:** Onwave Network Engineering Team
