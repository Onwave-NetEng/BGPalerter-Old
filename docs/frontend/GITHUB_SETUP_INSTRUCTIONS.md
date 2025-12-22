# GitHub Repository Setup Instructions

This guide walks you through creating the GitHub repository for the BGPalerter Dashboard and pushing the code.

## Prerequisites

- GitHub account with access to Onwave-NetEng organization
- GitHub CLI (`gh`) installed and authenticated
- Git configured with your name and email

## Step 1: Verify GitHub CLI Authentication

```bash
gh auth status
```

If not authenticated, run:

```bash
gh auth login
```

## Step 2: Create the Repository

From the dashboard project directory:

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Create the repository
gh repo create Onwave-NetEng/bgpalerter-dashboard \
  --public \
  --description "Professional BGP monitoring dashboard for BGPalerter with GitHub integration, Microsoft Teams notifications, and comprehensive configuration management" \
  --homepage "https://bgpalerter-dashboard.manus.space"
```

## Step 3: Initialize Git (if not already done)

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "feat: Initial release of BGPalerter Dashboard

- Real-time BGP monitoring with status cards
- Monitor status grid (Hijack, RPKI, Visibility, Path, New Prefix, ROA)
- Recent alerts table with severity indicators
- Monaco-based configuration editor
- Manual refresh functionality
- Role-based access control
- Dark theme with Onwave branding
- GitHub integration for version control
- Microsoft Teams notifications
- Comprehensive documentation
- Automated CI/CD workflows
- 21 passing tests"
```

## Step 4: Add Remote and Push

```bash
# Add GitHub remote
git remote add origin https://github.com/Onwave-NetEng/bgpalerter-dashboard.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 5: Configure Repository Settings

### Branch Protection

```bash
# Enable branch protection for main
gh api repos/Onwave-NetEng/bgpalerter-dashboard/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=test \
  --field enforce_admins=false \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field restrictions=null
```

Or configure via GitHub web interface:
1. Go to repository Settings → Branches
2. Add branch protection rule for `main`
3. Enable:
   - Require pull request reviews before merging
   - Require status checks to pass before merging
   - Require branches to be up to date before merging

### Repository Secrets

Add required secrets for GitHub Actions:

```bash
# Add BGPalerter API URL
gh secret set BGPALERTER_API_URL --body "http://your-bgpalerter-server:8011"

# Add GitHub token (for automated commits)
gh secret set GH_TOKEN --body "your-github-personal-access-token"

# Add Teams webhook URL
gh secret set TEAMS_WEBHOOK_URL --body "your-teams-webhook-url"

# Add database URL (for production deployment)
gh secret set DATABASE_URL --body "your-database-connection-string"
```

Or add via GitHub web interface:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with its value

## Step 6: Verify CI/CD Workflows

The repository includes GitHub Actions workflows in `.github/workflows/`:

- `ci.yml` - Runs tests on every push and pull request

Check workflow status:

```bash
gh run list --limit 5
```

View workflow details:

```bash
gh run view <run-id>
```

## Step 7: Create Initial Release

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production release

Features:
- Real-time BGP monitoring dashboard
- Configuration file management
- GitHub integration
- Teams notifications
- Role-based access control
- Comprehensive documentation
- Automated testing (21 tests passing)"

git push origin v1.0.0

# Create GitHub release
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Production Release" \
  --notes "See CHANGELOG.md for details" \
  --latest
```

## Step 8: Verify Repository Structure

Check that all files are present:

```bash
gh repo view Onwave-NetEng/bgpalerter-dashboard --web
```

Verify these key files exist:
- `README.md` - Project overview
- `DEPLOYMENT.md` - Deployment guide
- `REPOSITORY_STRUCTURE.md` - Repository organization
- `.github/workflows/ci.yml` - CI/CD workflow
- `package.json` - Dependencies
- `drizzle/schema.ts` - Database schema
- `server/routers.ts` - API routes
- `client/src/` - Frontend code

## Step 9: Clone to Production Server

On your production server:

```bash
# Clone the repository
gh repo clone Onwave-NetEng/bgpalerter-dashboard

# Navigate to directory
cd bgpalerter-dashboard

# Install dependencies
pnpm install

# Follow DEPLOYMENT.md for production setup
```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:

```bash
# Re-authenticate with GitHub
gh auth login

# Verify authentication
gh auth status
```

### Push Rejected

If push is rejected due to branch protection:

```bash
# Create a feature branch
git checkout -b feature/initial-setup

# Push feature branch
git push -u origin feature/initial-setup

# Create pull request
gh pr create --title "Initial dashboard setup" --body "Initial production-ready release"
```

### CI Workflow Fails

If the CI workflow fails:

```bash
# View workflow logs
gh run view --log

# Re-run failed workflow
gh run rerun <run-id>
```

## Next Steps

After repository creation:

1. **Update Documentation** - Add repository URL to all documentation
2. **Configure Webhooks** - Set up webhooks for Teams notifications
3. **Deploy to Production** - Follow DEPLOYMENT.md guide
4. **Team Access** - Add team members to repository
5. **Set Up Monitoring** - Configure repository insights and notifications

## Repository URLs

After setup, your repository will be available at:

- **Repository:** https://github.com/Onwave-NetEng/bgpalerter-dashboard
- **Issues:** https://github.com/Onwave-NetEng/bgpalerter-dashboard/issues
- **Actions:** https://github.com/Onwave-NetEng/bgpalerter-dashboard/actions
- **Releases:** https://github.com/Onwave-NetEng/bgpalerter-dashboard/releases

## Support

For issues with repository setup:
- Check GitHub CLI documentation: `gh help`
- View GitHub Actions logs: `gh run view --log`
- Consult REPOSITORY_STRUCTURE.md for repository organization
