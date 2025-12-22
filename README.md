# BGPalerter Integrated Monitoring System

Complete BGP monitoring solution with backend engine, comprehensive dashboard, and legacy standalone frontend.

---

## 📦 Repository Structure

```
BGPalerter/
├── README.md                    # This file
│
├── BGPalerter/                  # Backend monitoring engine
│   ├── config/                  # BGPalerter configuration
│   │   ├── config.yml           # Main configuration
│   │   └── groups.yml           # Prefix grouping
│   ├── docker-compose.yml       # Docker deployment
│   └── README.md                # Backend documentation
│
├── BGPalerter-frontend/         # Comprehensive dashboard (NEW)
│   ├── client/                  # React 19 frontend
│   ├── server/                  # Node.js 22 backend (tRPC)
│   ├── scripts/                 # Deployment automation
│   ├── docs/                    # Documentation
│   └── README.md                # Dashboard documentation
│
└── BGPalerter-standalone/       # Legacy standalone dashboard
    ├── src/                     # React + Vite frontend
    ├── config/                  # Configuration files
    └── README.md                # Standalone documentation
```

---

## 🚀 Quick Start

### 1. Start BGPalerter Backend

```bash
cd BGPalerter
docker compose up -d

# Verify it's running
curl http://localhost:8011/api/v1/status
```

### 2. Deploy Comprehensive Dashboard

```bash
cd BGPalerter-frontend
bash scripts/pre-deploy-check.sh
bash scripts/deploy-safe.sh

# Access at http://your-server:3000
```

### 3. (Optional) Deploy Legacy Dashboard

```bash
cd BGPalerter-standalone
npm install
npm run dev

# Access at http://your-server:5173
```

---

## 📊 Components

### BGPalerter Backend

**Purpose:** Core BGP monitoring engine  
**Technology:** Docker (nttgin/bgpalerter)  
**Port:** 8011 (REST API)  
**Features:**
- Real-time BGP announcement monitoring via RIPE RIS
- Prefix hijack detection
- Route leak detection
- RPKI validation
- AS path anomaly detection
- Email/webhook alerting

**Documentation:** [BGPalerter/README.md](BGPalerter/README.md)

---

### BGPalerter Dashboard (Comprehensive)

**Purpose:** Full-featured web interface for BGP monitoring  
**Technology:** React 19, Node.js 22, TypeScript, tRPC  
**Port:** 3000  
**Features:**

**Monitoring & Alerts:**
- Real-time system status dashboard
- Alert history with acknowledgment
- Custom alert rules engine
- Multi-channel notifications (Teams, Slack, Discord, Email)

**Advanced Features:**
- RIPE RIS route-collector data integration
- Prefix hijack detection system
- Performance metrics visualization
- Context-sensitive help system
- Role-based access control (Admin, Operator, Viewer)

**Administration:**
- Configuration file editor
- Webhook management
- Email notification setup
- User management

**Documentation:**
- [BGPalerter-frontend/README.md](BGPalerter-frontend/README.md)
- [BGPalerter-frontend/DEPLOYMENT_GUIDE.md](BGPalerter-frontend/DEPLOYMENT_GUIDE.md)
- [BGPalerter-frontend/QUICK_START.md](BGPalerter-frontend/QUICK_START.md)
- [BGPalerter-frontend/ENGINEERING_DESIGN.md](BGPalerter-frontend/ENGINEERING_DESIGN.md)
- [BGPalerter-frontend/SYSTEMS_ADMINISTRATION.md](BGPalerter-frontend/SYSTEMS_ADMINISTRATION.md)

---

### BGPalerter Standalone (Legacy)

**Purpose:** Lightweight standalone dashboard (original production version)  
**Technology:** React + Vite  
**Port:** 5173  
**Features:**
- Basic BGP status monitoring
- Configuration file viewing
- Alert display
- Simple D3.js visualizations

**Status:** Legacy - maintained for backward compatibility  
**Recommendation:** Use comprehensive dashboard for new deployments

**Documentation:** [BGPalerter-standalone/README.md](BGPalerter-standalone/README.md)

---

## 🔧 System Requirements

### Backend (BGPalerter)
- Docker >= 20.x
- Docker Compose v2
- 512MB RAM minimum (2GB recommended)
- Internet access to RIPE RIS Live
- Port 8011 available

### Frontend (Comprehensive Dashboard)
- Node.js >= 18.x (22.x recommended)
- pnpm >= 8.x
- PM2 (for production)
- 2GB RAM minimum (4GB recommended)
- Port 3000 available

### Standalone Dashboard
- Node.js >= 16.x
- npm >= 8.x
- 512MB RAM minimum
- Port 5173 available

---

## 📖 Documentation

### Getting Started
1. [BGPalerter Backend Setup](BGPalerter/README.md)
2. [Dashboard Quick Start](BGPalerter-frontend/QUICK_START.md)
3. [Deployment Guide](BGPalerter-frontend/DEPLOYMENT_GUIDE.md)

### Administration
- [Systems Administration Guide](BGPalerter-frontend/SYSTEMS_ADMINISTRATION.md)
- [HTTPS Setup](BGPalerter-frontend/docs/HTTPS_SETUP.md)
- [Webhook Configuration](BGPalerter-frontend/docs/WEBHOOK_SETUP.md)

### Development
- [Engineering Design](BGPalerter-frontend/ENGINEERING_DESIGN.md)
- [Code Analysis](BGPalerter-frontend/CODE_ANALYSIS.md)
- [Contributing Guide](BGPalerter-frontend/.github/CONTRIBUTING.md)

### Reference
- [Token Audit Report](BGPalerter-frontend/TOKEN_AUDIT_REPORT.md)
- [QA Test Report](BGPalerter-frontend/QA_TEST_REPORT.md)
- [Repository Structure](BGPalerter-frontend/REPOSITORY_STRUCTURE.md)

---

## 🔄 Integration

### Backend → Dashboard Communication

The dashboard connects to BGPalerter via REST API:

```
BGPalerter Backend (Docker)
    ↓ REST API (port 8011)
Dashboard Backend (Node.js)
    ↓ tRPC
Dashboard Frontend (React)
```

**Configuration:**
```bash
# Dashboard environment variables
BGPALERTER_API_URL=http://127.0.0.1:8011
BGPALERTER_CONFIG_PATH=/path/to/BGPalerter/config/config.yml
```

**API Endpoints:**
- `GET /api/v1/status` - Health check
- `GET /api/v1/monitors` - Active monitors
- `GET /api/v1/prefixes` - Monitored prefixes

---

## 🚢 Deployment Scenarios

### Scenario 1: All-in-One Server (Recommended)

```
Single Server
├── BGPalerter (Docker, port 8011)
└── Dashboard (PM2, port 3000)
```

**Advantages:**
- Simple deployment
- Low latency
- Easy configuration

**Setup:**
```bash
# 1. Start backend
cd BGPalerter && docker compose up -d

# 2. Deploy dashboard
cd ../BGPalerter-frontend && bash scripts/deploy-safe.sh
```

---

### Scenario 2: Separate Backend & Frontend

```
Backend Server
└── BGPalerter (Docker, port 8011)

Frontend Server
└── Dashboard (PM2, port 3000)
```

**Advantages:**
- Scalability
- Security isolation
- Independent updates

**Setup:**
```bash
# Backend server
cd BGPalerter && docker compose up -d

# Frontend server (update BGPALERTER_API_URL)
cd BGPalerter-frontend
echo "BGPALERTER_API_URL=http://backend-server:8011" >> .env
bash scripts/deploy-safe.sh
```

---

### Scenario 3: High Availability

```
Load Balancer
├── Dashboard Instance 1
├── Dashboard Instance 2
└── Dashboard Instance 3
    ↓
BGPalerter Backend (shared)
```

**Advantages:**
- High availability
- Load distribution
- Zero-downtime updates

**Requirements:**
- Shared database (MySQL/PostgreSQL instead of SQLite)
- Session management (Redis)
- Load balancer (Nginx, HAProxy)

---

## 🔐 Security

### Network Security

**Firewall Rules:**
```bash
# BGPalerter API (localhost only)
sudo ufw deny 8011/tcp
sudo ufw allow from 127.0.0.1 to any port 8011

# Dashboard (public or restricted)
sudo ufw allow 3000/tcp
# OR restrict to specific IPs
sudo ufw allow from 203.0.113.0/24 to any port 3000
```

**Reverse Proxy (Nginx):**
```nginx
server {
    listen 443 ssl http2;
    server_name bgp-monitor.example.com;
    
    ssl_certificate /etc/letsencrypt/live/bgp-monitor.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bgp-monitor.example.com/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Authentication

**Dashboard:**
- OAuth 2.0 authentication (Manus OAuth)
- Role-based access control (Admin, Operator, Viewer)
- JWT session tokens

**BGPalerter API:**
- No built-in authentication
- Recommend localhost-only access
- Use reverse proxy with auth if external access needed

---

## 📈 Monitoring

### Health Checks

**BGPalerter:**
```bash
# Docker health
docker inspect --format='{{.State.Health.Status}}' bgpalerter

# API health
curl http://localhost:8011/api/v1/status
```

**Dashboard:**
```bash
# PM2 status
pm2 status bgpalerter-dashboard

# Application health
curl http://localhost:3000/api/health
```

### Logs

**BGPalerter:**
```bash
# Docker logs
docker compose logs -f bgpalerter

# File logs
tail -f BGPalerter/logs/error.log
```

**Dashboard:**
```bash
# PM2 logs
pm2 logs bgpalerter-dashboard

# Application logs
tail -f ~/.pm2/logs/bgpalerter-dashboard-out.log
```

---

## 🔄 Updates

### Update BGPalerter Backend

```bash
cd BGPalerter
docker compose pull
docker compose up -d
```

### Update Dashboard

```bash
cd BGPalerter-frontend
git pull origin main
pnpm install
pnpm build
pm2 restart bgpalerter-dashboard
```

---

## 🐛 Troubleshooting

### Backend Issues

**Container won't start:**
```bash
docker compose logs bgpalerter
# Check config.yml syntax
yamllint BGPalerter/config/config.yml
```

**API not responding:**
```bash
# Check if port is in use
lsof -i :8011
# Verify processMonitors in config.yml
```

### Dashboard Issues

**Dashboard won't start:**
```bash
pm2 logs bgpalerter-dashboard
# Check Node.js version
node --version  # Should be >= 18.x
```

**Can't connect to BGPalerter:**
```bash
# Test API connectivity
curl http://localhost:8011/api/v1/status
# Check BGPALERTER_API_URL in .env
```

### Integration Issues

**Dashboard shows "No Data":**
1. Verify BGPalerter is running: `docker compose ps`
2. Check API accessibility: `curl http://localhost:8011/api/v1/status`
3. Review dashboard logs: `pm2 logs bgpalerter-dashboard`
4. Verify environment variables in dashboard `.env`

---

## 📞 Support

### Official Resources
- **BGPalerter:** https://github.com/nttgin/BGPalerter
- **Documentation:** https://bgpalerter.readthedocs.io/
- **Issues:** https://github.com/nttgin/BGPalerter/issues

### Dashboard Support
- **Repository:** https://github.com/Onwave-NetEng/BGPalerter
- **Issues:** https://github.com/Onwave-NetEng/BGPalerter/issues
- **Email:** network-engineering@onwave.com

---

## 📄 License

- **BGPalerter Backend:** BSD-3-Clause License
- **BGPalerter Dashboard:** MIT License (or as specified)
- **Standalone Dashboard:** MIT License (or as specified)

---

## 👥 Authors

- **BGPalerter:** Massimo Candela and contributors
- **Comprehensive Dashboard:** Onwave Network Engineering Team
- **Standalone Dashboard:** Onwave Network Engineering Team

---

## 🙏 Acknowledgments

- **RIPE NCC** - For providing RIPE RIS Live data stream
- **BGPalerter Community** - For the excellent monitoring engine
- **Onwave Network Engineering** - For dashboard development and integration

---

**Version:** 3.4  
**Last Updated:** December 22, 2024  
**Status:** Production Ready
