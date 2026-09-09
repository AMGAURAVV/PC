# System Overview — PC Platform

> Status: Active | Last Updated: 2026-09

---

## 1. Overview

PC Platform is a full-stack e-commerce and PC building platform consisting of:

- A **customer storefront** where users browse components, configure custom PC builds, and place orders
- An **admin dashboard** for internal operations (product management, orders, inventory)
- A **REST API backend** implementing all business logic
- A **compatibility engine** — an isolated service that validates hardware compatibility rules
- A **shared package layer** ensuring type-safety and contract consistency across all apps

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL CLIENTS                             │
│                                                                      │
│   ┌─────────────────────┐        ┌─────────────────────────────┐    │
│   │   apps/web           │        │   apps/admin                │    │
│   │   Next.js Storefront │        │   Next.js Admin Dashboard   │    │
│   │   (SSR + CSR)        │        │   (CSR + SSR)               │    │
│   └──────────┬──────────┘        └────────────┬────────────────┘    │
└──────────────┼──────────────────────────────────┼────────────────────┘
               │                                  │
               │  HTTPS REST (via api-client pkg)  │
               ▼                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY :80                           │
│   /api/v1/*  → :4000    /*  → :3000    /admin/*  → :3001            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
              ┌────────────────▼─────────────────┐
              │        apps/api  :4000            │
              │     NestJS Modular Monolith        │
              │                                   │
              │  ┌──────────┐  ┌──────────────┐  │
              │  │   auth   │  │    users     │  │
              │  ├──────────┤  ├──────────────┤  │
              │  │ products │  │    search    │  │
              │  ├──────────┤  ├──────────────┤  │
              │  │  orders  │  │    builds    │──┼──── HTTP ──►
              │  ├──────────┤  ├──────────────┤  │
              │  │  health  │  │  categories  │  │
              │  └──────────┘  └──────────────┘  │
              └────────────────┬─────────────────┘
                               │
               ┌───────────────┼───────────────────┐
               │               │                   │
    ┌──────────▼──────┐  ┌─────▼──────┐  ┌────────▼──────────────┐
    │   PostgreSQL 16  │  │   Redis    │  │ services/             │
    │   (via Prisma)   │  │  (cache /  │  │ compatibility-engine  │
    │                  │  │  sessions) │  │ :4001                 │
    └──────────────────┘  └────────────┘  └───────────────────────┘
```

---

## 3. Component Inventory

| Component | Technology | Port | Role |
|---|---|---|---|
| `apps/web` | Next.js 14 | 3000 | Customer storefront |
| `apps/admin` | Next.js 14 | 3001 | Admin operations |
| `apps/api` | NestJS 10 | 4000 | REST API |
| `services/compatibility-engine` | NestJS 10 | 4001 | Hardware compatibility checks |
| PostgreSQL | PostgreSQL 16 | 5432 | Primary data store |
| Redis | Redis 7 | 6379 | Cache & session store |
| Nginx | Nginx 1.25 | 80 | Reverse proxy |

---

## 4. API Domains

The NestJS API is split into these domain modules:

| Module | Prefix | Responsibility |
|---|---|---|
| Health | `/health` | Liveness and readiness probes |
| Auth | `/auth` | Register, login, refresh, logout |
| Users | `/users` | User profile, address management |
| Products | `/products` | Product catalog, search, filtering |
| Categories | `/categories` | Product category taxonomy |
| Builds | `/builds` | Saved PC build management |
| Orders | `/orders` | Cart, checkout, order management |
| Admin | `/admin/*` | All admin CRUD operations |

---

## 5. Compatibility Engine Design

The compatibility engine is **not** part of the main API.

- Accepts a `BuildComponents` payload via HTTP POST
- Runs rules against component combinations
- Returns a `CompatibilityResult` with pass/fail and human-readable messages
- Stateless — no direct user or order data
- Can be replaced with a rules-as-code system or ML model in future phases

See [docs/compatibility/compatibility-engine.md](../compatibility/compatibility-engine.md) for full spec.

---

## 6. Authentication & Security Architecture

The platform uses enterprise-grade authentication implemented in `@pc-platform/api`:

- **Password Security**: Bcrypt (salt factor 12). No plain-text storage or serialized password hashes.
- **JWT & Token Rotation**: 15m short-lived access tokens + 7d rotating refresh tokens stored as SHA-256 hashes in DB and served via `httpOnly`, `Secure`, `SameSite: Strict` cookies.
- **Token Reuse & Theft Detection**: Re-submitting an already-revoked refresh token triggers an immediate global session purge for that account.
- **Account Status**: Strictly enforces `ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, and `INACTIVE` state rules.
- **Email Verification**: Cryptographically signed 24h verification tokens with constant-response resend endpoints.
- **Password Reset**: Self-invalidating reset tokens tied to user password state, with automatic multi-device session revocation upon reset.
- **Google OAuth 2.0**: ID token verification and automatic verified user provisioning.
- **RBAC**: Canonical enforcement of 5 system roles (`CUSTOMER`, `ADMIN`, `STAFF`, `EDITOR`, `INVENTORY_MANAGER`) via `RolesGuard`.
- **Security Audit Logging**: Full event tracking in `audit_logs` table via `AuditLogsService`.

For detailed security specs, see [docs/security/authentication.md](../security/authentication.md).

---

## 7. Data Consistency

- All writes go through the NestJS API
- The API validates all input (Zod pipes)
- Prisma handles transactions for multi-table writes
- Optimistic locking for inventory updates (quantity checks within transactions)
- Redis caches product lists and categories (TTL-based invalidation)

---

## 8. Error Handling

All API errors follow a consistent response shape:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "price", "message": "must be a positive number" }
  ],
  "timestamp": "2026-09-07T12:00:00.000Z",
  "path": "/api/v1/products"
}
```

See [docs/api/api-conventions.md](../api/api-conventions.md).

---

## 9. Inter-Service Communication

Currently synchronous HTTP only:

| From | To | Transport | Auth |
|---|---|---|---|
| `apps/api` | `services/compatibility-engine` | HTTP POST | Internal API Key (`COMPATIBILITY_ENGINE_API_KEY`) |
| `apps/web` | `apps/api` | HTTPS REST | JWT Bearer |
| `apps/admin` | `apps/api` | HTTPS REST | JWT Bearer (admin role) |

Future: async events via a queue (BullMQ/Redis) for order processing.
