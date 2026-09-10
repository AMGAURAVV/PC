# Deployment Architecture & CI/CD Infrastructure — PC Platform

> **Status:** Production-Ready | **Version:** 1.0.0 | **Author:** Platform & DevOps Engineering

---

## 1. Executive Summary

This document specifies the enterprise CI/CD architecture and deployment topology for the **PC Platform** monorepo. The automation infrastructure is implemented using **GitHub Actions**, enforcing a strict 7-stage Continuous Integration (CI) pipeline, segregated application deployment workflows (`web`, `admin`, `api`), multi-tier environment isolation (`development`, `staging`, `production`), zero-secret exposure policies, and manual approval gates for production releases.

```
                   ┌──────────────────────────────────────────────┐
                   │               Developer Action               │
                   │    (Pull Request / Push to develop or main)   │
                   └──────────────────────┬───────────────────────┘
                                          │
                                          ▼
     ┌────────────────────────────────────────────────────────────────────────┐
     │                      7-STAGE CI PIPELINE (.github/workflows/ci.yml)     │
     │                                                                        │
     │  1. lint          ──► ESLint & Prettier code style checks              │
     │  2. typecheck     ──► Strict tsc --noEmit across all monorepo pkgs     │
     │  3. unit-tests    ──► Engine, validation, service & API unit tests     │
     │  4. integration   ──► PostgreSQL container + API endpoint testing      │
     │  5. build         ──► Types, validation, web, admin, and api builds    │
     │  6. e2e-tests     ──► Playwright browser automation (mocked payment)   │
     │  7. security      ──► pnpm audit, TruffleHog secret scan, token checks │
     └────────────────────────────────────┬───────────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
         [ Branch: develop ]                              [ Branch: main ]
                  │                                               │
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │  Deploy: development   │                      │    Deploy: staging     │
     │  (Automatic via CD)    │                      │  (Automatic via CD)    │
     └────────────────────────┘                      └────────────┬───────────┘
                                                                  │
                                                        Manual Promotion Only
                                                    (workflow_dispatch + Approvals)
                                                                  │
                                                                  ▼
                                                     ┌────────────────────────┐
                                                     │   Deploy: production   │
                                                     │  (Gated & Approved)    │
                                                     └────────────────────────┘
```

---

## 2. Monorepo Applications & Services

The platform comprises three deployable applications and supporting microservices:

| Application | Technology Stack | Runtime / Port | Dockerfile | Purpose |
|---|---|---|---|---|
| **`web`** | Next.js 14, React 18, TailwindCSS | Node 20 / Port 3000 | `infrastructure/docker/web.Dockerfile` | Public e-commerce storefront, PC custom configurator, community builds. |
| **`admin`** | Next.js 14, React 18, TanStack Query | Node 20 / Port 3002 | `infrastructure/docker/admin.Dockerfile` | Backoffice portal for order management, pricing, catalog updates, and audit logs. |
| **`api`** | NestJS 10, Prisma ORM, Node 20 | Node 20 / Port 4000 | `infrastructure/docker/api.Dockerfile` | Core REST/GraphQL backend, business logic, authentication, checkout. |
| **`compat-engine`** | Express / Node.js 20 microservice | Node 20 / Port 4001 | `infrastructure/docker/compatibility-engine.Dockerfile` | Standalone rules engine for physical & electrical PC component matching. |

---

## 3. Continuous Integration (CI) Pipeline

The CI workflow ([`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)) executes on every push and pull request targeting `main` or `develop`.

### 3.1 Pipeline Stages

```
   ┌──────────┐      ┌──────────────┐      ┌────────────┐
   │ 1. Lint  ├─────►│ 2. Typecheck ├─────►│  5. Build  │
   └──────────┘      └──────────────┘      └─────┬──────┘
                                                 │
   ┌──────────────┐                              ▼
   │ 3. Unit Test ├───────────────────────►┌────────────┐
   └──────────────┘                        │ 6. E2E Test│
                                           └────────────┘
   ┌────────────────────┐
   │ 4. Integration Test│ (PostgreSQL service container)
   └────────────────────┘

   ┌────────────────────┐
   │ 7. Security Checks │ (pnpm audit, TruffleHog, Key scanning)
   └────────────────────┘
```

1. **`lint`**:
   - Executes `pnpm format:check` using Prettier.
   - Executes `pnpm lint` across all packages using ESLint.
   - Blocks poorly formatted code and style violations before compilation.

2. **`typecheck`**:
   - Runs `pnpm typecheck` (`tsc --noEmit`) across all workspace projects.
   - Enforces zero type regressions, strict TypeScript checks, and interface contracts.

3. **`unit-tests`**:
   - Runs validation package tests (`packages/validation`).
   - Runs compatibility engine unit suite (`services/compatibility-engine`).
   - Runs recommendation scoring unit suite (`services/recommendation-engine`).
   - Runs NestJS unit specs across controllers, services, and guard logic with in-memory mocks.

4. **`integration-tests`**:
   - Boots an ephemeral PostgreSQL 16 container service with healthcheck polling.
   - Runs schema migrations (`prisma db push / prisma migrate deploy`).
   - Executes end-to-end API integration tests for auth, products, builds, cart, orders, and coupons.
   - Uses zero real payment systems (all payment gateway calls route through mocked Razorpay test harnesses).

5. **`build`**:
   - Compiles shared libraries in dependency order: `@pc-platform/types` ➔ `@pc-platform/validation` ➔ `@pc-platform/api-client` ➔ `@pc-platform/ui`.
   - Compiles `@pc-platform/api` (`nest build`).
   - Compiles Next.js storefront `@pc-platform/web` (`next build`).
   - Compiles Next.js backoffice `@pc-platform/admin` (`next build`).

6. **`e2e-tests`**:
   - Installs headless Chromium browsers (`npx playwright install --with-deps chromium`).
   - Runs Playwright browser test suites covering full user journeys: registration, login, catalog browsing, builder configuration, compatibility warnings, cart checkout.
   - Automatically records and archives Playwright test artifacts (`tests/playwright-report/`) with 14-day retention for debugging.

7. **`security-checks`**:
   - Dependency vulnerability auditing: `pnpm audit --audit-level=high`.
   - Secret scanning: TruffleHog OSS action scans git commit tree for exposed tokens, private keys, or credentials.
   - Live payment key scanning: Custom regex verification preventing any hardcoded `rzp_live_` credentials from entering the codebase.

---

## 4. Continuous Deployment (CD) Architecture

### 4.1 Deployment Workflows

Each application has an independent, reusable workflow triggered via `workflow_call` (by the orchestrator) or `workflow_dispatch` (for ad-hoc operator rollouts):

| Workflow | Path | Target | Special Operations |
|---|---|---|---|
| **Deploy API** | [`.github/workflows/deploy-api.yml`](file:///.github/workflows/deploy-api.yml) | `apps/api` | Pre-flight migration step (`prisma migrate deploy`), secret masking, healthcheck validation (`/api/v1/health`). |
| **Deploy Web** | [`.github/workflows/deploy-web.yml`](file:///.github/workflows/deploy-web.yml) | `apps/web` | Standalone Docker build, public URL injection, CDN edge cache invalidation (`/*`). |
| **Deploy Admin** | [`.github/workflows/deploy-admin.yml`](file:///.github/workflows/deploy-admin.yml) | `apps/admin` | Standalone Docker build, VPC/private network ingress policy validation, auth smoke check. |
| **CD Orchestrator** | [`.github/workflows/cd-orchestrator.yml`](file:///.github/workflows/cd-orchestrator.yml) | Multi-app | Environment routing, deployment dependency ordering (`api` first, then frontends), production safety guard. |

### 4.2 Application Deployment Ordering

To eliminate downtime and prevent frontend errors, deployments follow a phased sequence:

```
Step 1: Database Migration
        └── prisma migrate deploy applies backward-compatible schema changes
Step 2: API Service Deployment
        ├── Deploy new API container version
        └── Health check polling (/api/v1/health & /api/v1/health/db)
Step 3: Frontend Applications Deployment (Parallel)
        ├── Deploy Web Storefront ──► Invalidate CDN static cache
        └── Deploy Admin Backoffice ──► Verify ingress firewall
```

---

## 5. Multi-Tier Environment Strategy

Configuration is decoupled from code using environment-specific templates located in `infrastructure/environments/`:

| Environment | Config File | Trigger Condition | Hostnames | Secret Provider |
|---|---|---|---|---|
| **Development** | [`.env.development`](file:///infrastructure/environments/.env.development) | Push to `develop` | `localhost:3000` / `dev.pcplatform.local` | Git-committed mock dev secrets |
| **Staging** | [`.env.staging`](file:///infrastructure/environments/.env.staging) | Merge to `main` | `staging.pcplatform.in`<br>`api-staging.pcplatform.in`<br>`admin-staging.pcplatform.in` | GitHub Environment `staging` Secrets |
| **Production** | [`.env.production`](file:///infrastructure/environments/.env.production) | Manual Dispatch Only (Approval Gated) | `pcplatform.in`<br>`api.pcplatform.in`<br>`admin.pcplatform.in` | GitHub Environment `production` Secrets (Cloud KMS / HSM backed) |

### 5.1 Environment Isolation Rules

- **Database Separation**: Staging and Production databases are hosted on completely separated PostgreSQL instances. Staging never connects to production databases.
- **Payment Gateways**:
  - Development / Staging: Strictly Razorpay Test Mode keys (`rzp_test_...`).
  - Production: Strictly Razorpay Live Mode keys (`rzp_live_...`) injected only at container runtime.
- **Admin Access Control**:
  - Staging: Gated behind internal VPN or IP whitelisting.
  - Production: Strictly restricted to corporate IP CIDR blocks and mandatory hardware token MFA.

---

## 6. Secret Protection & Anti-Exposure Protocol

GitHub Actions workflows implement multi-layered safeguards to ensure secrets are never leaked into workflow logs:

1. **Automatic Secret Masking**:
   Every workflow explicitly registers sensitive variables with GitHub Actions runner masking using `::add-mask::`:
   ```bash
   echo "::add-mask::${{ secrets.DATABASE_URL }}"
   echo "::add-mask::${{ secrets.JWT_SECRET }}"
   echo "::add-mask::${{ secrets.RAZORPAY_KEY_SECRET }}"
   ```
2. **Prohibition of Verbose Echoes**:
   - No `set -x` or script tracing enabled around environment variable loading.
   - All build commands pass secrets via build args or environment contexts without printing.
3. **Environment Scoping**:
   - Production secrets are scoped strictly to the `production` GitHub Environment.
   - Workflows running on PRs or branches other than `main` do not have access to production credentials.
4. **Pre-Commit & CI Secret Scanning**:
   - TruffleHog scans git commit history on every push.
   - Automated grep pattern checks fail immediately if `rzp_live_` strings or raw private keys appear in source files.

---

## 7. Production Release Controls (Manual Approval Gate)

> [!IMPORTANT]
> **Strict Safety Constraint**: Automated deployment to production is disabled by design.

### 7.1 Production Guard Mechanism

The CD Orchestrator ([`cd-orchestrator.yml`](file:///.github/workflows/cd-orchestrator.yml)) enforces two independent safety mechanisms:

1. **Workflow Level Guard**:
   ```yaml
   production-guard:
     name: Production Safety Guard
     runs-on: ubuntu-latest
     needs: [determine-environment]
     if: needs.determine-environment.outputs.env == 'production'
     steps:
       - name: Validate Manual Dispatch
         run: |
           if [ "${{ github.event_name }}" != "workflow_dispatch" ]; then
             echo "CRITICAL: Automatic deployment to production is prohibited."
             exit 1
           fi
   ```

2. **GitHub Environment Protection Rule**:
   The `production` environment in GitHub Repository Settings must be configured with:
   - **Required Reviewers**: At least two authorized release engineers must approve before jobs targeting `production` execute.
   - **Deployment Branch Rules**: Restrict deployments to tags matching `v*.*.*` or `main`.
   - **Wait Timer**: Optional 5-minute soak timer for staging health before manual release review.

---

## 8. Rollback and Disaster Recovery

If an issue is detected post-deployment:

1. **Application Rollback**:
   Trigger the application deployment workflow (`deploy-web.yml`, `deploy-api.yml`, or `deploy-admin.yml`) using `workflow_dispatch`, specifying the previous stable Docker image tag (e.g., `git-sha` or semantic tag `v1.0.4`).
2. **Database Rollback**:
   - Because all migrations are backward-compatible (expand-contract pattern), the prior application version can safely run against the existing database schema.
   - For destructive incidents, restore the pre-deployment automated snapshot taken prior to migration execution.
3. **Edge Cache Purge**:
   Trigger CDN edge purge to evict any cached faulty responses or bundles immediately.
