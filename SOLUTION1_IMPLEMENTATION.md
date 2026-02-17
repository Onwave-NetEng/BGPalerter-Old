# Solution 1 Implementation: reportSyslog for Heartbeats

## Overview
This document describes the implementation of **Solution 1** from the BGPalerter heartbeat analysis, which adds `reportSyslog` configuration to send heartbeats and operational logs to Alerta via syslog.

## Changes Made

### 1. BGPalerter/config/config.yml
Added a new `reportSyslog` reporter to the `reports` section:

```yaml
# Syslog reporter for heartbeats and operational logs to Alerta
- file: reportSyslog
  channels: [hijack, newprefix, visibility, path, misconfiguration, rpki, roa]
  params:
    host: "localhost"
    port: 514
    transport: udp
    templates:
      default: "BGPalerter Heartbeat: ${type} - ${summary} | Prefix=${prefix} | ASN=${asn} | Channel=${channel}"
      hijack: "BGPalerter Alert [HIJACK]: ${type} - ${summary} | Prefix=${prefix} | Description=${description}"
      newprefix: "BGPalerter Alert [NEW_PREFIX]: ${type} - ${summary} | Prefix=${prefix} | Description=${description}"
      visibility: "BGPalerter Alert [VISIBILITY]: ${type} - ${summary} | Prefix=${prefix} | Peers=${peers}"
      path: "BGPalerter Alert [PATH]: ${type} - ${summary} | Prefix=${prefix} | Path=${path}"
      misconfiguration: "BGPalerter Alert [MISCONFIGURATION]: ${type} - ${summary} | Prefix=${prefix} | ASN=${asn}"
      rpki: "BGPalerter Alert [RPKI]: ${type} - ${summary} | Prefix=${prefix} | Status=${status}"
      roa: "BGPalerter Alert [ROA]: ${type} - ${summary} | Prefix=${prefix} | Description=${description}"
```

### 2. BGPalerter-standalone/config/config.yml
Applied the same `reportSyslog` configuration to the standalone version for consistency.

## How It Works

1. **BGPalerter** generates alerts through its monitoring modules (hijack, newprefix, visibility, etc.)
2. These alerts are routed to configured channels
3. The `reportSyslog` reporter receives alerts from all specified channels
4. Each alert is formatted according to its channel-specific template
5. Formatted messages are sent via UDP to localhost:514 (syslog)
6. **Alerta** ingests these syslog messages and processes them as alerts

## Key Features

- **Separation of Concerns**: Keeps email alerts (`reportEmail`) and syslog forwarding (`reportSyslog`) independent
- **Channel-Specific Templates**: Each alert type has a custom template for better readability
- **UDP Transport**: Uses UDP for low-latency, non-blocking message delivery
- **Localhost Delivery**: Sends to localhost:514 where Alerta's syslog input should be listening

## Prerequisites for Deployment

### Alerta Configuration Required

Alerta must be configured to accept syslog input on port 514. This typically requires:

1. **Alerta Syslog Plugin**: Enable the syslog plugin in Alerta configuration
2. **Port Binding**: Ensure Alerta or a syslog daemon is listening on UDP port 514
3. **Message Parsing**: Configure Alerta to parse BGPalerter syslog messages

### Example Alerta Syslog Configuration

If using rsyslog as an intermediary:

```bash
# /etc/rsyslog.d/30-bgpalerter.conf
module(load="imudp")
input(type="imudp" port="514")

# Forward BGPalerter messages to Alerta
if $programname == 'BGPalerter' then {
    action(
        type="omfwd"
        target="localhost"
        port="8080"
        protocol="tcp"
        template="AlertaTemplate"
    )
}
```

Or configure Alerta to listen directly on syslog port (requires root/capabilities).

## Deployment Steps

1. **Update Configuration**: Pull the updated config files to the production server
   ```bash
   cd /path/to/BGPalerter-Old
   git pull origin main
   ```

2. **Configure Alerta Syslog Input**: Ensure Alerta is configured to receive syslog messages (see prerequisites above)

3. **Restart BGPalerter**: Apply the new configuration
   ```bash
   docker-compose restart bgpalerter
   # or
   pm2 restart bgpalerter
   ```

4. **Verify Syslog Delivery**: Check that messages are being sent
   ```bash
   # Monitor syslog
   sudo tail -f /var/log/syslog | grep BGPalerter
   
   # Or use tcpdump to verify UDP traffic
   sudo tcpdump -i lo -n udp port 514
   ```

5. **Check Alerta Dashboard**: Verify that alerts appear in the Alerta web interface

## Verification

### 1. Check BGPalerter Logs
```bash
docker logs bgpalerter --tail 50 | grep -i syslog
```

Look for:
- Reporter initialization: "reportSyslog loaded"
- No error messages related to syslog connection

### 2. Monitor Syslog Traffic
```bash
# Watch for BGPalerter messages
sudo tcpdump -i lo -A -n udp port 514 | grep -i bgpalerter
```

### 3. Query Alerta API
```bash
curl -s http://localhost:8080/api/alerts?service=BGP | jq
```

### 4. Check Alerta Dashboard
- Navigate to Alerta web UI
- Look for BGPalerter alerts with proper formatting
- Verify alert severity and categorization

## Troubleshooting

### Issue: No messages appearing in Alerta

**Possible Causes:**
1. Alerta not configured to listen on syslog port
2. Firewall blocking UDP port 514
3. BGPalerter reportSyslog module not loading

**Solutions:**
```bash
# Check if port 514 is listening
sudo netstat -ulnp | grep 514

# Check BGPalerter logs for errors
docker logs bgpalerter | grep -i error

# Verify syslog messages are being sent
sudo tcpdump -i lo -n udp port 514
```

### Issue: Messages sent but not parsed correctly

**Possible Causes:**
1. Alerta syslog parser not configured for BGPalerter format
2. Template variables not matching actual alert data

**Solutions:**
- Review Alerta syslog parsing configuration
- Check Alerta logs for parsing errors
- Adjust templates if needed based on actual BGPalerter alert structure

### Issue: Performance degradation

**Possible Causes:**
1. Too many alerts overwhelming syslog
2. UDP packet loss

**Solutions:**
- Consider switching to TCP transport (change `transport: udp` to `transport: tcp`)
- Implement rate limiting in BGPalerter configuration
- Use a dedicated syslog daemon (rsyslog/syslog-ng) as intermediary

## Alternative Configurations

### Using TCP Instead of UDP
```yaml
params:
  host: "localhost"
  port: 514
  transport: tcp  # Changed from udp
```

**Advantages:**
- Guaranteed delivery
- No packet loss

**Disadvantages:**
- Higher latency
- Connection overhead

### Using Remote Syslog Server
```yaml
params:
  host: "syslog-server.example.com"  # Remote host
  port: 514
  transport: udp
```

**Note:** Follow the user's preference to use hostnames instead of IP addresses.

### Custom Port
```yaml
params:
  host: "localhost"
  port: 5514  # Non-privileged port
  transport: udp
```

**Advantage:** Doesn't require root privileges for Alerta to bind to port 514.

## Comparison with Other Solutions

| Aspect | Solution 1 (reportSyslog) | Solution 3 (Heartbeat API) |
|--------|---------------------------|----------------------------|
| **Complexity** | Medium | Low |
| **BGPalerter Changes** | Config only | None |
| **Alerta Changes** | Syslog input required | None |
| **Alert Integration** | Native BGPalerter alerts | Separate heartbeat mechanism |
| **Reliability** | Depends on syslog | Independent timer |
| **Maintenance** | Single config file | Additional systemd service |

## Next Steps

1. **Test in Development**: Deploy to a test environment first
2. **Monitor Performance**: Watch for any performance impact
3. **Tune Templates**: Adjust message templates based on Alerta parsing
4. **Consider Hybrid**: If heartbeats still don't appear, consider implementing Solution 3 (Heartbeat API) in addition to this

## Notes

- This solution addresses the core issue: BGPalerter's `reportAlerta` module only processes alerts from specific channels, not operational logs
- `reportSyslog` can send both alerts and operational messages to syslog
- Alerta must be configured to ingest and parse syslog messages for this solution to work
- The templates are customizable and can be adjusted based on actual alert data structure

## References

- Original Analysis: `bgpalerter-heartbeat-analysis.md`
- BGPalerter Documentation: https://github.com/nttgin/BGPalerter
- Alerta Syslog Plugin: https://docs.alerta.io/en/latest/plugins.html
