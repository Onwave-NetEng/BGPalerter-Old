# Environment Configuration Guide

This document explains all environment variables used by the BGPalerter Dashboard.

## Required Environment Variables

These variables must be configured for the dashboard to function:

### Database
```bash
DATABASE_URL=mysql://username:password@host:port/database
```
MySQL or TiDB connection string. Required for storing users, audit logs, and configuration history.

### BGPalerter Integration
```bash
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
```
- `BGPALERTER_API_URL`: URL to BGPalerter REST API
- `BGPALERTER_CONFIG_PATH`: Path to BGPalerter configuration directory

## Optional Environment Variables

### GitHub Integration
```bash
GITHUB_ENABLED=true
GITHUB_REPO_PATH=/home/ubuntu/BGPalerter
GITHUB_REMOTE_URL=https://github.com/Onwave-NetEng/BGPalerter.git
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USER_NAME="BGPalerter Dashboard"
GITHUB_USER_EMAIL=bgpalerter@onwave.com
```

Enable automatic Git commits for configuration changes.

**To create a GitHub token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scope: `repo` (Full control of private repositories)
4. Copy the token and set as `GITHUB_TOKEN`

### Microsoft Teams Integration
```bash
TEAMS_NOTIFICATIONS_ENABLED=true
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
DASHBOARD_URL=https://bgpalerter.onwave.com
```

Enable Teams notifications for configuration changes and alerts.

**To create a Teams webhook:**
1. Open your Teams channel
2. Click ⋯ (More options) → Connectors
3. Search for "Incoming Webhook" and configure
4. Copy the webhook URL and set as `TEAMS_WEBHOOK_URL`

## Manus Platform Variables

These are automatically configured when deployed on Manus platform:

```bash
VITE_APP_ID                    # OAuth application ID
OAUTH_SERVER_URL               # OAuth backend URL
VITE_OAUTH_PORTAL_URL          # OAuth login portal URL
OWNER_OPEN_ID                  # Project owner's OpenID
OWNER_NAME                     # Project owner's name
JWT_SECRET                     # Session signing secret
BUILT_IN_FORGE_API_URL         # Manus API URL (server-side)
BUILT_IN_FORGE_API_KEY         # Manus API key (server-side)
VITE_FRONTEND_FORGE_API_URL    # Manus API URL (frontend)
VITE_FRONTEND_FORGE_API_KEY    # Manus API key (frontend)
```

**Do not manually configure these** unless self-hosting outside Manus platform.

## Configuration Methods

### Method 1: Manus Dashboard (Recommended)

Use the Manus web interface to configure secrets:
1. Open your project in Manus
2. Navigate to Settings → Secrets
3. Add environment variables through the UI

### Method 2: webdev_request_secrets Tool

For programmatic configuration during development:
```typescript
// Request new secrets from user
webdev_request_secrets({
  message: "Configure BGPalerter integration",
  secrets: [
    { key: "BGPALERTER_API_URL", description: "BGPalerter REST API URL" },
    { key: "GITHUB_TOKEN", description: "GitHub Personal Access Token" }
  ]
});
```

### Method 3: Environment File (Self-Hosting Only)

If self-hosting outside Manus:
```bash
# Create .env file
cp .env.example .env

# Edit with your values
nano .env
```

**Security Warning:** Never commit `.env` files to version control!

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Database connection string |
| `BGPALERTER_API_URL` | Yes | - | BGPalerter REST API URL |
| `BGPALERTER_CONFIG_PATH` | Yes | - | Path to BGPalerter config directory |
| `GITHUB_ENABLED` | No | `false` | Enable GitHub integration |
| `GITHUB_REPO_PATH` | No | - | Path to Git repository |
| `GITHUB_REMOTE_URL` | No | - | GitHub repository URL |
| `GITHUB_BRANCH` | No | `main` | Git branch for commits |
| `GITHUB_TOKEN` | No | - | GitHub Personal Access Token |
| `GITHUB_USER_NAME` | No | `BGPalerter Dashboard` | Git commit author name |
| `GITHUB_USER_EMAIL` | No | - | Git commit author email |
| `TEAMS_NOTIFICATIONS_ENABLED` | No | `false` | Enable Teams notifications |
| `TEAMS_WEBHOOK_URL` | No | - | Teams Incoming Webhook URL |
| `DASHBOARD_URL` | No | - | Dashboard public URL |
| `NODE_ENV` | No | `production` | Node environment |
| `PORT` | No | `3000` | Web server port |
| `DEBUG` | No | `false` | Enable debug logging |
| `API_TIMEOUT` | No | `30000` | API request timeout (ms) |
| `CACHE_TTL` | No | `60` | Cache TTL (seconds) |
| `AUDIT_LOGGING_ENABLED` | No | `true` | Enable audit logging |

## Validation

The dashboard validates environment variables on startup. Missing required variables will cause startup failure with clear error messages.

To test your configuration:
```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

Check logs for validation errors:
```bash
# Systemd service
sudo journalctl -u bgpalerter-dashboard -f

# Docker
docker logs bgpalerter-dashboard -f
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use strong tokens** - Generate with `openssl rand -base64 32`
3. **Rotate tokens regularly** - Update GitHub and Teams tokens periodically
4. **Restrict permissions** - Use minimal required scopes for tokens
5. **Encrypt at rest** - Use encrypted storage for `.env` files
6. **Limit access** - Only administrators should access environment configuration

## Troubleshooting

### "Cannot connect to database"
- Verify `DATABASE_URL` is correct
- Test connection: `mysql -h host -u user -p database`
- Check firewall rules

### "BGPalerter API not responding"
- Verify `BGPALERTER_API_URL` is correct
- Test API: `curl http://127.0.0.1:8011/status`
- Ensure BGPalerter REST API is enabled

### "GitHub push failed"
- Verify `GITHUB_TOKEN` has `repo` scope
- Test authentication: `git ls-remote $GITHUB_REMOTE_URL`
- Check repository exists and is accessible

### "Teams notification failed"
- Verify `TEAMS_WEBHOOK_URL` is correct
- Test webhook: `curl -X POST $TEAMS_WEBHOOK_URL -H 'Content-Type: application/json' -d '{"text":"Test"}'`
- Ensure webhook is not disabled in Teams

## Example Configurations

### Minimal Configuration (Development)
```bash
DATABASE_URL=mysql://root:password@localhost:3306/bgpalerter_dev
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
NODE_ENV=development
```

### Full Production Configuration
```bash
DATABASE_URL=mysql://bgpalerter_user:secure_password@db.onwave.com:3306/bgpalerter_prod
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
GITHUB_ENABLED=true
GITHUB_REPO_PATH=/home/ubuntu/BGPalerter
GITHUB_REMOTE_URL=https://github.com/Onwave-NetEng/BGPalerter.git
GITHUB_BRANCH=main
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_USER_NAME="BGPalerter Dashboard"
GITHUB_USER_EMAIL=bgpalerter@onwave.com
TEAMS_NOTIFICATIONS_ENABLED=true
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/xxxx
DASHBOARD_URL=https://bgpalerter.onwave.com
NODE_ENV=production
PORT=3000
AUDIT_LOGGING_ENABLED=true
```
