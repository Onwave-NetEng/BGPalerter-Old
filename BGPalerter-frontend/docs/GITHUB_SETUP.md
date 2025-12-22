# GitHub Repository Setup Guide

This guide walks you through setting up the GitHub repository for the BGPalerter Dashboard.

## Prerequisites

- GitHub account with access to Onwave-NetEng organization
- GitHub CLI (`gh`) installed and authenticated
- Git configured with your credentials

## Step 1: Create GitHub Repository

You have two options:

### Option A: Using GitHub CLI (Recommended)

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Create repository in Onwave-NetEng organization
gh repo create Onwave-NetEng/bgpalerter-dashboard \
  --public \
  --description "BGP Monitoring Dashboard for AS58173" \
  --source=. \
  --remote=origin \
  --push
```

### Option B: Using GitHub Web Interface

1. Go to https://github.com/organizations/Onwave-NetEng/repositories/new
2. Repository name: `bgpalerter-dashboard`
3. Description: "BGP Monitoring Dashboard for AS58173"
4. Visibility: Public (or Private if preferred)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

Then connect your local repository:

```bash
cd /home/ubuntu/bgpalerter-dashboard
git remote add origin https://github.com/Onwave-NetEng/bgpalerter-dashboard.git
git branch -M main
git push -u origin main
```

## Step 2: Configure Repository Settings

### Branch Protection

1. Go to Settings → Branches
2. Add branch protection rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

### Secrets for GitHub Actions

1. Go to Settings → Secrets and variables → Actions
2. Add the following secrets:

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `BGPALERTER_API_URL` | BGPalerter REST API endpoint | `http://127.0.0.1:8011` |
| `BGPALERTER_CONFIG_PATH` | Path to BGPalerter config directory | `/home/ubuntu/BGPalerter/config` |
| `TEAMS_WEBHOOK_URL` | Microsoft Teams webhook (optional) | `https://outlook.office.com/webhook/...` |
| `DEPLOY_SSH_KEY` | SSH private key for deployment (optional) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

## Step 3: Set Up GitHub Actions Workflows

The repository already includes workflow files in `.github/workflows/`:

- `ci.yml` - Continuous Integration (runs tests on every push)
- `deploy.yml` - Automated deployment (runs on main branch)

These will automatically run when you push code to GitHub.

## Step 4: Configure GitHub Pages (Optional)

If you want to host documentation:

1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: `main` / `docs`
4. Click Save

## Step 5: Verify Setup

```bash
# Check remote configuration
git remote -v

# Should show:
# origin  https://github.com/Onwave-NetEng/bgpalerter-dashboard.git (fetch)
# origin  https://github.com/Onwave-NetEng/bgpalerter-dashboard.git (push)

# Check current branch
git branch

# Should show:
# * main

# View commit history
git log --oneline

# Push to GitHub
git push origin main
```

## Step 6: Create Initial Release

```bash
# Tag the initial release
git tag -a v1.0.0 -m "Initial release: BGPalerter Dashboard MVP"
git push origin v1.0.0

# Or using GitHub CLI
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Release" \
  --notes "BGPalerter Dashboard MVP with core monitoring features"
```

## Repository Structure

```
bgpalerter-dashboard/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── client/                 # Frontend React application
├── server/                 # Backend tRPC API
├── drizzle/               # Database schema
├── docs/                  # Documentation
├── README.md              # Project overview
├── DEPLOYMENT.md          # Deployment guide
├── REPOSITORY_STRUCTURE.md # This file
└── package.json           # Dependencies
```

## Git Workflow

### Development Workflow

1. Create feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create Pull Request on GitHub

5. After review and approval, merge to `main`

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add AS path visualization"
git commit -m "fix: resolve BGPalerter API connection timeout"
git commit -m "docs: update deployment guide"
```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

```bash
# Using GitHub CLI
gh auth login

# Or configure Git credentials
git config --global user.name "Your Name"
git config --global user.email "your.email@onwave.com"

# Use personal access token
git remote set-url origin https://YOUR_TOKEN@github.com/Onwave-NetEng/bgpalerter-dashboard.git
```

### Push Rejected

If your push is rejected:

```bash
# Pull latest changes
git pull origin main --rebase

# Resolve any conflicts, then
git push origin main
```

## Next Steps

1. ✅ Repository created and configured
2. ✅ Branch protection enabled
3. ✅ GitHub Actions workflows active
4. ⏭️ Deploy dashboard to production
5. ⏭️ Set up monitoring and alerts
6. ⏭️ Configure Teams notifications

## Additional Resources

- [GitHub Documentation](https://docs.github.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Workflow Guide](https://www.atlassian.com/git/tutorials/comparing-workflows)
