# BGPalerter Dashboard - GitHub Repository Structure

This document provides a complete overview of the repository structure, file organization, and development guidelines for the BGPalerter Dashboard project.

## Repository Overview

**Repository Name**: `bgpalerter-dashboard`  
**Organization**: Onwave-NetEng  
**Full URL**: `https://github.com/Onwave-NetEng/bgpalerter-dashboard`  
**License**: MIT  
**Primary Language**: TypeScript

## Complete Directory Structure

```
bgpalerter-dashboard/
│
├── .github/                          # GitHub-specific configuration
│   ├── workflows/                    # GitHub Actions CI/CD
│   │   ├── ci.yml                   # Continuous integration
│   │   ├── deploy.yml               # Deployment workflow
│   │   └── test.yml                 # Automated testing
│   ├── ISSUE_TEMPLATE/              # Issue templates
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── config.yml
│   ├── PULL_REQUEST_TEMPLATE.md     # PR template
│   └── CODEOWNERS                   # Code ownership rules
│
├── client/                           # Frontend React application
│   ├── public/                      # Static assets
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── manifest.json
│   │
│   ├── src/                         # Source code
│   │   ├── _core/                   # Core framework files (do not modify)
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts      # Authentication hook
│   │   │   └── ...                 # Other core utilities
│   │   │
│   │   ├── components/              # React components
│   │   │   ├── dashboard/          # Dashboard-specific components
│   │   │   │   ├── StatusCard.tsx          # Reusable status card
│   │   │   │   ├── MonitorCard.tsx         # Monitor status card
│   │   │   │   ├── AlertsTable.tsx         # Alerts table component
│   │   │   │   └── FileEditor.tsx          # Monaco editor wrapper
│   │   │   │
│   │   │   ├── ui/                 # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   └── ...             # Other UI primitives
│   │   │   │
│   │   │   ├── ErrorBoundary.tsx   # Error boundary component
│   │   │   └── ...                 # Other shared components
│   │   │
│   │   ├── contexts/                # React contexts
│   │   │   └── ThemeContext.tsx    # Theme provider
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   └── ...                 # Custom hooks
│   │   │
│   │   ├── lib/                     # Utility libraries
│   │   │   ├── trpc.ts             # tRPC client setup
│   │   │   └── utils.ts            # Utility functions
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.tsx       # Main monitoring dashboard
│   │   │   ├── Administration.tsx  # Configuration management
│   │   │   ├── NotFound.tsx        # 404 page
│   │   │   └── Home.tsx            # Landing page (unused in MVP)
│   │   │
│   │   ├── App.tsx                  # Main app component with routing
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Global styles and theme
│   │   └── const.ts                 # Frontend constants
│   │
│   ├── index.html                   # HTML template
│   ├── tsconfig.json                # TypeScript config for client
│   ├── tsconfig.node.json           # TypeScript config for build tools
│   └── vite.config.ts               # Vite bundler configuration
│
├── server/                           # Backend Node.js application
│   ├── _core/                       # Core framework files (do not modify)
│   │   ├── context.ts              # tRPC context builder
│   │   ├── cookies.ts              # Cookie utilities
│   │   ├── env.ts                  # Environment variables
│   │   ├── index.ts                # Server entry point
│   │   ├── llm.ts                  # LLM integration
│   │   ├── notification.ts         # Owner notifications
│   │   ├── systemRouter.ts         # System tRPC router
│   │   ├── trpc.ts                 # tRPC setup
│   │   └── ...                     # Other core utilities
│   │
│   ├── services/                    # Business logic services
│   │   ├── bgpalerter.service.ts   # BGPalerter API integration
│   │   ├── github.service.ts       # Git automation service
│   │   ├── teams.service.ts        # Microsoft Teams integration
│   │   └── file.service.ts         # File management service
│   │
│   ├── db.ts                        # Database helpers and queries
│   ├── routers.ts                   # Main tRPC router
│   ├── storage.ts                   # S3 storage helpers
│   └── auth.logout.test.ts          # Example test file
│
├── drizzle/                          # Database schema and migrations
│   ├── schema.ts                    # Database schema definition
│   └── migrations/                  # Auto-generated migrations
│       └── ...                      # Migration files
│
├── shared/                           # Shared code between client/server
│   └── const.ts                     # Shared constants
│
├── patches/                          # pnpm patches for dependencies
│   └── wouter@3.7.1.patch          # Wouter router patch
│
├── scripts/                          # Utility scripts
│   ├── install.sh                   # Automated installation script
│   ├── setup-db.sh                  # Database setup script
│   └── deploy.sh                    # Deployment script
│
├── docs/                             # Additional documentation
│   ├── API.md                       # API documentation
│   ├── COMPONENTS.md                # Component usage guide
│   ├── CONTRIBUTING.md              # Contribution guidelines
│   └── CHANGELOG.md                 # Version changelog
│
├── .env.example                      # Example environment variables
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier configuration
├── package.json                      # Node.js dependencies and scripts
├── pnpm-lock.yaml                    # pnpm lockfile
├── tsconfig.json                     # Root TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── vitest.config.ts                  # Vitest test configuration
├── README.md                         # Main project documentation
├── DEPLOYMENT.md                     # Deployment guide
├── REPOSITORY_STRUCTURE.md           # This file
├── todo.md                           # Development task tracker
└── LICENSE                           # MIT License

```

## Key Files and Their Purpose

### Root Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js project metadata, dependencies, and scripts |
| `pnpm-lock.yaml` | Locked dependency versions for reproducible builds |
| `tsconfig.json` | Root TypeScript compiler configuration |
| `tailwind.config.ts` | Tailwind CSS theme and plugin configuration |
| `.env.example` | Template for environment variables |
| `.gitignore` | Files and directories to exclude from Git |
| `.prettierrc` | Code formatting rules |
| `vitest.config.ts` | Test runner configuration |

### Frontend (client/)

| File/Directory | Purpose |
|----------------|---------|
| `client/src/App.tsx` | Main application component with routing logic |
| `client/src/main.tsx` | React application entry point |
| `client/src/index.css` | Global styles, theme variables, and Tailwind directives |
| `client/src/components/dashboard/` | Reusable dashboard components |
| `client/src/pages/` | Page-level components |
| `client/src/lib/trpc.ts` | tRPC client configuration |
| `client/index.html` | HTML template with meta tags |

### Backend (server/)

| File/Directory | Purpose |
|----------------|---------|
| `server/routers.ts` | Main tRPC API router with all endpoints |
| `server/db.ts` | Database query helpers and utilities |
| `server/services/` | Business logic services (BGPalerter, GitHub, Teams, File) |
| `server/_core/index.ts` | Express server setup and middleware |
| `server/_core/trpc.ts` | tRPC server configuration |

### Database (drizzle/)

| File/Directory | Purpose |
|----------------|---------|
| `drizzle/schema.ts` | Database table definitions using Drizzle ORM |
| `drizzle/migrations/` | Auto-generated SQL migration files |

### Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview, features, and quick start |
| `DEPLOYMENT.md` | Step-by-step production deployment guide |
| `REPOSITORY_STRUCTURE.md` | This file - repository organization |
| `todo.md` | Development task tracker |

## GitHub Repository Setup

### 1. Create Repository

```bash
# On GitHub.com
# Navigate to https://github.com/organizations/Onwave-NetEng/repositories/new
# Repository name: bgpalerter-dashboard
# Description: Professional BGP monitoring dashboard for AS58173
# Visibility: Private (recommended) or Public
# Initialize: Do NOT add README, .gitignore, or license (we have them)
```

### 2. Initialize Local Repository

```bash
cd /home/ubuntu/bgpalerter-dashboard

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: BGPalerter Dashboard MVP

- Real-time BGP monitoring dashboard
- Configuration file management with Monaco editor
- GitHub integration for version control
- Microsoft Teams notifications
- Role-based access control
- Reusable React components
- Complete documentation"

# Add remote
git remote add origin https://github.com/Onwave-NetEng/bgpalerter-dashboard.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 3. Configure Repository Settings

On GitHub.com, navigate to repository settings:

#### General Settings
- **Description**: Professional BGP monitoring dashboard for AS58173
- **Website**: `https://bgpalerter.onwave.com` (your deployment URL)
- **Topics**: `bgp`, `monitoring`, `network-security`, `react`, `typescript`, `dashboard`

#### Branches
- **Default branch**: `main`
- **Branch protection rules** for `main`:
  - ✅ Require pull request reviews before merging
  - ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - ✅ Include administrators

#### Secrets and Variables
Add these secrets for GitHub Actions:

- `DATABASE_URL` - Production database connection string
- `BGPALERTER_API_URL` - BGPalerter REST API URL
- `GITHUB_TOKEN` - Personal access token for Git operations
- `TEAMS_WEBHOOK_URL` - Microsoft Teams webhook URL
- `DEPLOY_SSH_KEY` - SSH key for deployment server

## Git Workflow

### Branch Strategy

```
main (production)
  ├── develop (integration)
  │   ├── feature/as-path-visualization
  │   ├── feature/time-series-graphs
  │   └── feature/user-management
  └── hotfix/critical-bug-fix
```

### Commit Message Convention

Follow Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(dashboard): add AS path visualization with D3.js"
git commit -m "fix(api): resolve BGPalerter connection timeout issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "refactor(components): extract StatusCard to reusable component"
```

### Development Workflow

1. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request** on GitHub

5. **Review and merge** after CI passes

## GitHub Actions CI/CD

### Continuous Integration (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm check
      - run: pnpm test
      - run: pnpm build
```

### Deployment (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          # SSH into server and deploy
          # Implementation depends on your deployment strategy
```

## File Naming Conventions

### TypeScript/React Files
- **Components**: PascalCase (e.g., `StatusCard.tsx`, `AlertsTable.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`, `trpc.ts`)
- **Pages**: PascalCase (e.g., `Dashboard.tsx`, `Administration.tsx`)
- **Services**: camelCase with `.service.ts` suffix (e.g., `bgpalerter.service.ts`)

### Configuration Files
- **Environment**: `.env`, `.env.example`, `.env.production`
- **Config**: kebab-case (e.g., `tailwind.config.ts`, `vite.config.ts`)

### Documentation
- **Markdown**: UPPERCASE (e.g., `README.md`, `DEPLOYMENT.md`)

## Code Organization Best Practices

### Component Structure
```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
export function Component({ title, onAction }: ComponentProps) {
  // 4. Hooks
  const [state, setState] = useState(false);
  
  // 5. Event handlers
  const handleClick = () => {
    setState(true);
    onAction();
  };
  
  // 6. Render
  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={handleClick}>Action</Button>
    </div>
  );
}
```

### Service Structure
```typescript
// 1. Imports
import axios from "axios";

// 2. Types
interface ServiceResponse {
  success: boolean;
  data: any;
}

// 3. Service class or functions
export class ServiceName {
  constructor(private apiUrl: string) {}
  
  async fetchData(): Promise<ServiceResponse> {
    // Implementation
  }
}

// 4. Export
export const serviceInstance = new ServiceName(process.env.API_URL);
```

## Dependencies Management

### Adding Dependencies

```bash
# Production dependency
pnpm add package-name

# Development dependency
pnpm add -D package-name

# Update lockfile
pnpm install
```

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update all dependencies
pnpm update

# Update specific package
pnpm update package-name
```

## Testing Strategy

### Test File Naming
- Place tests next to the file being tested: `component.test.tsx`
- Or in `__tests__/` directory: `__tests__/component.test.tsx`

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

## Release Process

### Version Numbering
Follow Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Creating a Release

1. **Update version**:
   ```bash
   # Update package.json version
   pnpm version patch  # or minor, or major
   ```

2. **Update CHANGELOG.md**:
   ```markdown
   ## [1.1.0] - 2024-01-15
   ### Added
   - AS path visualization with D3.js
   - Time series graphs for BGP metrics
   
   ### Fixed
   - Connection timeout issues with BGPalerter API
   ```

3. **Create Git tag**:
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

4. **Create GitHub Release**:
   - Go to GitHub → Releases → Create new release
   - Select tag: `v1.1.0`
   - Title: `v1.1.0 - AS Path Visualization`
   - Description: Copy from CHANGELOG.md
   - Attach build artifacts if needed

## Maintenance

### Regular Tasks

**Weekly**:
- Review and merge pull requests
- Update dependencies: `pnpm update`
- Check GitHub Issues and respond

**Monthly**:
- Review and update documentation
- Security audit: `pnpm audit`
- Performance review

**Quarterly**:
- Major dependency updates
- Refactoring technical debt
- Feature planning

## Contributing

See `docs/CONTRIBUTING.md` for detailed contribution guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## Support and Resources

- **Issues**: https://github.com/Onwave-NetEng/bgpalerter-dashboard/issues
- **Discussions**: https://github.com/Onwave-NetEng/bgpalerter-dashboard/discussions
- **Wiki**: https://github.com/Onwave-NetEng/bgpalerter-dashboard/wiki
- **Email**: support@onwave.com

## License

This project is licensed under the MIT License - see the LICENSE file for details.
