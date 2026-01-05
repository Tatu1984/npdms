# NPDMS - Phase-wise Implementation Plan

## Project Overview
National Police Department Management System - A comprehensive digital platform for police station management including FIR registration, case tracking, evidence management, personnel management, and AI-powered analytics.

---

## PHASE 1: Foundation & Demo Ready (Current - 1 week)

### 1.1 Frontend Completion (2 days)
- [x] Create Zustand stores for all modules
- [x] Add export functionality (CSV)
- [x] Add delete functionality with confirmations
- [x] Connect FIR, Cases, Evidence pages to stores
- [ ] Connect Personnel, Vehicles, Alerts, Armoury pages
- [ ] Make Edit buttons functional (forms with validation)
- [ ] Add form validation using Zod

### 1.2 Authentication Setup (1 day)
- [ ] Configure NextAuth.js with credentials provider
- [ ] Add Microsoft Entra ID integration
- [ ] Implement role-based access control (RBAC)
- [ ] Add session management

### 1.3 Deployment (1 day)
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domain (npdms.infinititechpartners.com)
- [ ] Set up environment variables
- [ ] SSL certificate (auto by Vercel)

### 1.4 Demo Data & Polish (1 day)
- [ ] Add comprehensive mock data
- [ ] Add loading states and skeletons
- [ ] Error boundaries and error pages
- [ ] Mobile responsiveness fixes

**Deliverables:**
- Working demo at https://npdms.infinititechpartners.com
- All CRUD operations functional (with mock data)
- Microsoft Entra ID login
- Export functionality

---

## PHASE 2: Backend & Database Integration (2 weeks)

### 2.1 Database Setup (2 days)
- [ ] Run schema migrations on NeonDB
- [ ] Create indexes for performance
- [ ] Set up connection pooling
- [ ] Add seed data for testing

```sql
-- Run on NeonDB
\i services/db/init/001_schema.sql
```

### 2.2 Go API Deployment (3 days)
- [ ] Containerize API with Docker
- [ ] Deploy to Railway/Render/Fly.io
- [ ] Set up health checks
- [ ] Configure CORS for frontend
- [ ] Set up Redis (Upstash)

### 2.3 API Integration (3 days)
- [ ] Create API client in frontend
- [ ] Replace mock data with real API calls
- [ ] Implement error handling
- [ ] Add retry logic and caching
- [ ] Real-time sync with WebSockets (optional)

### 2.4 File Storage (2 days)
- [ ] Set up Cloudflare R2 or Vercel Blob
- [ ] Implement evidence file upload
- [ ] Add file preview functionality
- [ ] Implement secure file access

**Deliverables:**
- Fully functional API
- Database with real data
- File upload for evidence
- Frontend connected to real API

---

## PHASE 3: Microsoft Entra ID & SSO (1 week)

### 3.1 Azure AD Configuration (2 days)
```typescript
// next-auth configuration
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.role = profile?.role || "CONSTABLE";
      }
      return token;
    },
  },
};
```

### 3.2 Role Mapping (2 days)
- [ ] Map Azure AD groups to NPDMS roles
- [ ] Implement group-based access control
- [ ] Sync user profiles from Azure AD
- [ ] Handle role changes dynamically

### 3.3 Security Hardening (1 day)
- [ ] Implement PKCE flow
- [ ] Add token refresh logic
- [ ] Session timeout handling
- [ ] Audit login attempts

**Deliverables:**
- Microsoft Entra ID SSO working
- Role-based access from Azure AD groups
- Secure session management

---

## PHASE 4: AI Integration (2 weeks)

### 4.1 AI Infrastructure Setup (2 days)
```typescript
// AI service configuration
const aiConfig = {
  provider: "azure-openai", // or "openai"
  models: {
    text: "gpt-4",
    embedding: "text-embedding-3-small",
    vision: "gpt-4-vision-preview",
  },
};
```

### 4.2 FIR Auto-Fill (3 days)
- [ ] Voice-to-text for FIR dictation
- [ ] Auto-suggest IPC sections from description
- [ ] Auto-fill location from GPS
- [ ] Smart complainant form filling

### 4.3 Case Analytics (3 days)
- [ ] Crime pattern detection
- [ ] Case similarity matching
- [ ] Predictive case timeline
- [ ] Accused behavior analysis

### 4.4 Evidence Analysis (2 days)
- [ ] Document OCR and extraction
- [ ] Image/video analysis
- [ ] Evidence integrity verification
- [ ] Chain of custody automation

### 4.5 Intelligent Search (2 days)
- [ ] Semantic search across FIRs
- [ ] Natural language queries
- [ ] Cross-reference detection
- [ ] Similar case recommendations

**Deliverables:**
- AI-powered FIR creation
- Smart case analytics dashboard
- Intelligent search functionality
- Evidence analysis features

---

## PHASE 5: DevSecOps Implementation (2 weeks)

### 5.1 CI/CD Pipeline (3 days)
```yaml
# .github/workflows/main.yml
name: NPDMS CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 5.2 Security Scanning (2 days)
- [ ] SAST with Snyk/SonarQube
- [ ] DAST with OWASP ZAP
- [ ] Dependency vulnerability scanning
- [ ] Container image scanning
- [ ] Secret detection with GitLeaks

### 5.3 Monitoring & Observability (3 days)
- [ ] Error tracking with Sentry
- [ ] APM with New Relic/Datadog
- [ ] Log aggregation
- [ ] Custom dashboards
- [ ] Alerting rules

### 5.4 Compliance & Audit (2 days)
- [ ] Audit logging for all actions
- [ ] Data encryption at rest
- [ ] GDPR/data privacy compliance
- [ ] Access control audit trails
- [ ] Backup and recovery testing

### 5.5 Infrastructure as Code (2 days)
```hcl
# terraform/main.tf
terraform {
  required_providers {
    vercel = {
      source = "vercel/vercel"
    }
    neon = {
      source = "kislerdm/neon"
    }
  }
}

resource "vercel_project" "npdms" {
  name      = "npdms"
  framework = "nextjs"
}

resource "neon_project" "npdms_db" {
  name = "npdms-production"
}
```

**Deliverables:**
- Automated CI/CD pipeline
- Security scanning in pipeline
- Monitoring and alerting
- Compliance documentation
- IaC for infrastructure

---

## PHASE 6: Advanced Features (3 weeks)

### 6.1 GIS Integration (4 days)
- [ ] Crime mapping with Mapbox/Google Maps
- [ ] Beat patrol tracking
- [ ] Hotspot visualization
- [ ] Geofencing for sensitive areas

### 6.2 Mobile App (5 days)
- [ ] React Native or PWA
- [ ] Offline-first architecture
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Camera integration for evidence

### 6.3 Reporting & Analytics (3 days)
- [ ] Custom report builder
- [ ] Scheduled reports
- [ ] Export to PDF/Excel
- [ ] Dashboard widgets

### 6.4 Integration Hub (3 days)
- [ ] Court system integration
- [ ] Forensic lab API
- [ ] CCTNS integration
- [ ] Aadhaar verification
- [ ] Vehicle database (VAHAN)

**Deliverables:**
- Interactive crime maps
- Mobile application
- Advanced reporting
- External system integrations

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Foundation | 1 week | In Progress |
| Phase 2: Backend Integration | 2 weeks | Pending |
| Phase 3: Entra ID & SSO | 1 week | Pending |
| Phase 4: AI Integration | 2 weeks | Pending |
| Phase 5: DevSecOps | 2 weeks | Pending |
| Phase 6: Advanced Features | 3 weeks | Pending |

**Total Estimated Time: 11 weeks (2.5 months)**

---

## Technology Stack Summary

```
Frontend:        Next.js 16, React 19, TypeScript, Tailwind CSS
State:           Zustand with localStorage persistence
Auth:            NextAuth.js + Microsoft Entra ID
Backend:         Go (Gin framework)
Database:        PostgreSQL (NeonDB)
Cache:           Redis (Upstash)
Storage:         Cloudflare R2 / Vercel Blob
AI:              Azure OpenAI / OpenAI API
Hosting:         Vercel (Frontend), Railway (Backend)
CI/CD:           GitHub Actions
Security:        Snyk, OWASP ZAP, GitLeaks
Monitoring:      Sentry, Vercel Analytics
IaC:             Terraform
```

---

## Budget Estimate (Monthly)

| Service | Free Tier | Production |
|---------|-----------|------------|
| Vercel | $0 | $20 |
| NeonDB | $0 | $19 |
| Upstash Redis | $0 | $10 |
| Railway (API) | $5 | $20 |
| Cloudflare R2 | $0 | $5 |
| Azure OpenAI | $0 | $50-200 |
| Sentry | $0 | $26 |
| **Total** | **~$5** | **~$150-350** |

---

## Next Steps (Immediate)

1. **Today**: Deploy current build to Vercel
2. **This Week**: Complete remaining frontend pages
3. **Next Week**: Set up Microsoft Entra ID
4. **Week 3**: Deploy Go API and connect to NeonDB
