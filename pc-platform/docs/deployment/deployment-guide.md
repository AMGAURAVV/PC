# Deployment Guide — PC Platform

> Status: Active | Last Updated: 2026-09

---

## 1. Environments

| Environment | Purpose | Branch |
|---|---|---|
| Local | Developer machines | any |
| Staging | Pre-production testing | `develop` |
| Production | Live platform | `main` |

---

## 2. Prerequisites

- Docker ≥ 24.x
- Docker Compose ≥ 2.x
- Node.js ≥ 20 (for local migration scripts)
- pnpm ≥ 9

---

## 3. Local Development

See [DEVELOPMENT.md](../../DEVELOPMENT.md) for the full local setup guide.

Quick start:

```bash
cp .env.example .env
docker-compose up -d postgres redis
pnpm install
pnpm db:migrate && pnpm db:seed
pnpm dev
```

---

## 4. Building for Production

```bash
# Build all apps
pnpm build

# Or build individually:
pnpm build:api
pnpm build:web
pnpm build:admin
```

---

## 5. Docker Production Build

Each app has a multi-stage Dockerfile in `infrastructure/docker/`.

```bash
# Build production images
docker build -f infrastructure/docker/api.Dockerfile -t pc-platform-api:latest .
docker build -f infrastructure/docker/web.Dockerfile -t pc-platform-web:latest .
docker build -f infrastructure/docker/admin.Dockerfile -t pc-platform-admin:latest .
docker build -f infrastructure/docker/compatibility-engine.Dockerfile -t pc-platform-compat:latest .
```

---

## 6. Environment Variables for Production

Set all variables from `.env.example` in your deployment environment.

**Critical production settings:**

```bash
NODE_ENV=production

# Use a strong random secret (min 64 chars)
JWT_SECRET=<generate with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>

# PostgreSQL connection string
# For Google Cloud SQL:
DATABASE_URL=postgresql://user:pass@/db_name?host=/cloudsql/project:region:instance

# For Supabase:
DATABASE_URL=postgresql://postgres:pass@db.xyz.supabase.co:5432/postgres?schema=public&sslmode=require

COMPATIBILITY_ENGINE_API_KEY=<generate with: openssl rand -hex 32>
```

---

## 7. Database Migrations in Production

**Never** run `migrate reset` in production.

```bash
# Apply pending migrations (safe, idempotent)
DATABASE_URL="<prod url>" npx prisma migrate deploy

# Or via npm script
DATABASE_URL="<prod url>" pnpm db:migrate:prod
```

Run migrations **before** deploying new application code.

---

## 8. Google Cloud SQL Setup

1. Create Cloud SQL instance (PostgreSQL 16):

```bash
gcloud sql instances create pc-platform-db \
  --database-version=POSTGRES_16 \
  --tier=db-g1-small \
  --region=asia-south1
```

2. Create database:

```bash
gcloud sql databases create pc_platform --instance=pc-platform-db
```

3. Set `DATABASE_URL`:

```
postgresql://postgres:<pass>@/pc_platform?host=/cloudsql/<project>:asia-south1:pc-platform-db
```

4. Run migrations:

```bash
DATABASE_URL="<cloud-sql-url>" npx prisma migrate deploy
```

No other changes required — the frontend and API are unaffected.

---

## 9. CI/CD Pipeline Overview

```yaml
# .github/workflows/ci.yml (template)
on: [push, pull_request]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm typecheck

  lint:
    steps:
      - run: pnpm lint

  test:
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
    steps:
      - run: pnpm db:migrate
      - run: pnpm test

  build:
    needs: [typecheck, lint, test]
    steps:
      - run: pnpm build

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        # Push Docker images, run migrate:deploy, restart containers
```

---

## 10. Health Checks

Use these endpoints for load balancer and container health checks:

| Endpoint | Expected Response |
|---|---|
| `GET /api/v1/health` | `200 { "status": "ok" }` |
| `GET /api/v1/health/db` | `200 { "database": "connected" }` |

---

## 11. Logging

- API uses structured JSON logging (Pino or NestJS Logger)
- Log levels: `error`, `warn`, `log`, `debug`, `verbose`
- Production: `LOG_LEVEL=warn` (reduce noise)
- Logs are written to stdout — collect via your cloud provider's log sink

---

## 12. Rollback Strategy

1. Keep previous Docker image tags (do not use `latest` exclusively)
2. Before deploying: tag current image as `stable`
3. On failure: redeploy `stable` tag
4. If migration was applied: restore from database snapshot (planned before every production deploy)
