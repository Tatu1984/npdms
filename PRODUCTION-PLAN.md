# NPDMS Production Readiness Plan

**Current Status**: 65% Production Ready
**Target**: 95% Production Ready
**Timeline**: 6-8 weeks
**Start Date**: 2026-01-05

---

## 🎯 OBJECTIVES

Transform NPDMS from demo-ready to production-ready by addressing:
1. **Testing Infrastructure** (15% → 80%)
2. **Security Hardening** (70% → 95%)
3. **Feature Completion** (82% → 95%)
4. **DevOps Automation** (0% → 80%)

---

## 📋 PHASE 1: CRITICAL FOUNDATION (Weeks 1-2)

### Priority: 🔴 CRITICAL - Blocks Production

#### 1.1 Backend Testing Infrastructure
**Goal**: Achieve 80% test coverage
**Effort**: 5 days

- [ ] Set up testing framework (testify/suite)
- [ ] Create test database setup/teardown
- [ ] Write repository tests (sqlmock)
- [ ] Write service layer tests
- [ ] Write handler tests (httptest)
- [ ] Set up test coverage reporting

**Files to Create**:
```
services/api/
├── internal/
│   ├── handlers/
│   │   ├── fir_handler_test.go
│   │   ├── case_handler_test.go
│   │   └── ... (11 more)
│   ├── services/
│   │   ├── fir_service_test.go
│   │   └── ... (11 more)
│   └── repository/
│       ├── fir_repository_test.go
│       └── ... (11 more)
├── testutil/
│   ├── db.go
│   ├── fixtures.go
│   └── assertions.go
└── Makefile (test commands)
```

**Acceptance Criteria**:
- ✅ 80%+ code coverage on backend
- ✅ All critical paths tested
- ✅ Mock database tests passing
- ✅ Integration tests with real DB

#### 1.2 Frontend Testing Infrastructure
**Goal**: Achieve 70% test coverage
**Effort**: 4 days

- [ ] Set up Vitest + React Testing Library
- [ ] Configure test environment
- [ ] Write component tests
- [ ] Write hook tests
- [ ] Write utility tests
- [ ] Set up coverage reporting

**Files to Create**:
```
ui/web/
├── vitest.config.ts
├── src/
│   ├── components/
│   │   └── __tests__/
│   │       ├── Card.test.tsx
│   │       └── ... (20+ components)
│   ├── hooks/
│   │   └── __tests__/
│   │       ├── use-firs.test.ts
│   │       └── ... (5 hooks)
│   └── lib/
│       └── __tests__/
│           ├── db/schema.test.ts
│           └── sync/queue-manager.test.ts
└── package.json (add test scripts)
```

**Acceptance Criteria**:
- ✅ 70%+ code coverage on frontend
- ✅ All hooks tested
- ✅ Critical components tested
- ✅ Offline queue tests passing

#### 1.3 E2E Testing
**Goal**: Cover critical user flows
**Effort**: 3 days

- [ ] Set up Playwright
- [ ] Write auth flow tests
- [ ] Write FIR creation flow
- [ ] Write offline sync flow
- [ ] Write case management flow
- [ ] Set up CI integration

**Files to Create**:
```
e2e/
├── playwright.config.ts
├── fixtures/
│   └── test-data.ts
└── tests/
    ├── auth.spec.ts
    ├── fir-workflow.spec.ts
    ├── offline-sync.spec.ts
    └── case-management.spec.ts
```

**Acceptance Criteria**:
- ✅ 8+ critical flows tested
- ✅ Tests run in CI
- ✅ Screenshot/video on failure
- ✅ Parallel execution

---

## 🔒 PHASE 2: SECURITY HARDENING (Week 3)

### Priority: 🔴 CRITICAL - Security Risk

#### 2.1 Rate Limiting
**Effort**: 1 day

- [ ] Implement rate limiting middleware (Go)
- [ ] Add Redis-based rate limiter
- [ ] Configure per-endpoint limits
- [ ] Add rate limit headers
- [ ] Test with load testing

**Files to Modify/Create**:
```
services/api/
├── internal/
│   └── middleware/
│       └── rate_limiter.go
└── main.go (register middleware)
```

**Configuration**:
```
Global: 100 req/min per IP
Auth: 5 req/min per IP
Sensitive: 10 req/min per user
```

#### 2.2 CSRF Protection
**Effort**: 1 day

- [ ] Implement CSRF token generation
- [ ] Add CSRF middleware
- [ ] Update frontend to send tokens
- [ ] Add token validation
- [ ] Test CSRF protection

**Files to Create**:
```
services/api/
├── internal/
│   └── middleware/
│       └── csrf.go
ui/web/
└── src/
    └── lib/
        └── csrf.ts
```

#### 2.3 SSL/TLS Configuration
**Effort**: 1 day

- [ ] Generate self-signed certs (dev)
- [ ] Configure HTTPS in Go API
- [ ] Update docker-compose for TLS
- [ ] Add TLS termination (production)
- [ ] Force HTTPS redirect
- [ ] Update CORS for HTTPS

**Files to Create**:
```
certs/
├── generate-certs.sh
├── server.crt
└── server.key
docker-compose.prod.yml
```

#### 2.4 Input Validation Enhancement
**Effort**: 2 days

- [ ] Add comprehensive validation rules
- [ ] Implement sanitization
- [ ] Add length limits
- [ ] Validate file uploads
- [ ] Add XSS protection headers
- [ ] Test injection attacks

**Files to Modify**:
```
services/api/
└── internal/
    └── models/
        └── validators.go (enhance)
```

#### 2.5 Secrets Management
**Effort**: 1 day

- [ ] Integrate with vault/secrets manager
- [ ] Remove hardcoded secrets
- [ ] Add secret rotation
- [ ] Document secret management
- [ ] Update deployment scripts

**Files to Create**:
```
scripts/
├── rotate-secrets.sh
└── setup-vault.sh
.env.example (updated)
```

---

## 🚀 PHASE 3: FEATURE COMPLETION (Week 4)

### Priority: 🟡 HIGH - Improves Functionality

#### 3.1 Complete React Query Hooks (9 remaining)
**Effort**: 3 days

- [ ] use-bail.ts
- [ ] use-forensics.ts
- [ ] use-personnel.ts
- [ ] use-vehicles.ts
- [ ] use-court-hearings.ts
- [ ] use-court-orders.ts
- [ ] use-accused.ts
- [ ] use-witnesses.ts
- [ ] use-audit.ts

**Pattern** (30 min each):
```typescript
export function useBail(filters: BailFilters = {}) {
  const isOnline = networkMonitor.isOnline();
  return useQuery({
    queryKey: bailKeys.list(filters),
    queryFn: async () => {
      if (isOnline) {
        const response = await bailApi.list(filters);
        await Promise.all(response.data.map(item =>
          db.bail.put({ ...item, _pending: false })
        ));
        return response;
      }
      // Offline: fetch from IndexedDB
      const results = await db.bail.toArray();
      // Apply filters...
      return { data: results, total: results.length };
    },
  });
}
```

#### 3.2 Full-Text Search Implementation
**Effort**: 2 days

- [ ] Add tsvector columns to tables
- [ ] Create search indexes
- [ ] Implement search handler
- [ ] Add search API endpoint
- [ ] Update frontend with search UI
- [ ] Test search functionality

**Files to Create**:
```
services/api/
├── migrations/
│   └── 000014_add_fulltext_search.up.sql
├── internal/
│   ├── handlers/
│   │   └── search_handler.go
│   └── repository/
│       └── search_repository.go
ui/web/
└── src/
    └── app/
        └── search/
            └── page.tsx (enhanced)
```

**SQL Migration**:
```sql
ALTER TABLE firs ADD COLUMN search_vector tsvector;
CREATE INDEX firs_search_idx ON firs USING GIN(search_vector);
CREATE TRIGGER firs_search_update BEFORE INSERT OR UPDATE ON firs
  FOR EACH ROW EXECUTE FUNCTION tsvector_update_trigger(
    search_vector, 'pg_catalog.english', title, description
  );
```

#### 3.3 File Upload Integration
**Effort**: 2 days

- [ ] Complete MinIO integration
- [ ] Add file upload handler
- [ ] Implement file validation
- [ ] Add virus scanning (ClamAV)
- [ ] Create upload progress UI
- [ ] Test large file uploads

**Files to Create**:
```
services/api/
└── internal/
    ├── handlers/
    │   └── upload_handler.go
    └── services/
        └── storage_service.go
ui/web/
└── src/
    └── components/
        └── FileUpload.tsx
```

---

## 🤖 PHASE 4: ML/AI ENHANCEMENT (Week 5)

### Priority: 🟡 MEDIUM - Improves Intelligence

#### 4.1 Fine-tune FIR Classifier
**Effort**: 3 days

- [ ] Collect/label training data (500+ examples)
- [ ] Fine-tune DistilBERT model
- [ ] Evaluate model performance (F1 > 0.85)
- [ ] Deploy trained model
- [ ] Replace rule-based logic
- [ ] Monitor accuracy

**Files to Create**:
```
services/ml/fir_classifier/
├── train.py
├── evaluate.py
├── data/
│   └── training_data.csv
└── models/
    └── fir_classifier_v1.bin
```

#### 4.2 Integrate Prophet for Crime Prediction
**Effort**: 2 days

- [ ] Prepare time-series data
- [ ] Train Prophet model
- [ ] Add seasonality components
- [ ] Create prediction endpoint
- [ ] Update analytics dashboard
- [ ] Test predictions

**Files to Modify**:
```
services/ml/crime_prediction/
├── app.py (replace statistical with Prophet)
└── requirements.txt (add prophet)
```

#### 4.3 ML Training Pipeline
**Effort**: 2 days

- [ ] Create training orchestration
- [ ] Add model versioning (MLflow)
- [ ] Set up experiment tracking
- [ ] Automate retraining
- [ ] Add model registry
- [ ] Document training process

**Files to Create**:
```
services/ml/
├── training/
│   ├── orchestrator.py
│   ├── mlflow_setup.py
│   └── retrain.sh
└── docker-compose.training.yml
```

---

## 🔧 PHASE 5: DEVOPS AUTOMATION (Week 6)

### Priority: 🟡 HIGH - Operational Excellence

#### 5.1 CI/CD Pipeline
**Effort**: 2 days

- [ ] Set up GitHub Actions
- [ ] Add backend tests job
- [ ] Add frontend tests job
- [ ] Add E2E tests job
- [ ] Add build job
- [ ] Add deployment job
- [ ] Configure staging environment

**Files to Create**:
```
.github/
└── workflows/
    ├── backend-tests.yml
    ├── frontend-tests.yml
    ├── e2e-tests.yml
    └── deploy.yml
```

**Pipeline Stages**:
```
1. Lint → 2. Unit Tests → 3. Integration Tests → 4. Build → 5. E2E Tests → 6. Deploy
```

#### 5.2 Load Testing
**Effort**: 1 day

- [ ] Set up k6 load testing
- [ ] Create load test scenarios
- [ ] Test API endpoints (target: 1000 req/sec)
- [ ] Identify bottlenecks
- [ ] Optimize performance
- [ ] Document results

**Files to Create**:
```
load-tests/
├── scripts/
│   ├── fir-creation.js
│   ├── search.js
│   └── auth.js
└── results/
    └── baseline.json
```

#### 5.3 Database Backup/Restore
**Effort**: 1 day

- [ ] Automate PostgreSQL backups
- [ ] Set up backup retention
- [ ] Create restore procedures
- [ ] Test backup/restore
- [ ] Document procedures
- [ ] Add monitoring for backups

**Files to Create**:
```
scripts/
├── backup-db.sh
├── restore-db.sh
└── backup-cron.sh
```

#### 5.4 Monitoring Enhancements
**Effort**: 1 day

- [ ] Add application metrics
- [ ] Create SLO dashboards
- [ ] Set up alerting rules
- [ ] Add log aggregation (Loki)
- [ ] Configure on-call rotation
- [ ] Document runbooks

**Files to Create**:
```
monitoring/
├── alerts/
│   ├── slo-alerts.yml
│   └── infrastructure-alerts.yml
└── runbooks/
    ├── high-latency.md
    └── database-failure.md
```

---

## 📚 PHASE 6: DOCUMENTATION & POLISH (Week 7)

### Priority: 🟢 MEDIUM - User Experience

#### 6.1 API Documentation
**Effort**: 2 days

- [ ] Generate OpenAPI/Swagger spec
- [ ] Add endpoint examples
- [ ] Document authentication
- [ ] Add error codes guide
- [ ] Create Postman collection
- [ ] Host API docs

**Files to Create**:
```
docs/
├── api/
│   ├── openapi.yaml
│   └── postman-collection.json
└── swagger-ui/
```

#### 6.2 User Manual
**Effort**: 2 days

- [ ] Write user guide
- [ ] Create screenshots
- [ ] Document workflows
- [ ] Add troubleshooting guide
- [ ] Create video tutorials
- [ ] Publish documentation site

**Files to Create**:
```
docs/
├── user-manual/
│   ├── getting-started.md
│   ├── fir-management.md
│   ├── case-management.md
│   └── troubleshooting.md
└── videos/
```

#### 6.3 Deployment Documentation
**Effort**: 1 day

- [ ] Update DEPLOYMENT.md
- [ ] Add production checklist
- [ ] Document scaling procedures
- [ ] Add disaster recovery plan
- [ ] Create architecture diagrams
- [ ] Document security policies

---

## 🚢 PHASE 7: PRODUCTION DEPLOYMENT (Week 8)

### Priority: 🔴 CRITICAL - Go Live

#### 7.1 Production Environment Setup
**Effort**: 2 days

- [ ] Provision servers/cloud infrastructure
- [ ] Configure load balancer
- [ ] Set up SSL certificates
- [ ] Configure DNS
- [ ] Set up CDN
- [ ] Configure firewall rules

#### 7.2 Security Audit
**Effort**: 1 day

- [ ] Run OWASP ZAP scan
- [ ] Penetration testing
- [ ] Dependency vulnerability scan
- [ ] Fix critical issues
- [ ] Document findings
- [ ] Get security sign-off

#### 7.3 Performance Optimization
**Effort**: 2 days

- [ ] Database query optimization
- [ ] Add caching layers
- [ ] Optimize frontend bundle
- [ ] Enable compression
- [ ] Configure CDN
- [ ] Load test production

#### 7.4 Go-Live Checklist
**Effort**: 1 day

- [ ] Final data migration
- [ ] DNS cutover
- [ ] Smoke tests
- [ ] Monitor error rates
- [ ] User acceptance testing
- [ ] Sign-off from stakeholders

---

## 📊 PROGRESS TRACKING

### Week 1: Testing Foundation
- [ ] Backend testing (80% coverage)
- [ ] Frontend testing (70% coverage)
- [ ] E2E testing setup

**Target**: Testing 15% → 80%

### Week 2: Testing Completion
- [ ] Complete all tests
- [ ] Set up CI for tests
- [ ] Fix failing tests

**Target**: Testing 80% ✅

### Week 3: Security Hardening
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] SSL/TLS
- [ ] Input validation
- [ ] Secrets management

**Target**: Security 70% → 95%

### Week 4: Feature Completion
- [ ] Complete React Query hooks
- [ ] Full-text search
- [ ] File upload integration

**Target**: Frontend 82% → 95%

### Week 5: ML Enhancement
- [ ] Fine-tune FIR classifier
- [ ] Integrate Prophet
- [ ] ML training pipeline

**Target**: ML 75% → 90%

### Week 6: DevOps
- [ ] CI/CD pipeline
- [ ] Load testing
- [ ] Backup/restore
- [ ] Monitoring enhancements

**Target**: DevOps 0% → 80%

### Week 7: Documentation
- [ ] API documentation
- [ ] User manual
- [ ] Deployment docs

**Target**: Documentation 95% → 100%

### Week 8: Production
- [ ] Production setup
- [ ] Security audit
- [ ] Performance optimization
- [ ] Go-live

**Target**: Production Ready 95% ✅

---

## 🎯 SUCCESS METRICS

### Technical KPIs
- [ ] **Test Coverage**: Backend 80%, Frontend 70%
- [ ] **API Performance**: p95 < 500ms
- [ ] **Uptime**: 99.9% SLA
- [ ] **Security Score**: A rating on security audit
- [ ] **Load Capacity**: 1000 concurrent users
- [ ] **ML Accuracy**: FIR classification F1 > 0.85

### Operational KPIs
- [ ] **CI/CD**: < 10 min pipeline
- [ ] **Deployment**: < 5 min downtime
- [ ] **Recovery**: RTO < 1 hour, RPO < 15 min
- [ ] **Monitoring**: < 5 min alert response

---

## 🚨 RISKS & MITIGATION

### Risk 1: Testing Delays
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Start with most critical tests
- Parallelize frontend/backend testing
- Use AI-assisted test generation

### Risk 2: Security Vulnerabilities
**Probability**: Medium
**Impact**: Critical
**Mitigation**:
- Security review at each phase
- Automated vulnerability scanning
- Third-party penetration testing

### Risk 3: Performance Issues
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Early load testing
- Database query optimization
- CDN and caching

### Risk 4: ML Model Accuracy
**Probability**: High
**Impact**: Medium
**Mitigation**:
- Collect sufficient training data
- Start with transfer learning
- Keep rule-based fallback

---

## 📅 TIMELINE SUMMARY

```
Week 1: [████████░░] Testing Infrastructure
Week 2: [████████░░] Testing Completion
Week 3: [████████░░] Security Hardening
Week 4: [████████░░] Feature Completion
Week 5: [████████░░] ML Enhancement
Week 6: [████████░░] DevOps Automation
Week 7: [████████░░] Documentation
Week 8: [████████░░] Production Deployment

Total: 8 weeks to 95% production ready
```

---

## 🎉 COMPLETION CRITERIA

### Definition of Done
- [ ] All tests passing (80%+ coverage)
- [ ] Security audit passed (A rating)
- [ ] Load tests passed (1000 req/sec)
- [ ] All critical features complete
- [ ] Documentation published
- [ ] Production environment ready
- [ ] Monitoring operational
- [ ] Backup/restore tested
- [ ] Stakeholder sign-off

### Production Ready Checklist
- [ ] ✅ 95%+ overall completion
- [ ] ✅ All critical gaps closed
- [ ] ✅ Security hardened
- [ ] ✅ Performance optimized
- [ ] ✅ Fully tested
- [ ] ✅ Monitored 24/7
- [ ] ✅ Documented thoroughly
- [ ] ✅ Team trained

---

**Plan Created**: 2026-01-05
**Target Completion**: 2026-03-02 (8 weeks)
**Owner**: Development Team
**Reviewed**: Pending
