# Development Guide — PC Platform

> This guide covers everything needed to get the platform running locally.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First-Time Setup](#2-first-time-setup)
3. [Running Services](#3-running-services)
4. [Development Workflow](#4-development-workflow)
5. [Database Operations](#5-database-operations)
6. [Environment Variables](#6-environment-variables)
7. [Code Quality Tools](#7-code-quality-tools)
8. [Debugging](#8-debugging)
9. [Common Problems](#9-common-problems)

---

## 1. Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| pnpm | ≥ 9.x | `npm install -g pnpm` |
| Docker | Latest | [docker.com](https://www.docker.com/products/docker-desktop) |
| Docker Compose | ≥ 2.x | Included with Docker Desktop |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

---

## 2. First-Time Setup

```bash
# 1. Clone the repository
git clone <repo-url> pc-platform
cd pc-platform

# 2. Install all dependencies (respects workspace hoisting)
pnpm install

# 3. Copy and configure environment
cp .env.example .env
# Open .env and fill in:
#   - JWT_SECRET (min 32 random chars)
#   - JWT_REFRESH_SECRET (min 32 random chars)
# All other defaults work for local dev

# 4. Start infrastructure only
docker-compose up -d postgres redis

# 5. Generate Prisma client
pnpm db:generate

# 6. Run database migrations
pnpm db:migrate

# 7. Seed the database (sample products, categories, admin user)
pnpm db:seed

# 8. Start all apps
pnpm dev
```

Or use the automated setup script:

```bash
bash scripts/setup.sh
```

---

## 3. Running Services

### Start everything

```bash
pnpm dev
```

This runs all apps in parallel using `pnpm --parallel -r dev`.

### Start individual apps

```bash
pnpm dev:api             # NestJS API on :4000
pnpm dev:web             # Next.js web on :3000
pnpm dev:admin           # Next.js admin on :3001
pnpm dev:compatibility   # Compatibility engine on :4001
```

### Start with Docker (full stack)

```bash
docker-compose up
# Or in detached mode:
docker-compose up -d
```

### Service URLs

| Service | URL | Notes |
|---|---|---|
| Web Storefront | http://localhost:3000 | Customer-facing |
| Admin Dashboard | http://localhost:3001 | Requires admin account |
| API | http://localhost:4000/api/v1 | REST API |
| API Health | http://localhost:4000/api/v1/health | |
| Compatibility Engine | http://localhost:4001 | Internal only |
| Prisma Studio | Run `pnpm db:studio` | DB visual explorer |

---

## 4. Development Workflow

### Adding a new API endpoint

1. Create or update the NestJS module in `apps/api/src/<module>/`
2. Add request/response types to `packages/types/src/`
3. Add Zod validation schema to `packages/validation/src/`
4. Add a typed function to `packages/api-client/src/`
5. Write unit tests alongside the module
6. Update `docs/api/` with endpoint documentation

### Adding a new database model

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:migrate` (creates a new migration file)
3. Run `pnpm db:generate` (regenerates Prisma client)
4. Update types in `packages/types/`
5. Update seed script if needed

### Adding a UI component

1. Create the component in `packages/ui/src/components/`
2. Export it from `packages/ui/src/index.ts`
3. Import in your app: `import { Button } from '@pc-platform/ui'`

### Making a compatibility rule change

1. Edit rules in `services/compatibility-engine/src/rules/`
2. Write tests for the new rule
3. Update `docs/compatibility/compatibility-engine.md`

---

## 5. Database Operations

```bash
# Create and run a new migration
pnpm db:migrate

# Generate Prisma client after schema changes
pnpm db:generate

# Seed the database
pnpm db:seed

# Open Prisma Studio (visual database explorer)
pnpm db:studio

# Reset database (drops all tables, re-runs migrations, re-seeds)
pnpm db:reset

# Connect to Postgres directly via psql
docker exec -it pc-platform-postgres psql -U postgres pc_platform
```

---

## 6. Environment Variables

All config lives in `.env`. See [.env.example](.env.example) for the full list with comments.

**Critical variables to set for local dev:**

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Access token signing secret |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |

Never commit `.env`. It is in `.gitignore`.

---

## 7. Code Quality Tools

### Type checking

```bash
pnpm typecheck              # all packages
pnpm --filter @pc-platform/api typecheck  # single package
```

### Linting

```bash
pnpm lint                   # check all
pnpm lint:fix               # auto-fix where possible
```

### Formatting

```bash
pnpm format                 # write format to all files
pnpm format:check           # check without writing
```

### Running tests

```bash
pnpm test                   # all unit tests (Vitest/Jest)
pnpm test:e2e               # Playwright E2E tests
```

---

## 8. Debugging

### API (NestJS)

The API starts with `--inspect` in development. Attach your debugger to port 9229.

**VS Code `launch.json`:**
```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to API",
  "port": 9229,
  "restart": true
}
```

### View logs

```bash
docker-compose logs -f api
docker-compose logs -f compatibility-engine
```

---

## 9. Common Problems

### `pnpm install` fails with peer dependency errors

```bash
pnpm install --shamefully-hoist
```

### Database connection refused

Make sure Postgres is running:
```bash
docker-compose up -d postgres
docker-compose ps
```

### Prisma client out of sync

```bash
pnpm db:generate
```

### Port already in use

```bash
# Kill process on port 4000
npx kill-port 4000
```

### `MODULE_NOT_FOUND` for workspace package

```bash
pnpm install
pnpm db:generate
```
