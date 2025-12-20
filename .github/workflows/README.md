# GitHub Actions Workflows

This directory contains automated workflows for the IPO GMP Analyzer project.

## 🔄 Workflows Overview

### 1. CI/CD Pipeline (`ci.yml`)
**Triggers:** Push to main/production/develop, Pull Requests
- **Frontend CI**: Tests Node.js 18.x & 20.x, ESLint, TypeScript, Build
- **Backend CI**: Tests Python 3.8-3.11, Import validation
- **Security Scan**: npm audit, Snyk security scanning
- **Performance**: Lighthouse CI for performance testing

### 2. Vercel Deployment (`deploy-vercel.yml`)
**Triggers:** Push to production branch, Manual dispatch
- Deploys to Vercel production environment
- Pulls environment configuration
- Comments deployment URL on PRs

### 3. Netlify Deployment (`deploy-netlify.yml`)
**Triggers:** Push to main branch, Manual dispatch
- Deploys to Netlify
- Builds static export for Netlify hosting
- Enables PR preview deployments

### 4. Release Management (`release.yml`)
**Triggers:** Git tags (v*)
- Creates GitHub releases with changelogs
- Builds production archives
- Updates package versions automatically

### 5. Security Analysis (`codeql.yml`)
**Triggers:** Push, PR, Weekly schedule
- CodeQL security analysis for JavaScript & Python
- Scans for security vulnerabilities
- Runs extended security queries

### 6. Dependency Review (`dependency-review.yml`)
**Triggers:** Pull Requests
- Reviews new dependencies for security issues
- Checks license compatibility
- Fails on moderate+ severity vulnerabilities

## 🔧 Required Secrets

Add these secrets in your GitHub repository settings:

### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
```

### Netlify Deployment
```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
```

### Backend Configuration
```
BACKEND_URL=https://your-backend-url.com
NEXT_PUBLIC_API_URL=https://your-api-url.com
```

### Security Scanning (Optional)
```
SNYK_TOKEN=your_snyk_token
```

## 🚀 Deployment Process

### Production Deployment (Vercel)
1. Push to `production` branch
2. CI pipeline runs automatically
3. If tests pass, deploys to Vercel
4. Deployment URL posted as comment

### Staging Deployment (Netlify)
1. Push to `main` branch
2. CI pipeline runs automatically
3. If tests pass, deploys to Netlify
4. Preview deployments for PRs

### Release Process
1. Create and push a git tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Release workflow creates GitHub release
3. Builds production artifacts
4. Updates version numbers

## 📊 Status Badges

Add these to your README.md:

```markdown
![CI/CD](https://github.com/Gowthamhegde/ipo/workflows/CI/CD%20Pipeline/badge.svg)
![Security](https://github.com/Gowthamhegde/ipo/workflows/CodeQL%20Security%20Analysis/badge.svg)
![Vercel](https://github.com/Gowthamhegde/ipo/workflows/Deploy%20to%20Vercel/badge.svg)
```

## 🔍 Monitoring

- **Build Status**: Check Actions tab for build results
- **Security Alerts**: Security tab for vulnerability reports
- **Performance**: Lighthouse CI reports in PR comments
- **Dependencies**: Dependabot PRs for updates

## 🛠 Customization

### Adding New Environments
1. Create new workflow file in `.github/workflows/`
2. Add required secrets in repository settings
3. Configure deployment steps for your platform

### Modifying CI Steps
1. Edit `ci.yml` workflow
2. Add/remove test steps as needed
3. Update Node.js/Python versions in matrix

### Custom Security Rules
1. Modify `codeql.yml` queries
2. Update `dependency-review.yml` severity levels
3. Add custom security scanning tools

## 📝 Best Practices

1. **Branch Protection**: Enable branch protection rules for main/production
2. **Required Checks**: Make CI workflows required for merging
3. **Environment Secrets**: Use environment-specific secrets
4. **Monitoring**: Set up notifications for failed workflows
5. **Regular Updates**: Keep workflow actions updated via Dependabot