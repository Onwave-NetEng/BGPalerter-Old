# BGPalerter Dashboard - Non-Destructive Deployment Package

## 📦 Package Contents

This deployment package contains everything needed to safely deploy the BGPalerter Dashboard alongside your existing BGPalerter installation **without modifying any existing files**.

---

## 🎯 What's Included

### 1. Deployment Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `deploy-safe.sh` | Main deployment automation with 10-step safety checks | `scripts/` |
| `pre-deploy-check.sh` | Pre-deployment validation (checks all prerequisites) | `scripts/` |
| `rollback.sh` | Safe rollback to previous backup | `scripts/` |

### 2. Configuration Files

| File | Purpose |
|------|---------|
| `ecosystem.config.js` | PM2 process manager configuration |
| `.env.example` | Environment variable template |

### 3. Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| `QUICK_START.md` | Simplified deployment guide (3 commands) | Network engineers with limited dev experience |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment documentation (400+ lines) | All users - detailed reference |
| `README.md` | Project overview and features | All users |
| `DEPLOYMENT_PACKAGE.md` | This file - package overview | All users |

### 4. Helper Scripts (Created During Deployment)

These are automatically created in `~/server-scripts/` during deployment:

- `dashboard-status.sh` - Check dashboard status
- `dashboard-restart.sh` - Restart dashboard
- `dashboard-logs.sh` - View dashboard logs

---

## 🚀 Quick Deployment (3 Commands)

For network engineers who want to get started immediately:

```bash
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/pre-deploy-check.sh
bash scripts/deploy-safe.sh
```

Then access dashboard at: `http://your-server-ip:3000`

**See `QUICK_START.md` for detailed step-by-step instructions.**

---

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Existing BGPalerter Installation**
   - Installed at `~/BGPalerter/`
   - Configuration file at `~/BGPalerter/config/config.yml`
   - BGPalerter API running (default port 8011)

2. **System Requirements**
   - Ubuntu Linux x64 (18.04 or later)
   - Node.js 22.x or later
   - pnpm package manager
   - At least 2GB free disk space
   - Port 3000 available

3. **Access Requirements**
   - SSH access to server
   - Sudo privileges (for PM2 startup)

---

## 🛡️ Safety Guarantees

### What Will NOT Be Modified

✅ **Your existing BGPalerter installation is completely safe:**

- `~/BGPalerter/` directory - **NEVER TOUCHED**
- `config.yml` - **NEVER MODIFIED**
- BGPalerter logs - **NEVER MODIFIED**
- BGPalerter cache - **NEVER MODIFIED**
- BGPalerter data files - **NEVER MODIFIED**

### What Will Be Created

The deployment creates these **new, separate** directories:

- `~/bgpalerter-dashboard/` - Dashboard application
- `~/server-scripts/` - Helper scripts
- `~/backups/dashboard-YYYYMMDD-HHMMSS/` - Automatic backup
- `~/logs/` - Dashboard logs (separate from BGPalerter)

### How Safety Is Enforced

1. **Pre-deployment validation** - Verifies BGPalerter exists before proceeding
2. **Automatic backup** - Full backup created before any changes
3. **Explicit confirmation** - Script shows what will be created and asks for confirmation
4. **Read-only integration** - Dashboard only reads from BGPalerter, never writes
5. **Easy rollback** - One command to restore from backup

---

## 📖 Documentation Guide

### For Quick Deployment
👉 **Start here:** `QUICK_START.md`
- Simplified instructions for network engineers
- 3-command deployment
- Common troubleshooting
- No technical jargon

### For Detailed Reference
👉 **Comprehensive guide:** `DEPLOYMENT_GUIDE.md`
- Complete deployment documentation (400+ lines)
- Pre-deployment checklist
- Manual deployment steps (alternative to automated script)
- Configuration options
- Post-deployment tasks
- Operations & maintenance
- Troubleshooting guide
- Security considerations
- Performance optimization
- FAQ

### For Understanding Features
👉 **Feature overview:** `README.md`
- Complete feature list
- Architecture overview
- Technology stack
- Development information

---

## 🔄 Deployment Workflow

### Phase 1: Pre-Deployment (2 minutes)

```bash
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/pre-deploy-check.sh
```

**What it checks:**
1. BGPalerter installation exists
2. BGPalerter API is responding
3. Node.js version (18.x+)
4. pnpm installed
5. PM2 installed (or will install)
6. Port 3000 availability
7. Disk space (2GB+ free)
8. Write permissions
9. Network connectivity
10. Dashboard files present

**Output:**
- ✅ Green checkmarks = ready to deploy
- ⚠️ Yellow warnings = review but can proceed
- ❌ Red errors = must fix before deployment

### Phase 2: Deployment (5-10 minutes)

```bash
bash scripts/deploy-safe.sh
```

**What it does:**
1. Verifies BGPalerter exists (safety check)
2. Checks port availability
3. Verifies dependencies
4. Creates automatic backup
5. Shows what will be created (asks confirmation)
6. Installs dashboard dependencies
7. Configures environment variables
8. Builds production dashboard
9. Sets up PM2 process manager
10. Creates helper scripts

**Time:** 5-10 minutes (depends on internet speed)

### Phase 3: Verification (1 minute)

```bash
~/server-scripts/dashboard-status.sh
```

Access dashboard: `http://your-server-ip:3000`

Default credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ Change password immediately after first login!**

---

## 🔧 Post-Deployment Configuration

### Essential (Required)

1. **Change Default Password**
   - Log in to dashboard
   - Go to Account Settings
   - Change from `admin123`

### Recommended (Optional)

2. **Configure Webhook Notifications**
   - Navigate to Administration → Notification Settings
   - Enable Teams/Slack/Discord
   - Enter webhook URLs
   - Test notifications

3. **Set Up Custom Alert Rules**
   - Navigate to Alert Rules
   - Create rules for your network
   - Configure severity and notifications

4. **Configure Prefix Ownership**
   - Navigate to Administration → Prefix Ownership
   - Add your ASN's prefixes
   - Enable automated hijack detection

5. **Set Up HTTPS** (Production)
   - Configure Nginx reverse proxy
   - Install SSL certificate with Let's Encrypt
   - See DEPLOYMENT_GUIDE.md for instructions

---

## 🆘 Troubleshooting

### Dashboard Won't Start

```bash
# Check logs
pm2 logs bgpalerter-dashboard --lines 50

# Verify BGPalerter is running
curl http://localhost:8011/api/v1/status

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

### Can't Access Dashboard

```bash
# Check if running
pm2 list

# Check port
lsof -i :3000

# Allow through firewall
sudo ufw allow 3000/tcp
```

### No BGPalerter Data

```bash
# Check BGPalerter API
curl http://localhost:8011/api/v1/status

# Check dashboard config
cat ~/bgpalerter-dashboard/.env

# Update API URL if needed
nano ~/bgpalerter-dashboard/.env
pm2 restart bgpalerter-dashboard
```

**For more troubleshooting, see DEPLOYMENT_GUIDE.md**

---

## 🔙 Rollback

If you need to rollback:

```bash
# List backups
ls -1dt /home/ubuntu/backups/dashboard-*

# Rollback to specific backup
bash ~/bgpalerter-dashboard/scripts/rollback.sh /home/ubuntu/backups/dashboard-YYYYMMDD-HHMMSS
```

**Your BGPalerter installation is never affected by rollback.**

---

## 🗑️ Complete Removal

To completely remove the dashboard:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard
pm2 delete bgpalerter-dashboard
pm2 save

# Remove files
rm -rf /home/ubuntu/bgpalerter-dashboard
rm -rf /home/ubuntu/server-scripts
rm -rf /home/ubuntu/backups/dashboard-*
```

**Your BGPalerter installation remains completely untouched.**

---

## 📊 Dashboard Features

Once deployed, you'll have access to:

### Core Features
- ✅ Real-time BGP monitoring dashboard
- ✅ RIS route-collector integration
- ✅ Alert management with acknowledgment
- ✅ Custom alert rules engine
- ✅ Multi-channel notifications (Teams, Slack, Discord, Email)
- ✅ Alert history with filtering
- ✅ Auto-refresh (30-second polling)
- ✅ Context-sensitive help system
- ✅ Mobile-responsive design

### Advanced Features
- ✅ BGP prefix hijack detection
- ✅ Performance metrics dashboard
- ✅ AS path visualization
- ✅ ROA validation monitoring
- ✅ BGP update tracking
- ✅ Routing data analysis

### Security Features
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Secure authentication
- ✅ Session management

---

## 🔐 Security Considerations

### Immediate Actions

1. **Change default password** - Critical!
2. **Configure firewall** - Restrict access to trusted IPs
3. **Review webhook URLs** - Keep them secure

### Recommended for Production

1. **Set up HTTPS** with Nginx + Let's Encrypt
2. **Configure firewall rules** to limit access
3. **Regular updates** of system and dependencies
4. **Backup strategy** for dashboard database
5. **Monitor logs** for suspicious activity

**See DEPLOYMENT_GUIDE.md Security Considerations section for details.**

---

## 📈 Operations & Maintenance

### Daily Operations

```bash
# Check status
~/server-scripts/dashboard-status.sh

# View logs
~/server-scripts/dashboard-logs.sh

# Restart if needed
~/server-scripts/dashboard-restart.sh
```

### PM2 Commands

```bash
# List processes
pm2 list

# View detailed info
pm2 describe bgpalerter-dashboard

# View logs
pm2 logs bgpalerter-dashboard

# Monitor resources
pm2 monit
```

### Log Files

```
/home/ubuntu/logs/dashboard-error.log    # Error logs
/home/ubuntu/logs/dashboard-out.log      # Output logs
/home/ubuntu/logs/dashboard-combined.log # Combined logs
/home/ubuntu/dashboard-deployment.log    # Deployment log
```

---

## 🔄 Updating Dashboard

To update to a new version:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard

# Backup current version
cp -r ~/bgpalerter-dashboard ~/bgpalerter-dashboard.backup

# Pull latest code (if using git)
cd ~/bgpalerter-dashboard
git pull

# Install dependencies
pnpm install

# Rebuild
pnpm build

# Restart
pm2 restart bgpalerter-dashboard
```

---

## 🧪 Testing

The dashboard includes comprehensive testing:

```bash
cd ~/bgpalerter-dashboard
pnpm test
```

**Current status:** 43/43 tests passing ✅

Test coverage includes:
- Authentication and authorization
- BGPalerter API integration
- Webhook notifications (Teams, Slack, Discord)
- Alert management and email processing
- Service error handling
- Database operations

---

## 📞 Support Resources

### Documentation Files
- `QUICK_START.md` - Quick deployment guide
- `DEPLOYMENT_GUIDE.md` - Comprehensive reference
- `README.md` - Feature overview
- `docs/ENVIRONMENT.md` - Environment variables

### Helper Scripts
- `scripts/deploy-safe.sh` - Deployment automation
- `scripts/pre-deploy-check.sh` - Pre-deployment validation
- `scripts/rollback.sh` - Rollback mechanism
- `~/server-scripts/dashboard-*.sh` - Operations scripts

### Log Files
- `/home/ubuntu/logs/dashboard-*.log` - Application logs
- `/home/ubuntu/dashboard-deployment.log` - Deployment log

---

## ✅ Deployment Checklist

Use this checklist to ensure successful deployment:

### Pre-Deployment
- [ ] BGPalerter is installed and running
- [ ] BGPalerter API is accessible
- [ ] Port 3000 is available
- [ ] Node.js 22.x installed
- [ ] pnpm installed
- [ ] Sudo privileges available
- [ ] At least 2GB free disk space
- [ ] Run `pre-deploy-check.sh` (all checks pass)

### Deployment
- [ ] Run `deploy-safe.sh`
- [ ] No errors during deployment
- [ ] Backup created successfully
- [ ] Dashboard is running (`pm2 list`)
- [ ] Can access dashboard in browser

### Post-Deployment
- [ ] Changed default admin password
- [ ] Configured webhook notifications
- [ ] Set up custom alert rules
- [ ] Configured prefix ownership
- [ ] Tested alert notifications
- [ ] Configured firewall rules
- [ ] (Optional) Set up HTTPS
- [ ] Verified auto-refresh works
- [ ] All dashboard pages load correctly

---

## 🎓 Learning Resources

### For Network Engineers New to Web Development

The dashboard is designed to be easy to deploy even with limited systems/application development skills:

1. **Start with QUICK_START.md** - No technical jargon, just 3 commands
2. **Use automated scripts** - No manual configuration needed
3. **Follow checklists** - Step-by-step verification
4. **Use helper scripts** - Simple commands for common tasks
5. **Consult troubleshooting** - Common issues with solutions

### For Advanced Users

1. **DEPLOYMENT_GUIDE.md** - Complete technical reference
2. **Manual deployment** - Step-by-step without automation
3. **Configuration options** - Customize for your environment
4. **Security hardening** - Production best practices
5. **Performance optimization** - Tuning for scale

---

## 🌟 Key Benefits

### Non-Destructive Deployment
- Existing BGPalerter installation remains untouched
- Automatic backups before any changes
- Easy rollback if needed
- Separate directories for dashboard files

### Automated Safety Checks
- Pre-deployment validation
- 10-step safety verification
- Explicit confirmation before changes
- Comprehensive error handling

### Easy Operations
- Helper scripts for common tasks
- PM2 process management
- Structured logging
- Simple troubleshooting

### Production-Ready
- 43/43 tests passing
- Comprehensive error handling
- Security best practices
- Performance optimized

---

## 📝 Version Information

**Dashboard Version:** 3.3 (Production Release)

**Features:**
- Full-stack Next.js dashboard with tRPC API
- Dark theme with Onwave orange branding
- BGPalerter API integration
- RIS route-collector integration
- Alert management with acknowledgment
- Custom alert rules engine
- Multi-channel webhook notifications
- Email notification integration
- Alert history with filtering
- Auto-refresh functionality
- Context-sensitive help system
- Mobile-responsive layout
- BGP prefix hijack detection
- Performance metrics dashboard

**Testing:** 43 tests passing, zero TypeScript errors

**Status:** Production-ready ✅

---

## 🤝 Support

For issues or questions:

1. Check troubleshooting sections in documentation
2. Review logs: `pm2 logs bgpalerter-dashboard`
3. Consult deployment log: `/home/ubuntu/dashboard-deployment.log`
4. Review comprehensive DEPLOYMENT_GUIDE.md
5. Check GitHub repository issues (if available)

---

## 📄 License

See LICENSE file for details.

---

## 🎉 Ready to Deploy?

**Three simple steps:**

1. Read `QUICK_START.md`
2. Run `scripts/pre-deploy-check.sh`
3. Run `scripts/deploy-safe.sh`

**Your BGPalerter stays safe. Your network gets a powerful monitoring dashboard.**

Let's get started! 🚀
