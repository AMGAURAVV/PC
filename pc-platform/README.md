# PC Platform

> Production-grade custom PC building and e-commerce platform — India-focused, PCPartPicker-style compatibility workflows.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange?logo=pnpm)](https://pnpm.io/)

---

## What is this?

PC Platform is a full-stack monorepo for a custom PC building marketplace. It combines:

- **Guided PC builder** — step-by-step component selection with real-time compatibility checks
- **E-commerce storefront** — browse, search, filter, and buy PC components
- **Admin dashboard** — product, inventory, order, and user management
- **Compatibility engine** — isolated service enforcing hardware compatibility rules

---

## Monorepo Structure

```text
pc-platform/
├── apps/
│   ├── web/                     # Customer-facing Next.js storefront + PC builder
│   ├── admin/                   # Internal Next.js admin dashboard
│   └── api/                     # NestJS REST API (modular monolith)
│
├── services/
│   └── compatibility-engine/    # Standalone NestJS compatibility rule service
│
├── packages/
│   ├── types/                   # Shared TypeScript interfaces & enums
│   ├── validation/              # Shared Zod schemas
│   ├── api-client/              # Typed API client for frontends
│   ├── ui/                      # Shared shadcn/ui component wrappers
│   ├── config/                  # Shared ESLint, Tailwind, tsconfig configs
│   └── database/                # Prisma schema, client, migrations, seeds
│
├── infrastructure/
│   ├── docker/                  # Dockerfiles (per app, multi-stage)
│   ├── nginx/                   # Reverse proxy config
│   └── terraform/               # Cloud IaC (future phase)
│
├── docs/                        # Architecture docs, ADRs, API contracts
├── tests/                       # E2E & integration test suite (Playwright)
└── scripts/                     # Dev tooling and automation scripts
```

---

## Tech Stack

| Layer         | Technology                              |
|---------------|------------------------------------------|
| Frontend      | Next.js 14, React, TypeScript, Tailwind  |
| UI Components | shadcn/ui, Radix UI                      |
| Data Fetching | TanStack Query (React Query)             |
| Forms         | React Hook Form + Zod                   |
| Backend       | NestJS, TypeScript, REST                 |
| Auth          | JWT (access + refresh tokens)            |
| ORM           | Prisma                                   |
| Database      | PostgreSQL 16                            |
| Cache         | Redis                                    |
| Testing       | Vitest, Playwright, Supertest            |
| Infrastructure| Docker, docker-compose, Nginx            |
| Package Mgr   | pnpm workspaces                          |

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm install -g pnpm`)
- Docker & Docker Compose

### 1. Clone and install

```bash
git clone <repo-url> pc-platform
cd pc-platform
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — at minimum set JWT_SECRET and JWT_REFRESH_SECRET
```

### 3. Start infrastructure

```bash
docker-compose up -d postgres redis
```

### 4. Set up the database

```bash
pnpm db:migrate    # run Prisma migrations
pnpm db:seed       # seed initial data (categories, sample products)
```

### 5. Start development servers

```bash
# Start all apps (web + admin + api + compatibility engine)
pnpm dev

# Or start individually:
pnpm dev:api
pnpm dev:web
pnpm dev:admin
pnpm dev:compatibility
```

| Service              | URL                         |
|----------------------|-----------------------------|
| Web Storefront       | http://localhost:3000        |
| Admin Dashboard      | http://localhost:3001        |
| API                  | http://localhost:4000/api/v1 |
| Compatibility Engine | http://localhost:4001        |
| Prisma Studio        | `pnpm db:studio`             |

---

## Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture overview |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Local development guide |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow |
| [docs/architecture/system-overview.md](./docs/architecture/system-overview.md) | Full system design |
| [docs/architecture/frontend.md](./docs/architecture/frontend.md) | Frontend architecture |
| [docs/architecture/backend.md](./docs/architecture/backend.md) | Backend architecture |
| [docs/database/database-architecture.md](./docs/database/database-architecture.md) | Database design |
| [docs/compatibility/compatibility-engine.md](./docs/compatibility/compatibility-engine.md) | Compatibility engine spec |
| [docs/decisions/ADR-001-architecture-foundations.md](./docs/decisions/ADR-001-architecture-foundations.md) | Architecture Decision Record |
| [docs/api/api-conventions.md](./docs/api/api-conventions.md) | REST API conventions |
| [docs/deployment/deployment-guide.md](./docs/deployment/deployment-guide.md) | Deployment guide |

---

## Key Architectural Principles

1. **Frontend never connects to the database directly** — all data flows through the API
2. **Business logic lives in the backend** — no rules in React components
3. **Compatibility is isolated** — the compatibility engine is a separate deployable service
4. **Database is abstracted via Prisma** — PostgreSQL can be migrated to Cloud SQL without touching frontends
5. **Shared contracts** — types and Zod schemas in `packages/` are the single source of truth
6. **No hardcoded data** — products, prices, and rules are always fetched from the API

---

## Scripts

```bash
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps for production
pnpm typecheck        # TypeScript type-check all packages
pnpm lint             # Lint all packages
pnpm format           # Format all files with Prettier
pnpm test             # Run all unit tests
pnpm test:e2e         # Run Playwright E2E tests
pnpm db:migrate       # Run Prisma migrations
pnpm db:seed          # Seed the database
pnpm db:studio        # Open Prisma Studio
pnpm clean            # Clean all build artifacts
```

---

## License

Private — All Rights Reserved.
