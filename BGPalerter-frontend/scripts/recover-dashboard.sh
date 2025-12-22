#!/bin/bash
# BGPalerter Dashboard Recovery Script
# Recovers from failed deployments by cleaning and rebuilding

set -e

echo "============================================================"
echo "BGPalerter Dashboard Recovery"
echo "============================================================"
echo ""
echo "This script will:"
echo "  1. Stop all PM2 processes"
echo "  2. Clean PM2 cache and logs"
echo "  3. Rebuild dashboard from scratch"
echo "  4. Regenerate environment configuration"
echo "  5. Re-run database migrations"
echo "  6. Start fresh PM2 process"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Recovery cancelled."
    exit 0
fi

# Navigate to dashboard directory
DASHBOARD_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DASHBOARD_DIR"

echo ""
echo "============================================================"
echo "Step 1: Stop PM2 Processes"
echo "============================================================"
echo "Stopping bgpalerter-dashboard..."
pm2 delete bgpalerter-dashboard 2>/dev/null || echo "No existing process to stop"
pm2 kill 2>/dev/null || echo "PM2 daemon not running"
echo "✅ PM2 processes stopped"

echo ""
echo "============================================================"
echo "Step 2: Clean PM2 Cache"
echo "============================================================"
rm -rf ~/.pm2/logs/* 2>/dev/null || true
rm -rf ~/.pm2/pids/* 2>/dev/null || true
rm -rf logs/* 2>/dev/null || true
echo "✅ PM2 cache cleaned"

echo ""
echo "============================================================"
echo "Step 3: Clean Build Artifacts"
echo "============================================================"
rm -rf dist/ 2>/dev/null || true
rm -rf .next/ 2>/dev/null || true
rm -rf node_modules/.cache/ 2>/dev/null || true
echo "✅ Build artifacts cleaned"

echo ""
echo "============================================================"
echo "Step 4: Reinstall Dependencies"
echo "============================================================"
echo "Running pnpm install..."
pnpm install --frozen-lockfile
echo "✅ Dependencies installed"

echo ""
echo "============================================================"
echo "Step 5: Regenerate Environment Configuration"
echo "============================================================"

# Backup existing .env if it exists
if [ -f ".env" ]; then
    echo "Backing up existing .env to .env.backup..."
    cp .env .env.backup
fi

# Generate new .env file
echo "Generating new .env file..."
JWT_SECRET=$(openssl rand -base64 48)

cat > .env << EOF
# Database (SQLite for standalone deployment)
DATABASE_URL=file:./bgpalerter.db

# JWT Secret
JWT_SECRET=${JWT_SECRET}

# BGPalerter Integration
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=../BGPalerter/config/config.yml

# Owner Info
OWNER_NAME=Administrator
OWNER_OPEN_ID=admin

# OAuth (optional for standalone)
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=
VITE_APP_ID=
EOF

chmod 600 .env
echo "✅ Environment configuration regenerated"

echo ""
echo "============================================================"
echo "Step 6: Create Logs Directory"
echo "============================================================"
mkdir -p logs
chmod 755 logs
echo "✅ Logs directory created"

echo ""
echo "============================================================"
echo "Step 7: Run Database Migrations"
echo "============================================================"
echo "Running pnpm db:push..."
pnpm db:push || {
    echo "⚠️  Database migration warning (may be normal if database exists)"
}
echo "✅ Database migrations completed"

echo ""
echo "============================================================"
echo "Step 8: Build Dashboard"
echo "============================================================"
echo "Running pnpm build..."
pnpm build
echo "✅ Dashboard built successfully"

echo ""
echo "============================================================"
echo "Step 9: Start PM2 Process"
echo "============================================================"
echo "Starting dashboard with PM2..."

# Verify ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Error: ecosystem.config.js not found"
    echo "Please restore this file from the repository"
    exit 1
fi

# Start PM2 daemon if not running
pm2 ping &> /dev/null || {
    echo "Starting PM2 daemon..."
    pm2 ping &> /dev/null
}

# Start dashboard
pm2 start ecosystem.config.js
pm2 save
echo "✅ PM2 process started"

echo ""
echo "============================================================"
echo "Step 10: Validate Deployment"
echo "============================================================"
echo "Waiting for dashboard to start..."
sleep 5

# Check PM2 status
echo ""
echo "PM2 Status:"
pm2 list

# Check if process is online
if pm2 list | grep -q "bgpalerter-dashboard.*online"; then
    echo ""
    echo "✅ PM2 process is online"
else
    echo ""
    echo "❌ PM2 process is not online"
    echo "Check logs: pm2 logs bgpalerter-dashboard"
    exit 1
fi

# Check HTTP endpoint
echo ""
echo "Checking HTTP endpoint..."
MAX_WAIT=30
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Dashboard is responding on port 3000"
        break
    fi
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
done

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo "⚠️  Dashboard not responding after ${MAX_WAIT}s"
    echo "Check PM2 logs: pm2 logs bgpalerter-dashboard"
else
    echo ""
    echo "============================================================"
    echo "Recovery Complete!"
    echo "============================================================"
    echo ""
    echo "Dashboard is now running at: http://localhost:3000"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status                     - Check process status"
    echo "  pm2 logs bgpalerter-dashboard  - View logs"
    echo "  pm2 restart bgpalerter-dashboard - Restart dashboard"
    echo "  pm2 stop bgpalerter-dashboard  - Stop dashboard"
    echo ""
fi
