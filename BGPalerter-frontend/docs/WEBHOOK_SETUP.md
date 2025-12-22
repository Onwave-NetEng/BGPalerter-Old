# Webhook Notifications Setup Guide

## Overview

This guide provides step-by-step instructions for configuring webhook notifications in the BGPalerter Dashboard. Receive real-time BGP alerts via Microsoft Teams, Slack, or Discord.

---

## Supported Platforms

- **Microsoft Teams** - Incoming Webhooks via Connectors
- **Slack** - Incoming Webhooks via Apps
- **Discord** - Incoming Webhooks via Server Integrations

---

## Microsoft Teams Setup

### Step 1: Create Incoming Webhook in Teams

1. **Open Microsoft Teams** and navigate to the channel where you want to receive alerts

2. **Click the "..." (More options)** next to the channel name

3. **Select "Connectors"** from the menu

4. **Search for "Incoming Webhook"**
   - If not already added, click "Configure"
   - If already added, click "Configured" then "Add"

5. **Configure the webhook:**
   - Name: `BGPalerter Alerts` (or your preferred name)
   - Upload an icon (optional): Use a network/BGP related icon
   - Click "Create"

6. **Copy the webhook URL**
   - It will look like: `https://outlook.office.com/webhook/...`
   - **Keep this URL secure** - anyone with it can post to your channel

7. **Click "Done"**

### Step 2: Configure in Dashboard

1. **Log in to BGPalerter Dashboard**

2. **Navigate to Administration → Notification Settings**

3. **Enable Microsoft Teams:**
   - Toggle "Enable Teams Notifications" to ON
   - Paste the webhook URL in "Teams Webhook URL" field

4. **Configure severity filters:**
   - Select which alert severities trigger Teams notifications:
     - ☑️ Critical (recommended)
     - ☑️ Warning (recommended)
     - ☐ Info (optional - may be noisy)

5. **Test the webhook:**
   - Click "Test Teams" button
   - Check your Teams channel for test message
   - If successful, you'll see: "Test notification sent successfully"

6. **Save Settings**

### Step 3: Verify Notifications

Create a test alert or wait for a real BGP event. Teams messages will include:

- **Alert Type** (Hijack, RPKI, Visibility, etc.)
- **Severity** (Critical, Warning, Info) with color coding
- **Prefix** affected
- **AS Number** involved
- **Timestamp**
- **Description** of the event

### Teams Message Format

```
🚨 BGP Alert: Hijack Detected

Severity: Critical
Prefix: 203.0.113.0/24
AS Number: AS58173
Time: 2024-12-19 15:30:45

Description: Unauthorized announcement detected for prefix 203.0.113.0/24
```

---

## Slack Setup

### Step 1: Create Incoming Webhook in Slack

1. **Go to Slack API website:**
   - Visit: https://api.slack.com/apps

2. **Create a new app:**
   - Click "Create New App"
   - Choose "From scratch"
   - App Name: `BGPalerter Dashboard`
   - Pick your workspace
   - Click "Create App"

3. **Enable Incoming Webhooks:**
   - In the left sidebar, click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON

4. **Add webhook to workspace:**
   - Scroll down and click "Add New Webhook to Workspace"
   - Select the channel where you want alerts
   - Click "Allow"

5. **Copy the webhook URL:**
   - It will look like: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
   - **Keep this URL secure**

### Step 2: Configure in Dashboard

1. **Log in to BGPalerter Dashboard**

2. **Navigate to Administration → Notification Settings**

3. **Enable Slack:**
   - Toggle "Enable Slack Notifications" to ON
   - Paste the webhook URL in "Slack Webhook URL" field

4. **Configure severity filters:**
   - Select which alert severities trigger Slack notifications:
     - ☑️ Critical (recommended)
     - ☑️ Warning (recommended)
     - ☐ Info (optional)

5. **Test the webhook:**
   - Click "Test Slack" button
   - Check your Slack channel for test message
   - If successful, you'll see: "Test notification sent successfully"

6. **Save Settings**

### Step 3: Customize Slack App (Optional)

1. **Go back to Slack API:**
   - https://api.slack.com/apps

2. **Select your BGPalerter app**

3. **Customize appearance:**
   - Click "Basic Information"
   - Upload app icon (network/BGP related)
   - Add description: "BGP monitoring alerts from BGPalerter"
   - Choose background color

4. **Set display name:**
   - Click "App Home"
   - Set Display Name: `BGPalerter`
   - Set Default Username: `bgpalerter`

### Slack Message Format

```
🚨 *BGP Alert: Hijack Detected*

*Severity:* Critical
*Prefix:* 203.0.113.0/24
*AS Number:* AS58173
*Time:* 2024-12-19 15:30:45

*Description:* Unauthorized announcement detected for prefix 203.0.113.0/24
```

---

## Discord Setup

### Step 1: Create Webhook in Discord

1. **Open Discord** and navigate to your server

2. **Go to Server Settings:**
   - Click the server name dropdown
   - Select "Server Settings"

3. **Navigate to Integrations:**
   - Click "Integrations" in the left sidebar
   - Click "Webhooks"

4. **Create webhook:**
   - Click "New Webhook" or "Create Webhook"
   - Name: `BGPalerter Alerts`
   - Select channel where alerts should appear
   - Upload avatar (optional): Network/BGP related icon

5. **Copy webhook URL:**
   - Click "Copy Webhook URL"
   - It will look like: `https://discord.com/api/webhooks/...`
   - **Keep this URL secure**

6. **Save Changes**

### Step 2: Configure in Dashboard

1. **Log in to BGPalerter Dashboard**

2. **Navigate to Administration → Notification Settings**

3. **Enable Discord:**
   - Toggle "Enable Discord Notifications" to ON
   - Paste the webhook URL in "Discord Webhook URL" field

4. **Configure severity filters:**
   - Select which alert severities trigger Discord notifications:
     - ☑️ Critical (recommended)
     - ☑️ Warning (recommended)
     - ☐ Info (optional)

5. **Test the webhook:**
   - Click "Test Discord" button
   - Check your Discord channel for test message
   - If successful, you'll see: "Test notification sent successfully"

6. **Save Settings**

### Discord Message Format

```
🚨 BGP Alert: Hijack Detected

Severity: Critical
Prefix: 203.0.113.0/24
AS Number: AS58173
Time: 2024-12-19 15:30:45

Description: Unauthorized announcement detected for prefix 203.0.113.0/24
```

---

## Multi-Channel Configuration

You can enable multiple notification channels simultaneously. Alerts will be sent to all enabled channels.

### Recommended Configuration

**For Critical Alerts:**
- ✅ Microsoft Teams (for team collaboration)
- ✅ Slack (for operations team)
- ✅ Discord (for 24/7 monitoring channel)
- ✅ Email (for audit trail)

**For Warning Alerts:**
- ✅ Microsoft Teams
- ✅ Slack
- ☐ Discord (optional)
- ☐ Email (optional - may be noisy)

**For Info Alerts:**
- ☐ Microsoft Teams (not recommended - too noisy)
- ☐ Slack (not recommended)
- ☐ Discord (optional for monitoring)
- ☐ Email (not recommended)

---

## Severity Levels Explained

### Critical
- **Prefix hijacks** - Unauthorized announcements
- **RPKI validation failures** - Invalid ROA
- **Complete prefix withdrawal** - Visibility loss
- **Major AS path changes** - Unexpected routing

**Recommendation:** Enable all channels for critical alerts

### Warning
- **Prefix length changes** - Subnet modifications
- **AS path length increases** - Routing inefficiency
- **New prefix announcements** - Expansion monitoring
- **ROA mismatches** - Configuration issues

**Recommendation:** Enable primary channels (Teams/Slack)

### Info
- **Normal BGP updates** - Routine changes
- **Successful validations** - Confirmations
- **System status** - Dashboard health
- **Configuration changes** - Audit logs

**Recommendation:** Disable or send to dedicated monitoring channel only

---

## Testing Notifications

### Test Each Channel Individually

1. **Navigate to Administration → Notification Settings**

2. **Test each enabled channel:**
   - Click "Test Teams" for Microsoft Teams
   - Click "Test Slack" for Slack
   - Click "Test Discord" for Discord

3. **Verify test messages appear** in respective channels

4. **Check message formatting** and appearance

### Test with Real Alert

Create a test alert to verify end-to-end flow:

1. **Navigate to Alert Rules**

2. **Create a test rule:**
   - Name: "Test Notification Rule"
   - Type: Custom
   - Condition: Always trigger (for testing)
   - Severity: Warning
   - Enable all notification channels

3. **Trigger the rule** (or wait for BGP event)

4. **Verify alerts appear** in all configured channels

5. **Delete or disable test rule** after verification

---

## Troubleshooting

### Webhook Not Working

**Check webhook URL:**
```bash
# Test webhook manually (Teams example)
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

**Common issues:**
- Invalid webhook URL (check for typos)
- Webhook deleted or expired
- Network connectivity issues
- Firewall blocking outbound HTTPS

### No Notifications Received

**Verify configuration:**
1. Check webhook is enabled (toggle is ON)
2. Verify webhook URL is correct
3. Check severity filters allow the alert type
4. Test webhook with "Test" button
5. Check dashboard logs for errors:
   ```bash
   pm2 logs bgpalerter-dashboard | grep -i webhook
   ```

### Duplicate Notifications

**Possible causes:**
- Multiple rules triggering for same event
- Alert acknowledgment not working
- Dashboard restarted during alert processing

**Solution:**
1. Review alert rules for overlaps
2. Check alert history for duplicates
3. Acknowledge processed alerts

### Formatting Issues

**Teams:**
- Adaptive Cards may not render correctly in mobile app
- Use desktop or web app for best experience

**Slack:**
- Markdown formatting may differ from preview
- Test in actual channel

**Discord:**
- Embed limits: 6000 characters total
- Large alerts may be truncated

---

## Security Best Practices

### Protect Webhook URLs

1. **Never commit webhook URLs to version control**
   - Use environment variables
   - Add to `.gitignore`

2. **Rotate webhooks periodically**
   - Every 90 days recommended
   - After team member departure

3. **Limit webhook access**
   - Only share with authorized personnel
   - Use separate webhooks for different teams

4. **Monitor webhook usage**
   - Check for unexpected messages
   - Review logs regularly

### Webhook URL Storage

Webhook URLs are stored encrypted in the dashboard database. However:

- Use strong database passwords
- Restrict database access
- Regular security audits
- Backup encryption keys

---

## Rate Limiting

### Platform Limits

**Microsoft Teams:**
- 4 requests per second per webhook
- Burst: up to 20 messages

**Slack:**
- 1 request per second per webhook
- Burst: up to 30 messages per minute

**Discord:**
- 5 requests per second per webhook
- Burst: up to 30 messages per minute

### Dashboard Rate Limiting

The dashboard implements intelligent rate limiting:

- **Batching:** Multiple alerts within 5 seconds are batched
- **Throttling:** Maximum 10 notifications per minute per channel
- **Queuing:** Excess notifications queued for later delivery

---

## Advanced Configuration

### Custom Message Templates

For advanced users, message templates can be customized in the code:

**Location:** `server/services/webhooks/`

**Files:**
- `teams.service.ts` - Teams Adaptive Cards
- `slack.service.ts` - Slack Block Kit
- `discord.service.ts` - Discord Embeds

**Example customization:**
```typescript
// Add custom field to Teams message
const card = {
  // ... existing fields
  body: [
    // ... existing body
    {
      type: "FactSet",
      facts: [
        // ... existing facts
        {
          title: "Network:",
          value: "AS58173 - Your ISP Name"
        }
      ]
    }
  ]
};
```

### Webhook Retry Logic

The dashboard automatically retries failed webhook deliveries:

- **Retry attempts:** 3
- **Backoff:** Exponential (1s, 2s, 4s)
- **Timeout:** 10 seconds per attempt

Failed notifications are logged for manual review.

---

## Mobile Notifications

### Microsoft Teams Mobile

- Install Teams mobile app
- Enable push notifications in app settings
- Notifications appear as mobile alerts

### Slack Mobile

- Install Slack mobile app
- Enable push notifications in app settings
- Configure notification preferences per channel

### Discord Mobile

- Install Discord mobile app
- Enable push notifications in app settings
- Configure notification settings per server/channel

### Recommended Mobile Setup

1. **Install all apps** on mobile device
2. **Enable push notifications** for critical alerts only
3. **Use Do Not Disturb** during off-hours
4. **Set up notification keywords** (e.g., "Critical", "Hijack")
5. **Test mobile notifications** before relying on them

---

## Monitoring Webhook Health

### Dashboard Logs

Monitor webhook delivery success:

```bash
# View webhook logs
pm2 logs bgpalerter-dashboard | grep webhook

# Count successful deliveries
pm2 logs bgpalerter-dashboard | grep "webhook sent successfully" | wc -l

# Check for errors
pm2 logs bgpalerter-dashboard | grep "webhook error"
```

### Webhook Statistics

The dashboard tracks webhook statistics:

1. **Navigate to Administration → Notification Settings**
2. **View statistics:**
   - Total notifications sent
   - Success rate per channel
   - Recent failures
   - Average delivery time

---

## Configuration Checklist

### Microsoft Teams
- [ ] Incoming Webhook created in Teams channel
- [ ] Webhook URL copied securely
- [ ] Teams notifications enabled in dashboard
- [ ] Webhook URL configured
- [ ] Severity filters set
- [ ] Test notification successful
- [ ] Settings saved
- [ ] Mobile app notifications working

### Slack
- [ ] Slack app created
- [ ] Incoming Webhook enabled
- [ ] Webhook added to workspace/channel
- [ ] Webhook URL copied securely
- [ ] Slack notifications enabled in dashboard
- [ ] Webhook URL configured
- [ ] Severity filters set
- [ ] Test notification successful
- [ ] Settings saved
- [ ] Mobile app notifications working

### Discord
- [ ] Discord webhook created
- [ ] Webhook URL copied securely
- [ ] Discord notifications enabled in dashboard
- [ ] Webhook URL configured
- [ ] Severity filters set
- [ ] Test notification successful
- [ ] Settings saved
- [ ] Mobile app notifications working

---

## Example Alert Scenarios

### Scenario 1: Prefix Hijack Detection

**Alert Type:** Critical

**Channels Notified:**
- ✅ Microsoft Teams (immediate team response)
- ✅ Slack (operations team alert)
- ✅ Discord (24/7 monitoring)
- ✅ Email (audit trail)

**Message Content:**
- Alert type: Hijack Detected
- Severity: Critical
- Affected prefix: 203.0.113.0/24
- Unauthorized AS: AS64512
- Expected AS: AS58173
- Action required: Immediate investigation

### Scenario 2: RPKI Validation Failure

**Alert Type:** Warning

**Channels Notified:**
- ✅ Microsoft Teams
- ✅ Slack
- ☐ Discord (filtered out)
- ☐ Email (filtered out)

**Message Content:**
- Alert type: RPKI Validation Failed
- Severity: Warning
- Prefix: 203.0.113.0/24
- ROA status: Invalid
- Action required: Review ROA configuration

### Scenario 3: New Prefix Announcement

**Alert Type:** Info

**Channels Notified:**
- ☐ Microsoft Teams (filtered out)
- ☐ Slack (filtered out)
- ✅ Discord (monitoring channel only)
- ☐ Email (filtered out)

**Message Content:**
- Alert type: New Prefix Announced
- Severity: Info
- New prefix: 203.0.114.0/24
- Announcing AS: AS58173
- Action required: None (informational)

---

## Support

For webhook configuration issues:

1. **Test webhook manually** with curl
2. **Check dashboard logs** for error messages
3. **Verify webhook URL** is correct and active
4. **Review platform documentation:**
   - [Teams Webhooks](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
   - [Slack Webhooks](https://api.slack.com/messaging/webhooks)
   - [Discord Webhooks](https://discord.com/developers/docs/resources/webhook)
5. **Consult DEPLOYMENT_GUIDE.md** for additional troubleshooting

---

## Summary

Webhook notifications provide real-time BGP alerts across multiple platforms. Key points:

- **Easy setup** - 5 minutes per platform
- **Multi-channel** - Send to Teams, Slack, Discord simultaneously
- **Severity filtering** - Control notification volume
- **Mobile support** - Receive alerts on mobile devices
- **Secure** - Webhook URLs encrypted in database
- **Reliable** - Automatic retry on failures

Configure webhooks today to stay informed about your BGP network status!
