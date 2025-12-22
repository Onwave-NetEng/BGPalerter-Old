# BGPalerter Dashboard

A modern, professional web dashboard for monitoring and managing BGPalerter - the BGP monitoring and alerting system for AS58173 (Onwave).

## Features

### Core Functionality
- **Real-time BGP Monitoring** - Live status of RIS connector, RPKI validation, and container health
- **Monitor Status Grid** - Visual overview of all active BGP monitors (Hijack, RPKI, Visibility, Path, New Prefix, ROA)
- **Recent Alerts Table** - Chronological view of BGP events with severity indicators
- **Configuration Management** - Web-based YAML editor with syntax validation
- **Version Control** - Automatic Git commits and GitHub integration for all configuration changes
- **Microsoft Teams Integration** - Automated notifications for configuration changes and critical alerts
- **Manual Refresh** - On-demand data refresh from BGPalerter API
- **Role-Based Access Control** - Admin, Operator, and Viewer roles with appropriate permissions

### Design Highlights
- **Onwave Branding** - Dark theme with orange (#FF6B35) accent colors matching Onwave corporate identity
- **Modular Components** - Reusable React components (StatusCard, MonitorCard, AlertsTable, FileEditor)
- **Responsive Layout** - Works on desktop, tablet, and mobile devices
- **Professional UI** - Built with shadcn/ui components and Tailwind CSS 4

## Architecture

### Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Node.js 22 + Express + tRPC 11
- **Database**: MySQL/TiDB (via Drizzle ORM)
- **Authentication**: Manus OAuth with JWT sessions
- **Code Editor**: Monaco Editor (VS Code engine)
- **Version Control**: simple-git + Octokit (GitHub API)

### Project Structure
```
bgpalerter-dashboard/
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   └── dashboard/    # Reusable dashboard components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx        # Main monitoring dashboard
│   │   │   └── Administration.tsx   # Config file management
│   │   └── App.tsx           # Routing and auth
├── server/                    # Backend Node.js application
│   ├── services/
│   │   ├── bgpalerter.service.ts   # BGPalerter API integration
│   │   ├── github.service.ts       # Git automation
│   │   ├── teams.service.ts        # Teams notifications
│   │   └── file.service.ts         # File management
│   ├── db.ts                 # Database helpers
│   └── routers.ts            # tRPC API routes
└── drizzle/
    └── schema.ts             # Database schema
```

## Installation

### Prerequisites
- Node.js 22+ and pnpm
- MySQL or TiDB database
- BGPalerter running with REST API enabled (port 8011)
- (Optional) GitHub repository for configuration versioning
- (Optional) Microsoft Teams webhook for notifications

### Quick Start

1. **Clone the repository**
   ```bash
   cd /home/ubuntu
   git clone <your-repo-url> bgpalerter-dashboard
   cd bgpalerter-dashboard
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file or set these environment variables:
   
   ```bash
   # Database
   DATABASE_URL=mysql://user:password@host:port/database
   
   # BGPalerter API
   BGPALERTER_API_URL=http://127.0.0.1:8011
   BGPALERTER_CONFIG_PATH=/home/ubuntu/BGPalerter/config
   
   # GitHub Integration (optional)
   GITHUB_REPO_PATH=/home/ubuntu/BGPalerter
   GITHUB_REMOTE_URL=https://github.com/Onwave-NetEng/BGPalerter.git
   GITHUB_BRANCH=main
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_USER_NAME="BGPalerter Dashboard"
   GITHUB_USER_EMAIL=bgpalerter@onwave.com
   
   # Microsoft Teams (optional)
   TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-url
   TEAMS_NOTIFICATIONS_ENABLED=true
   
   # Dashboard URL (for Teams notifications)
   DASHBOARD_URL=https://your-dashboard-url.com
   ```

4. **Initialize database**
   ```bash
   pnpm db:push
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the dashboard**
   
   Open your browser to `http://localhost:3000`

## Production Deployment

### Option 1: Systemd Service

1. **Build the application**
   ```bash
   pnpm build
   ```

2. **Create systemd service**
   ```bash
   sudo nano /etc/systemd/system/bgpalerter-dashboard.service
   ```

   ```ini
   [Unit]
   Description=BGPalerter Dashboard
   After=network.target

   [Service]
   Type=simple
   User=ubuntu
   WorkingDirectory=/home/ubuntu/bgpalerter-dashboard
   ExecStart=/usr/bin/node /home/ubuntu/bgpalerter-dashboard/dist/index.js
   Restart=always
   Environment=NODE_ENV=production
   EnvironmentFile=/home/ubuntu/bgpalerter-dashboard/.env

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start the service**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable bgpalerter-dashboard
   sudo systemctl start bgpalerter-dashboard
   ```

### Option 2: Docker (Future Enhancement)

Docker support is planned for future releases.

## Configuration

### BGPalerter Setup

Ensure your BGPalerter `config.yml` includes the REST API configuration:

```yaml
rest:
  host: 0.0.0.0
  port: 8011

processMonitors:
  - file: uptimeApi
    params:
      useStatusCodes: true
```

### GitHub Integration

To enable automatic Git commits:

1. Generate a GitHub Personal Access Token with `repo` scope
2. Set `GITHUB_TOKEN` environment variable
3. Configure `GITHUB_REPO_PATH` to point to your BGPalerter directory
4. Ensure the repository is initialized: `cd /home/ubuntu/BGPalerter && git init`

### Teams Notifications

To enable Teams notifications:

1. Create an Incoming Webhook in your Teams channel
2. Set `TEAMS_WEBHOOK_URL` environment variable
3. Set `TEAMS_NOTIFICATIONS_ENABLED=true`

## User Roles

- **Admin**: Full access to all features including file editing, system actions, and audit logs
- **Operator**: Can view monitoring data and perform system actions, but cannot edit configuration files
- **Viewer**: Read-only access to monitoring dashboards

The project owner (configured via `OWNER_OPEN_ID`) is automatically assigned the Admin role.

## API Endpoints

The dashboard exposes a tRPC API with the following routers:

- `bgpalerter.*` - BGPalerter monitoring data (status, monitors, alerts, metrics)
- `config.*` - Configuration file management (list, get, save, validate, history)
- `github.*` - Git integration (status, history, test connection)
- `actions.*` - System actions (restart, health check, Teams test)
- `audit.*` - Audit log access (admin only)

## Development

### Running Tests
```bash
pnpm test
```

### Type Checking
```bash
pnpm check
```

### Code Formatting
```bash
pnpm format
```

## Reusable Components

The dashboard includes several modular components designed for reuse:

### StatusCard
Displays system status with icon, value, and color-coded health indicator.

```tsx
<StatusCard
  title="RIS Connector"
  value="Connected"
  icon={Activity}
  status="healthy"
  description="RIPE RIS Live connection"
/>
```

### MonitorCard
Shows individual monitor status in a grid layout.

```tsx
<MonitorCard
  name="Hijack Monitor"
  type="monitorHijack"
  icon={Globe}
  active={true}
/>
```

### AlertsTable
Displays BGP alerts with severity indicators and timestamps.

```tsx
<AlertsTable alerts={alertsArray} />
```

### FileEditor
Monaco-based YAML editor with syntax validation and save functionality.

```tsx
<FileEditor
  filename="config.yml"
  initialContent={content}
  onSave={handleSave}
/>
```

## Troubleshooting

### BGPalerter API Not Responding

Check that BGPalerter is running and the REST API is enabled:
```bash
docker compose ps
curl http://127.0.0.1:8011/status
```

### Git Errors

If you see "Cannot use simple-git on a directory that does not exist":
```bash
cd /home/ubuntu/BGPalerter
git init
git remote add origin <your-repo-url>
```

### Database Connection Issues

Verify your `DATABASE_URL` is correct:
```bash
mysql -h host -u user -p database
```

## Future Enhancements

- Advanced AS path visualization with D3.js
- Time series graphs for BGP update metrics
- Enhanced diff viewer for configuration changes
- User management UI for role assignment
- Advanced search and filtering for alerts
- Export functionality for reports
- Webhook integration for custom notifications

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/Onwave-NetEng/bgpalerter-dashboard/issues
- Email: support@onwave.com

## Credits

Built for Onwave (AS58173) by Manus AI
