# Architecture Overview — PC Platform

> Last Updated: 2026-09  
> Status: Active

---

## Table of Contents

1. [Vision](#1-vision)
2. [System Layers](#2-system-layers)
3. [Monorepo Boundaries](#3-monorepo-boundaries)
4. [Request Flow](#4-request-flow)
5. [Dependency Graph](#5-dependency-graph)
6. [Module Responsibilities](#6-module-responsibilities)
7. [Data Ownership](#7-data-ownership)
8. [Scalability Path](#9-scalability-path)

---

## 1. Vision

PC Platform is designed to be:

- **Maintainable by a small team** — clear module boundaries reduce cognitive overhead
- **Independently deployable** — the compatibility engine can be scaled separately from the core API
- **Database-portable** — PostgreSQL today, Google Cloud SQL tomorrow — with zero frontend changes
- **Type-safe end-to-end** — shared TypeScript contracts from database schema to React component props

---

## 2. System Layers

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                          │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │   Web Storefront  │  │    Admin Dashboard       │ │
│  │  (Next.js / SSR)  │  │   (Next.js / CSR/SSR)   │ │
│  └────────┬──────────┘  └────────────┬─────────────┘ │
└───────────┼──────────────────────────┼───────────────┘
            │  HTTPS / REST API         │
            ▼                          ▼
┌───────────────────────────────────────────────────────┐
│                   NGINX (Reverse Proxy)               │
│   /api/v1/* → :4000   /admin/* → :3001   /* → :3000  │
└──────────────────────┬────────────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │   NestJS API        │  :4000
            │  (Modular Monolith) │
            │                     │
            │  ┌───────────────┐  │
            │  │  Auth Module  │  │
            │  ├───────────────┤  │
            │  │ Users Module  │  │
            │  ├───────────────┤  │
            │  │Products Module│  │
            │  ├───────────────┤  │
            │  │ Orders Module │  │
            │  ├───────────────┤  │
            │  │ Builds Module │──┼───── HTTP ──────►  Compatibility
            │  ├───────────────┤  │                    Engine :4001
            │  │ Search Module │  │
            │  └───────────────┘  │
            │                     │
            └──────────┬──────────┘
                       │ Prisma ORM
                       ▼
            ┌──────────────────────┐
            │    PostgreSQL 16     │
            │  (Docker / Cloud SQL)│
            └──────────────────────┘
```

---

## 3. Monorepo Boundaries

### Strict Rules (enforced by package.json `dependencies`)

| Package / App | May Import From | Must NOT Import From |
|---|---|---|
| `apps/web` | `packages/types`, `packages/validation`, `packages/api-client`, `packages/ui`, `packages/config` | `packages/database`, `apps/api`, `services/*` |
| `apps/admin` | Same as `apps/web` | Same as `apps/web` |
| `apps/api` | `packages/types`, `packages/validation`, `packages/database`, `packages/config` | `packages/api-client`, `packages/ui`, `apps/web` |
| `services/compatibility-engine` | `packages/types`, `packages/validation`, `packages/database`, `packages/config` | `apps/*`, `packages/api-client`, `packages/ui` |
| `packages/api-client` | `packages/types`, `packages/validation` | `packages/database`, `apps/*`, `services/*` |
| `packages/validation` | `packages/types` | Everything else |
| `packages/types` | Nothing (leaf package) | Everything |
| `packages/database` | `packages/types` | `apps/*`, `packages/api-client`, `packages/ui` |

---

## 4. Request Flow

### Customer browsing products

```
Browser → Nginx → apps/web (Next.js SSR)
  → packages/api-client
  → apps/api /products
  → packages/database (Prisma)
  → PostgreSQL
  ← JSON response
  ← Rendered HTML
```

### PC Builder compatibility check

```
Browser → apps/web (React)
  → packages/api-client
  → apps/api /builds/check-compatibility
  → services/compatibility-engine (HTTP)
  → Compatibility rules engine
  ← CompatibilityResult
  ← Displayed to user
```

### Admin creating a product

```
Browser → Nginx → apps/admin (Next.js)
  → packages/api-client
  → apps/api /admin/products (JWT protected)
  → Auth guard validates admin role
  → packages/database
  → PostgreSQL
```

---

## 5. Dependency Graph

```
packages/types          ← leaf, no internal deps
    ▲
packages/validation     ← depends on types
    ▲           ▲
packages/api-client   packages/database
    ▲                     ▲
apps/web             apps/api
apps/admin           services/compatibility-engine
```

No circular dependencies. Direction of arrows = "depends on".

---

## 6. Module Responsibilities

### `apps/web`
- Server-side rendered storefront
- PC builder UI (step wizard)
- Product listing, search, filtering
- Cart and checkout (Razorpay integration)
- User account, order history
- **Does NOT** contain business logic or DB access

### `apps/admin`
- Internal tool for operations team
- Product and inventory management
- Order management and fulfillment
- User and role management
- Analytics dashboards
- **Requires** admin JWT role

### `apps/api`
- Single REST API serving both frontends
- Owns all business logic
- JWT authentication (access + refresh)
- Request validation via Zod pipes
- Module-per-domain design (NestJS)
- Calls compatibility engine for build validation

### `services/compatibility-engine`
- Standalone HTTP service
- Accepts component lists, returns compatibility results
- Contains all hardware compatibility rules (socket types, TDP, voltage, form factors)
- No web-facing endpoints — internal API only
- Can be scaled, restarted, or replaced independently

### `packages/types`
- Pure TypeScript interfaces, enums, and type aliases
- Single source of truth for domain models
- Zero runtime dependencies

### `packages/validation`
- Zod schemas corresponding to types
- Used by frontend forms AND backend DTOs
- Ensures contract consistency

### `packages/api-client`
- Typed wrapper around `fetch`
- One function per API endpoint
- Returns typed responses
- Handles auth token attachment and refresh

### `packages/ui`
- shadcn/ui component wrappers
- Design tokens and Tailwind config extensions
- No data fetching
- Storybook stories (future)

### `packages/database`
- Prisma schema (`schema.prisma`)
- Generated Prisma client (gitignored)
- `PrismaService` class (injectable in NestJS)
- Migrations and seed scripts
- **This is the only package that talks to PostgreSQL**

### `packages/config`
- Shared tsconfig, eslint, tailwind configs
- Ensures consistency across all packages

---

## 7. Data Ownership

```
PostgreSQL
└── Owned exclusively by packages/database
    └── Accessed only by apps/api and services/compatibility-engine
        └── Via Prisma (not raw SQL for application code)
```

Frontend apps never see a database connection string.  
Prisma is never imported in `apps/web` or `apps/admin`.

---

## 8. Scalability Path

### Phase 1 (Current) — Modular Monolith
All NestJS modules deployed as a single process. Simple, fast to develop.

### Phase 2 — Extract Hot Modules
If `products` or `search` need independent scaling, extract into separate NestJS apps. Shared `packages/database` remains the contract.

### Phase 3 — Database Migration
Move PostgreSQL from Docker to **Google Cloud SQL** or **Supabase**:
1. Change `DATABASE_URL` in `.env`
2. Run `pnpm db:migrate`
3. Done — zero frontend changes required

### Phase 4 — CDN and Edge
Move `apps/web` static assets to CDN, edge-cache product pages via Next.js ISR.
