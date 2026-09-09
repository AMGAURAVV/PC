# ADR-001: Architecture Foundations

**Date:** 2026-09  
**Status:** Accepted  
**Authors:** Platform Architecture Team  
**Deciders:** Engineering Lead

---

## Context

We are building a custom PC building and e-commerce platform targeting the Indian market. The system must support:

- A guided PC builder with real-time compatibility validation
- A product catalog with search and filtering
- A checkout flow integrated with Razorpay
- An admin dashboard for internal operations
- A scalable architecture that a small team can maintain

This ADR documents the foundational decisions made before writing application code.

---

## Decisions

### Decision 1: Monorepo with pnpm Workspaces

**Chosen:** pnpm workspaces monorepo  
**Alternatives considered:** Separate repositories, Nx, Turborepo

**Rationale:**
- A single repository simplifies cross-package refactoring and type sharing
- pnpm is faster and more disk-efficient than npm/yarn for workspaces
- Turborepo can be added later for build caching without restructuring
- Avoids the overhead of publishing packages to a registry during early development

**Consequences:**
- All packages share a single `node_modules` structure
- Type changes in `packages/types` are immediately reflected in consumers
- CI must be configured to run only affected packages (future: Turborepo)

---

### Decision 2: NestJS for the Backend API

**Chosen:** NestJS (modular monolith)  
**Alternatives considered:** Express, Fastify, Hono

**Rationale:**
- NestJS provides a clear, opinionated module system that enforces separation of concerns
- Built-in dependency injection prevents ad-hoc coupling
- First-class TypeScript support
- Built-in support for guards, interceptors, and pipes — reduces boilerplate for auth and validation
- Large ecosystem with mature packages for JWT, Passport, and Prisma integration

**Consequences:**
- Higher initial learning curve than raw Express
- Module imports must be carefully managed to avoid circular dependencies

---

### Decision 3: Next.js for Frontend Apps

**Chosen:** Next.js 14 (App Router)  
**Alternatives considered:** Vite + React SPA, Remix, Astro

**Rationale:**
- Server Components improve initial page load performance for product listings
- Built-in SEO optimization (metadata API, server-side rendering) — critical for e-commerce
- File-based routing reduces configuration
- Incremental Static Regeneration (ISR) for high-traffic product pages in future phases
- Strong ecosystem alignment with shadcn/ui and TanStack Query

**Consequences:**
- Team must understand Server vs. Client Components boundary
- More complex deployment than a pure SPA

---

### Decision 4: Prisma as the Database Abstraction Layer

**Chosen:** Prisma ORM  
**Alternatives considered:** TypeORM, Drizzle, raw SQL (pg)

**Rationale:**
- Type-safe query builder — no raw SQL for application code
- Automatic migration tracking with a committed history (`prisma/migrations/`)
- `schema.prisma` is the single source of truth for the database schema
- Provider-agnostic: switching from Docker Postgres to Cloud SQL requires only a `DATABASE_URL` change
- Prisma Studio provides a visual database explorer for development

**Consequences:**
- Generated client is large; must be gitignored and regenerated on install
- Complex joins may eventually require raw SQL for performance (acceptable tradeoff)

---

### Decision 5: PostgreSQL as the Primary Database

**Chosen:** PostgreSQL 16  
**Alternatives considered:** MySQL, MongoDB, PlanetScale

**Rationale:**
- Strong ACID compliance — critical for inventory and payment data
- Rich JSON support for product specifications (without sacrificing relational integrity)
- Excellent full-text search capabilities (future: `tsvector`)
- Industry-standard for relational data with broad hosting support (Cloud SQL, Supabase, RDS, Railway)
- No vendor lock-in

**Consequences:**
- Requires a Postgres-compatible host in production
- Not suitable if the schema were to become highly variable (NoSQL would fit better)

---

### Decision 6: Isolated Compatibility Engine

**Chosen:** Separate NestJS service in `services/compatibility-engine/`  
**Alternatives considered:** Module within `apps/api`, function within frontend, npm package

**Rationale:**
- Hardware compatibility rules are a distinct domain with independent change frequency
- Isolation allows the engine to be unit-tested without any HTTP or database concerns
- Independent scalability — compatibility checks are frequent during PC builder sessions
- Can be replaced with an ML-based engine or a rules-as-data system without touching the API
- Forces the team to define a clear, stable API contract between the API and the engine

**Consequences:**
- Adds network hop for every build compatibility check
- Requires an internal API key for authentication
- Must handle service unavailability gracefully

---

### Decision 7: No Business Logic in Frontend Components

**Chosen:** Frontend is a pure presentation layer  
**Alternatives considered:** Frontend-side compatibility validation, price calculation in React

**Rationale:**
- Prevents logic duplication (same rules in TypeScript on server and client)
- Prevents business rule bypass via browser developer tools
- Simplifies frontend testing — components only need to render data correctly
- Pricing and compatibility rules can change without a frontend deployment

**Consequences:**
- All user interactions that require business logic need an API call
- Optimistic UI requires careful management to avoid showing incorrect data

---

### Decision 8: Shared Types and Validation via Packages

**Chosen:** `packages/types` (TypeScript) + `packages/validation` (Zod)  
**Alternatives considered:** Duplicate types in each app, OpenAPI code generation

**Rationale:**
- Single source of truth — changing a type in one place propagates everywhere
- Zod schemas serve dual purpose: frontend form validation + backend DTO validation
- Eliminates the category of bugs caused by frontend/backend type drift
- No code generation step or tooling overhead

**Consequences:**
- Schema changes in `packages/types` may require updates in multiple consumers
- Package versioning discipline is important (handled by monorepo workspace)

---

### Decision 9: JWT with Refresh Token Rotation

**Chosen:** Short-lived JWT (15m) + Refresh token in httpOnly cookie (7d)  
**Alternatives considered:** Sessions (Redis-backed), long-lived JWT

**Rationale:**
- Short-lived access tokens limit the damage of token theft
- Refresh tokens in httpOnly cookies are inaccessible to JavaScript (XSS protection)
- Stateless access tokens scale horizontally
- Refresh token revocation via Redis blocklist provides logout capability

**Consequences:**
- Requires Redis for refresh token revocation
- Access token expiry every 15 minutes requires silent refresh logic in the frontend

---

### Decision 10: India-Specific Payment Integration

**Chosen:** Razorpay  
**Alternatives considered:** Stripe, PayU, PayPal

**Rationale:**
- Razorpay is the dominant payment gateway for Indian e-commerce
- Supports UPI, net banking, credit/debit cards, and EMI — all critical for India
- Competitive pricing and excellent developer experience
- No conversion required — INR native

**Consequences:**
- Payment logic is Razorpay-specific; abstraction layer recommended for future portability

---

## Consequences Summary

| Decision | Benefit | Risk |
|---|---|---|
| pnpm Monorepo | Type sharing, single CI | Build order complexity |
| NestJS | Structure, DI | Learning curve |
| Next.js App Router | SEO, performance | Server/client component complexity |
| Prisma | Type safety, portability | Large generated client |
| PostgreSQL | ACID, portability | Requires Postgres host |
| Isolated Compatibility | Testability, replaceability | Extra network hop |
| No logic in frontend | Security, simplicity | More API calls |
| Shared types package | No drift | Propagated breaking changes |
| JWT + Refresh | Security | Redis dependency, refresh complexity |
| Razorpay | INR native, UPI | Vendor-specific API |
