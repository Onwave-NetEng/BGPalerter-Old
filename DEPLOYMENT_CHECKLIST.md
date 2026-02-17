# Solution 1 Deployment Checklist

## Pre-Deployment

- [ ] Review `SOLUTION1_IMPLEMENTATION.md` documentation
- [ ] Backup current BGPalerter configuration on production server
- [ ] Verify Alerta is running and accessible on production server
- [ ] Check current BGPalerter version and compatibility

## Alerta Syslog Configuration

### Option A: Configure Alerta to Listen Directly on Syslog Port

**Requirements:**
- Root/sudo access
- Port 514 available (or use alternative port like 5514)

**Steps:**
1. Configure Alerta to accept syslog input (check Alerta documentation)
2. Bind Alerta to UDP port 514 (requires root privileges)
3. Test syslog reception:
   ```bash
   logger -p local0.info -t BGPalerter "Test message"
   ```
4. Verify message appears in Alerta dashboard

### Option B: Use rsyslog as Intermediary (Recommended)

**Advantages:**
- No root privileges needed for Alerta
- More flexible message routing
- Better logging control

**Steps:**

1. Install rsyslog (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install rsyslog
   ```

2. Create rsyslog configuration for BGPalerter:
   ```bash
   sudo nano /etc/rsyslog.d/30-bgpalerter.conf
   ```

3. Add the following configuration:
   ```
   # Enable UDP syslog reception on port 514
   module(load="imudp")
   input(type="imudp" port="514")
   
   # Forward BGPalerter messages to Alerta
   # Option 1: Forward to Alerta API (requires Alerta HTTP input plugin)
   if $msg contains "BGPalerter" then {
       action(
           type="omhttp"
           server="localhost:8080"
           restpath="/api/alert"
           httpheaders=["Authorization: Key YOUR_API_KEY_HERE"]
           template="AlertaJsonTemplate"
       )
   }
   
   # Option 2: Log to file for Alerta to ingest
   if $msg contains "BGPalerter" then {
       action(type="omfile" file="/var/log/bgpalerter-syslog.log")
   }
   ```

4. Restart rsyslog:
   ```bash
   sudo systemctl restart rsyslog
   sudo systemctl status rsyslog
   ```

5. Test syslog reception:
   ```bash
   logger -p local0.info -t BGPalerter "Test heartbeat message"
   tail -f /var/log/bgpalerter-syslog.log
   ```

### Option C: Use Alternative Port (Non-Privileged)

If port 514 requires root and you want to avoid that:

1. Modify BGPalerter config to use port 5514:
   ```yaml
   params:
     host: "localhost"
     port: 5514  # Non-privileged port
     transport: udp
   ```

2. Configure rsyslog or Alerta to listen on port 5514

## BGPalerter Configuration Update

1. Pull latest changes from repository:
   ```bash
   cd /path/to/BGPalerter-Old
   git pull origin main
   ```

2. Review the changes:
   ```bash
   git log -1 --stat
   git diff HEAD~1 BGPalerter/config/config.yml
   ```

3. Copy updated config to production location:
   ```bash
   # Backup current config
   cp /opt/bgpalerter/config/config.yml /opt/bgpalerter/config/config.yml.backup.$(date +%Y%m%d_%H%M%S)
   
   # Copy new config
   cp BGPalerter/config/config.yml /opt/bgpalerter/config/config.yml
   ```

4. Validate configuration syntax:
   ```bash
   yamllint -d relaxed /opt/bgpalerter/config/config.yml
   # or
   python3 -c "import yaml; yaml.safe_load(open('/opt/bgpalerter/config/config.yml'))"
   ```

## Deployment

1. Stop BGPalerter:
   ```bash
   # If using Docker
   docker-compose stop bgpalerter
   
   # If using PM2
   pm2 stop bgpalerter
   
   # If using systemd
   sudo systemctl stop bgpalerter
   ```

2. Apply configuration changes (already done in step above)

3. Start BGPalerter:
   ```bash
   # If using Docker
   docker-compose up -d bgpalerter
   
   # If using PM2
   pm2 start bgpalerter
   
   # If using systemd
   sudo systemctl start bgpalerter
   ```

4. Monitor startup logs:
   ```bash
   # Docker
   docker logs -f bgpalerter
   
   # PM2
   pm2 logs bgpalerter
   
   # Systemd
   sudo journalctl -u bgpalerter -f
   ```

## Verification

### 1. Check BGPalerter Logs

Look for successful reporter initialization:
```bash
docker logs bgpalerter | grep -i syslog
```

Expected output:
```
[INFO] reportSyslog loaded successfully
[INFO] Connected to syslog at localhost:514
```

### 2. Monitor Syslog Traffic

```bash
# Watch syslog for BGPalerter messages
sudo tail -f /var/log/syslog | grep -i bgpalerter

# Or use tcpdump to capture UDP traffic
sudo tcpdump -i lo -A -n udp port 514 | grep -i bgpalerter
```

### 3. Check Alerta Dashboard

1. Open Alerta web interface: http://your-server:8080
2. Look for BGPalerter alerts/heartbeats
3. Verify alert formatting matches templates
4. Check alert severity and categorization

### 4. Test Alert Generation

Trigger a test alert to verify end-to-end flow:

```bash
# Option 1: Use BGPalerter test command (if available)
docker exec bgpalerter npm run test-alert

# Option 2: Send manual syslog message
logger -p local0.info -t BGPalerter "BGPalerter Heartbeat: test - Test message | Prefix=192.0.2.0/24 | ASN=58173 | Channel=test"
```

### 5. Query Alerta API

```bash
# Get all BGPalerter alerts
curl -s http://localhost:8080/api/alerts?service=BGP | jq

# Get recent alerts (last hour)
curl -s "http://localhost:8080/api/alerts?service=BGP&from=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S.000Z)" | jq
```

## Post-Deployment Monitoring

### First 24 Hours

- [ ] Monitor BGPalerter logs for errors
- [ ] Check Alerta for incoming alerts
- [ ] Verify syslog message delivery
- [ ] Monitor system performance (CPU, memory, network)
- [ ] Check for any alert delivery delays

### First Week

- [ ] Review alert volume and frequency
- [ ] Tune templates if needed for better formatting
- [ ] Verify no alerts are being dropped
- [ ] Check for any false positives/negatives
- [ ] Document any issues or observations

## Rollback Procedure

If issues occur:

1. Stop BGPalerter:
   ```bash
   docker-compose stop bgpalerter
   # or
   pm2 stop bgpalerter
   ```

2. Restore previous configuration:
   ```bash
   cp /opt/bgpalerter/config/config.yml.backup.YYYYMMDD_HHMMSS /opt/bgpalerter/config/config.yml
   ```

3. Restart BGPalerter:
   ```bash
   docker-compose up -d bgpalerter
   # or
   pm2 start bgpalerter
   ```

4. Verify service is working with old configuration

5. Document the issue and investigate root cause

## Troubleshooting

### Issue: BGPalerter fails to start

**Check:**
- Configuration syntax errors
- Missing dependencies
- Port conflicts

**Solution:**
```bash
# Validate config
yamllint -d relaxed /opt/bgpalerter/config/config.yml

# Check logs
docker logs bgpalerter

# Test with old config
cp /opt/bgpalerter/config/config.yml.backup.* /opt/bgpalerter/config/config.yml
```

### Issue: No syslog messages received

**Check:**
- Syslog port is listening
- No firewall blocking
- BGPalerter reportSyslog is loaded

**Solution:**
```bash
# Check if port is listening
sudo netstat -ulnp | grep 514

# Test manual syslog
logger -p local0.info -t BGPalerter "Test message"

# Check BGPalerter logs for syslog errors
docker logs bgpalerter | grep -i syslog
```

### Issue: Messages sent but not appearing in Alerta

**Check:**
- Alerta syslog input configuration
- Message parsing rules
- Alerta logs for errors

**Solution:**
```bash
# Check Alerta logs
docker logs alerta | grep -i syslog

# Verify Alerta is receiving messages
sudo tcpdump -i lo -A -n udp port 514

# Test Alerta API directly
curl -X POST http://localhost:8080/api/alert \
  -H "Authorization: Key YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "test",
    "event": "test",
    "environment": "Production",
    "severity": "informational",
    "text": "Test message"
  }'
```

### Issue: Performance degradation

**Check:**
- Alert volume
- Network latency
- System resources

**Solution:**
- Consider switching to TCP transport
- Implement rate limiting
- Use rsyslog as buffer/intermediary

## Configuration Tuning

### Adjust Syslog Port

If port 514 conflicts or requires root:

```yaml
params:
  host: "localhost"
  port: 5514  # Use alternative port
  transport: udp
```

### Switch to TCP Transport

For guaranteed delivery:

```yaml
params:
  host: "localhost"
  port: 514
  transport: tcp  # Changed from udp
```

### Customize Templates

Adjust message format based on Alerta parsing:

```yaml
templates:
  default: "BGPalerter: ${type} | ${summary}"
  hijack: "ALERT: Hijack detected | ${prefix} | ${description}"
```

### Use Remote Syslog Server

For centralized logging:

```yaml
params:
  host: "syslog-server.example.com"  # Use hostname, not IP
  port: 514
  transport: udp
```

## Success Criteria

- [ ] BGPalerter starts successfully with new configuration
- [ ] Syslog messages are being sent to localhost:514
- [ ] Alerta receives and displays BGPalerter alerts
- [ ] Alert formatting is correct and readable
- [ ] No performance degradation observed
- [ ] Email alerts still working (reportEmail not affected)
- [ ] File logging still working (reportFile not affected)
- [ ] All existing functionality preserved (no regressions)

## Additional Notes

- **Hostname vs IP**: Always use hostnames in configuration (per user preference)
- **Existing Functionality**: This change should not affect existing reportEmail or reportFile
- **Regression Testing**: Verify all existing alerts still work as expected
- **Documentation**: Keep SOLUTION1_IMPLEMENTATION.md updated with any changes

## Support

If issues persist:
1. Review `SOLUTION1_IMPLEMENTATION.md` for detailed technical information
2. Check BGPalerter documentation: https://github.com/nttgin/BGPalerter
3. Check Alerta documentation: https://docs.alerta.io
4. Review original analysis: `bgpalerter-heartbeat-analysis.md`

## Alternative Solutions

If Solution 1 doesn't work as expected, consider:

- **Solution 3**: Alerta Heartbeat API with systemd timer (simplest, no BGPalerter changes)
- **Solution 4**: Hybrid approach (reportAlerta for alerts + heartbeat timer)

See `bgpalerter-heartbeat-analysis.md` for details on alternative solutions.
