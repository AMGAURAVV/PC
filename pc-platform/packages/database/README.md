# @pc-platform/database

> Prisma schema, migrations, and seed system for the PC Platform.

---

## Overview

This package is the **single source of truth** for the PostgreSQL database schema.
All apps and services import Prisma types from here — never from raw SQL.

```
packages/database/
├── prisma/
│   ├── schema.prisma          ← Full schema (50 tables, v2.0.0)
│   ├── seed.ts                ← Seed orchestrator
│   └── seeds/
│       ├── 01-roles.ts
│       ├── 02-permissions.ts
│       ├── 03-brands.ts
│       ├── 04-categories.ts
│       ├── 05-component-types.ts
│       ├── 06-suppliers.ts
│       ├── 07-products.ts      ← DEMO DATA (prices/passwords)
│       ├── 08-compatibility-rules.ts
│       └── 09-users.ts         ← DEMO DATA (passwords)
├── src/
│   ├── generated/             ← Auto-generated Prisma client (gitignored)
│   ├── database.service.ts    ← NestJS-injectable PrismaClient
│   └── index.ts               ← Package public API
└── package.json
```

---

## Quick Start

### Prerequisites

1. **PostgreSQL 16** running locally or via Docker:
   ```bash
   docker compose up postgres -d
   ```

2. **Environment variable**:
   ```bash
   cp .env.example .env
   # DATABASE_URL is already set for local Docker
   ```

### First-time setup

```bash
# From monorepo root:

# 1. Install dependencies
pnpm install

# 2. Apply all migrations
pnpm --filter @pc-platform/database migrate:dev --name "full_schema_v2"

# 3. Generate Prisma client
pnpm --filter @pc-platform/database generate

# 4. Seed demo data
pnpm --filter @pc-platform/database seed
```

### Shortcuts (root package.json)

```bash
pnpm db:migrate       # = migrate:dev
pnpm db:generate      # = prisma generate
pnpm db:seed          # = tsx prisma/seed.ts
pnpm db:studio        # = prisma studio (visual browser)
pnpm db:reset         # = migrate:reset (⚠️ destroys all data)
```

---

## Commands Reference

| Command | What it does |
|---|---|
| `pnpm --filter @pc-platform/database migrate:dev` | Create + apply migration in dev |
| `pnpm --filter @pc-platform/database migrate:deploy` | Apply pending migrations (production/CI) |
| `pnpm --filter @pc-platform/database migrate:reset` | Reset DB, re-apply all migrations, re-seed |
| `pnpm --filter @pc-platform/database migrate:status` | Show pending/applied migration status |
| `pnpm --filter @pc-platform/database generate` | Regenerate Prisma client after schema changes |
| `pnpm --filter @pc-platform/database seed` | Run all seed scripts |
| `pnpm --filter @pc-platform/database studio` | Launch Prisma Studio (port 5555) |
| `pnpm --filter @pc-platform/database typecheck` | TypeScript type-check without emitting |

---

## Schema Domains (50 tables)

| Domain | Tables |
|---|---|
| Auth & Users | users, roles, permissions, user_roles, role_permissions, refresh_tokens, user_addresses |
| Products | brands, categories, products, product_categories, product_variants, product_images, product_specifications, component_type_defs, component_spec_definitions |
| Component Specs | cpu_specs, gpu_specs, motherboard_specs, ram_specs, storage_specs, psu_specs, case_specs, cooler_specs, fan_specs, monitor_specs, peripheral_specs |
| Inventory & Pricing | suppliers, inventory, prices, price_history |
| Builds | builds, build_items, saved_builds, build_versions, shared_build_links, build_templates |
| Compatibility | compatibility_rules, compatibility_rule_conditions, compatibility_rule_results, compatibility_warnings, power_requirements, physical_dimensions |
| Commerce | coupons, coupon_usages, carts, cart_items |
| Orders | orders, order_items, payments, shipments, shipment_events |
| UGC & Admin | reviews, review_images, wishlists, wishlist_items, audit_logs |

See [`docs/architecture/database/ERD.md`](../../docs/architecture/database/ERD.md) for full ERD diagrams and table explanations.

---

## Making Schema Changes

**Always follow this workflow:**

```bash
# 1. Edit schema.prisma
# 2. Create + apply migration
pnpm --filter @pc-platform/database migrate:dev --name "describe_your_change"

# 3. Regenerate client
pnpm --filter @pc-platform/database generate

# 4. Typecheck
pnpm --filter @pc-platform/database typecheck
```

> ⚠️ Never edit migration files manually after they have been applied.  
> Never run `prisma migrate dev` in production — use `prisma migrate deploy`.

---

## Seed Data

> ⚠️ **All seeded data is DEMO DATA.**
> - All prices are illustrative only — **not real market prices**
> - All passwords are insecure demo hashes — **change before production**
> - Clearly marked `[DEMO]` in comments and seed output

### Demo Accounts

| Email | Password | Role |
|---|---|---|
| `admin@pcplatform.in` | `Admin@Demo2024!` | super_admin |
| `ops@pcplatform.in` | `Ops@Demo2024!` | admin |
| `demo@example.com` | `Demo@Demo2024!` | customer |

---

## Compatibility Rules (Data-Only)

The `compatibility_rules`, `compatibility_rule_conditions`, and `compatibility_rule_results` tables
store compatibility rule **definitions** only.

**No compatibility logic runs in the database.**

The `compatibility-engine` microservice (`services/compatibility-engine`) reads these rules at
runtime and evaluates them against a build's components. This design:

- Keeps the database as a pure data store
- Allows rule changes without schema migrations
- Makes rules auditable and admin-editable via the admin panel

Pre-seeded rules:
1. CPU ↔ Motherboard socket match (ERROR)
2. RAM type ↔ Motherboard supported types (ERROR)
3. GPU length ≤ Case max GPU length (ERROR)
4. CPU cooler height ≤ Case max cooler height (ERROR)
5. PSU wattage ≥ total TDP × 1.2 (WARNING)
6. Motherboard form factor ∈ case supported form factors (ERROR)
7. CPU cooler socket support (ERROR)
8. RAM capacity ≤ Motherboard max RAM (WARNING)

---

## Database Design Principles

1. **UUID primary keys** on all tables
2. **snake_case** table/column names via `@@map` / `@map`
3. **camelCase** Prisma field names
4. **No prices or stock on the product table** — delegated to `prices` and `inventory`
5. **Soft delete** (`deleted_at`) on entities that must be preserved for referential integrity
6. **Price history** is append-only — never update existing rows
7. **Order item snapshots** — `product_name`, `sku`, `unit_price` captured at order time
8. **Multi-currency ready** — `currency VARCHAR` on `prices`, `orders`, `payments`
9. **Multi-supplier ready** — `supplier_id FK` on `inventory`
10. **Compatibility = data** — no triggers; engine evaluates rules at runtime

---

## Adding a New Component Type

1. Add the type to the `ComponentType` enum in `schema.prisma`
2. Create a new `<type>Spec` model with `productId @unique`
3. Add the relation on the `Product` model
4. Add a new migration: `pnpm migrate:dev --name "add_<type>_spec"`
5. Add the type to `seeds/05-component-types.ts`
6. Add the type to `seeds/07-products.ts` if seeding demo products
7. Add compatibility rules to `seeds/08-compatibility-rules.ts` as needed

---

## Production Deployment (Google Cloud SQL)

```bash
# 1. Set DATABASE_URL with SSL
export DATABASE_URL="postgresql://user:pass@/db?host=/cloudsql/project:region:instance&sslmode=require"

# 2. Apply migrations (never migrate:dev in prod)
pnpm --filter @pc-platform/database migrate:deploy

# 3. Generate client (if not pre-built in CI)
pnpm --filter @pc-platform/database generate
```

Refer to [Google Cloud SQL + Prisma docs](https://www.prisma.io/docs/orm/prisma-schema/data-sources/database-drivers#google-cloud-sql)
for connection string options and Auth Proxy configuration.
