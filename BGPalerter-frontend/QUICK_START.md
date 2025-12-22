# BGPalerter Dashboard - Quick Start Guide

## For Network Engineers with Limited Dev Experience

This guide provides the simplest path to deploy the BGPalerter Dashboard alongside your existing BGPalerter installation **without modifying anything**.

---

## ⚠️ Safety First

**This deployment will NOT modify your existing BGPalerter installation.**

- ✅ Your `~/BGPalerter/` directory stays untouched
- ✅ Your `config.yml` stays untouched
- ✅ Your logs and data stay untouched
- ✅ Automatic backup created before any changes
- ✅ Easy rollback if needed

---

## Prerequisites (5 minutes)

You need:

1. **Existing BGPalerter** installed at `~/BGPalerter/`
2. **Ubuntu Linux** server (18.04 or later)
3. **SSH access** to your server
4. **Sudo privileges** on the server

That's it!

---

## Step-by-Step Deployment (10 minutes)

### Step 1: Connect to Your Server

```bash
ssh your-username@your-server-ip
```

### Step 2: Download Dashboard Files

If you received a zip file:

```bash
cd /home/ubuntu
unzip bgpalerter-dashboard.zip
cd bgpalerter-dashboard
```

If using git:

```bash
cd /home/ubuntu
git clone <repository-url> bgpalerter-dashboard
cd bgpalerter-dashboard
```

### Step 3: Run Pre-Deployment Check

This verifies your system is ready (takes 30 seconds):

```bash
bash scripts/pre-deploy-check.sh
```

**What to expect:**
- ✅ Green checkmarks = good
- ⚠️ Yellow warnings = review but can proceed
- ❌ Red errors = must fix before deployment

**Common issues:**
- If Node.js is missing, the script tells you how to install it
- If BGPalerter API isn't responding, make sure BGPalerter is running
- If port 3000 is in use, you can use a different port

### Step 4: Run Deployment

Once pre-check passes, deploy the dashboard:

```bash
bash scripts/deploy-safe.sh
```

**What happens:**
1. Script verifies BGPalerter exists (won't touch it)
2. Creates automatic backup
3. Asks for confirmation before proceeding
4. Installs dashboard dependencies
5. Builds dashboard application
6. Starts dashboard with PM2 process manager
7. Shows you the dashboard URL

**Time:** 5-10 minutes depending on internet speed

### Step 5: Access Dashboard

Open your web browser and go to:

```
http://your-server-ip:3000
```

**Default login:**
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change this password immediately after first login!**

---

## Quick Commands

After deployment, use these helper scripts:

### Check Dashboard Status
```bash
~/server-scripts/dashboard-status.sh
```

### View Dashboard Logs
```bash
~/server-scripts/dashboard-logs.sh
```

### Restart Dashboard
```bash
~/server-scripts/dashboard-restart.sh
```

---

## First-Time Setup (5 minutes)

After logging in:

### 1. Change Password (Required)
1. Click your profile icon (top right)
2. Go to "Account Settings"
3. Change password from `admin123`

### 2. Configure Notifications (Optional)
1. Go to **Administration** → **Notification Settings**
2. Enable Microsoft Teams, Slack, or Discord
3. Enter webhook URLs
4. Click **Test** to verify
5. Click **Save**

### 3. Set Up Alert Rules (Optional)
1. Go to **Alert Rules**
2. Click **Create New Rule**
3. Configure conditions (prefix length, AS path, etc.)
4. Set severity and notification channels
5. Enable rule

---

## Troubleshooting

### Dashboard Won't Start

```bash
# Check logs for errors
pm2 logs bgpalerter-dashboard --lines 50

# Verify BGPalerter is running
curl http://localhost:8011/api/v1/status

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

### Can't Access Dashboard

```bash
# Check if dashboard is running
pm2 list

# Check if port 3000 is listening
lsof -i :3000

# Allow port through firewall
sudo ufw allow 3000/tcp

# Get your server IP
hostname -I
```

### No BGPalerter Data Showing

```bash
# Verify BGPalerter API is accessible
curl http://localhost:8011/api/v1/status

# Check BGPalerter port in config
cat ~/BGPalerter/config/config.yml | grep -A 5 "server:"

# If using different port, update dashboard config
nano ~/bgpalerter-dashboard/.env
# Change BGPALERTER_API_URL to correct port

# Restart dashboard
pm2 restart bgpalerter-dashboard
```

---

## Rollback (If Needed)

If something goes wrong, rollback is easy:

```bash
# List available backups
ls -1dt /home/ubuntu/backups/dashboard-*

# Rollback to backup
bash ~/bgpalerter-dashboard/scripts/rollback.sh /home/ubuntu/backups/dashboard-YYYYMMDD-HHMMSS
```

**Your BGPalerter installation is never affected.**

---

## Complete Removal (If Needed)

To completely remove the dashboard:

```bash
# Stop dashboard
pm2 stop bgpalerter-dashboard
pm2 delete bgpalerter-dashboard
pm2 save

# Remove dashboard files
rm -rf /home/ubuntu/bgpalerter-dashboard
rm -rf /home/ubuntu/server-scripts

# (Optional) Remove backups
rm -rf /home/ubuntu/backups/dashboard-*
```

**Your BGPalerter installation remains completely untouched.**

---

## Getting Help

### Check Logs
```bash
# Dashboard logs
pm2 logs bgpalerter-dashboard

# Deployment log
cat /home/ubuntu/dashboard-deployment.log

# Error logs only
tail -50 /home/ubuntu/logs/dashboard-error.log
```

### Detailed Documentation

For more detailed information, see:

- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide
- `README.md` - Feature overview
- `docs/ENVIRONMENT.md` - Environment configuration

### Common Questions

**Q: Will this break my BGPalerter?**
A: No. The dashboard only reads from BGPalerter, never writes to it.

**Q: Can I run both on the same server?**
A: Yes. They use different ports and directories.

**Q: What if deployment fails?**
A: Automatic backup is created. Use rollback script to restore.

**Q: How do I update the dashboard later?**
A: Pull new code, run `pnpm install`, `pnpm build`, then `pm2 restart bgpalerter-dashboard`

---

## Success Checklist

After deployment, verify:

- [ ] Dashboard accessible at `http://your-server-ip:3000`
- [ ] Can log in with default credentials
- [ ] Dashboard shows BGPalerter status
- [ ] Recent alerts are displayed
- [ ] Changed default password
- [ ] BGPalerter still working normally
- [ ] Backup created at `/home/ubuntu/backups/`

---

## Next Steps

Once dashboard is running:

1. **Configure notifications** - Get alerts in Teams/Slack/Discord
2. **Set up custom rules** - Define your own alert conditions
3. **Configure prefix ownership** - Enable hijack detection
4. **Set up HTTPS** - Secure access with SSL (see DEPLOYMENT_GUIDE.md)
5. **Configure firewall** - Restrict access to trusted IPs

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review logs: `pm2 logs bgpalerter-dashboard`
3. Consult `DEPLOYMENT_GUIDE.md` for detailed troubleshooting
4. Check deployment log: `/home/ubuntu/dashboard-deployment.log`

---

## Summary

**Three commands to deploy:**

```bash
cd /home/ubuntu/bgpalerter-dashboard
bash scripts/pre-deploy-check.sh
bash scripts/deploy-safe.sh
```

**Then access:** `http://your-server-ip:3000`

**That's it!** Your BGPalerter stays untouched, and you get a powerful monitoring dashboard.
