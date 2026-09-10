# Backend Architecture — PC Platform

> **Status:** Active | **Application:** `apps/api` (Core API Service)  
> **Tech Stack:** NestJS 10, TypeScript 5, Prisma ORM 5, PostgreSQL 16, Redis, Jest

---

## 1. Module Overview & Responsibilities

`apps/api` is the enterprise REST/GraphQL backend application for PC Platform. Built with **NestJS**, it enforces a modular, clean-architecture design pattern where feature modules remain loosely coupled through dependency injection and repository abstractions.

### Core Modules:
- **`AuthModule`**: User registration, credential authentication, JWT access/refresh token rotation, role verification.
- **`ProductsModule`**: E-commerce catalog, component specs (CPU, GPU, RAM, Motherboard, etc.), search filters, pagination.
- **`BuildsModule`**: Custom PC build configurations, component slot allocations, and integration with the compatibility engine.
- **`CartModule`**: Persistent multi-item cart management, price calculation, validation against current stock.
- **`OrdersModule`**: Atomic order creation, status lifecycle transitions, invoice generation, checkout orchestrations.
- **`PaymentsModule`**: Payment gateway abstractions (Razorpay, mock test provider), webhook processing, signature verification.
- **`AdminModule`**: Backoffice operational APIs, role-based access control, user moderation, audit log inspection.
- **`SearchModule`**: Multi-provider search engine abstraction (PostgreSQL ILIKE / Full-Text and MeiliSearch/Typesense adapter).
- **`StorageModule`**: Cloud storage provider abstraction (Local disk, AWS S3, Google Cloud Storage).

---

## 2. Technical Specification & Module Contracts

| Dimension | Specification |
|---|---|
| **Purpose** | Serve as the authoritative business logic and data persistence engine for e-commerce, PC configurator, and administrative workflows. |
| **Responsibilities** | API routing, request validation, authentication/authorization, transactional database operations, external gateway integrations. |
| **Inputs** | HTTP requests with JSON payloads (validated via Zod / class-validator DTOs), query parameters, Bearer JWT tokens, webhook signatures. |
| **Outputs** | Standardized JSON envelopes (`{ data: ..., meta: ... }`), HTTP status codes (200, 201, 400, 401, 403, 404, 500), error payloads. |
| **Dependencies** | `@pc-platform/database`, `@pc-platform/types`, `@pc-platform/validation`, `@pc-platform/config`, `@nestjs/*`, `prisma`. |
| **Database Tables** | `users`, `roles`, `permissions`, `products`, `component_*_specs`, `prices`, `inventory`, `builds`, `orders`, `cart_items`, `coupons`, `audit_logs`. |
| **API Endpoints** | Base prefix `/api/v1` serving `auth`, `products`, `builds`, `cart`, `orders`, `reviews`, `coupons`, `admin`. |

---

## 3. Layered Design & Repository Pattern

Every feature module follows a strict 3-tier structure:

```
┌─────────────────────────────────────────────────────────────┐
│                      Controller Layer                       │
│   - Decorators (@Controller, @Get, @Post, @UseGuards)       │
│   - Extracts request params, invokes service methods        │
│   - Returns clean DTO responses                             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│   - Pure business logic & domain validations                │
│   - Manages transactions (this.db.$transaction)             │
│   - Emits events & coordinates multiple repositories        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Repository Layer                       │
│   - Direct data access abstraction via DatabaseService      │
│   - Implements query filtering, includes, sorting, paging   │
│   - Isolates database dialect and ORM specifics             │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Global Cross-Cutting Concerns
- **Validation**: Global `ValidationPipe` with `transform: true` and `whitelist: true` strips unknown attributes and coerces types.
- **Exception Filter (`AllExceptionsFilter`)**: Catches all HTTP and Prisma exceptions, maps them to standard JSON errors, and suppresses internal stack traces in production.
- **Interceptors**:
  - `HttpCacheInterceptor`: Caches idempotent public catalog and spec queries in memory or Redis with configurable TTL.
  - `TransformInterceptor`: Enforces consistent output structure.
- **Guards**: `JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, and `ThrottlerGuard` (rate limiting).

---

## 4. Failure Modes & Resilience Patterns

| Failure Scenario | Impact | Mitigation / Resilience Pattern |
|---|---|---|
| **Database Pool Exhaustion** | Latency spikes or connection timeout (500) | Prisma pool size configured via `DATABASE_URL` (`connection_limit=50`). `HealthService` reports status at `/api/v1/health/db`. |
| **Payment Gateway Outage** | Checkout failures | Webhook idempotency ledger prevents double-charging. Retry mechanisms with exponential backoff on transient network faults. |
| **Compatibility Engine Offline** | Configurator unable to run live rule validation | API falls back to cached compatibility summary and logs a warning with graceful user notification. |
| **Concurrent Stock Checkout** | Race conditions causing negative inventory | Atomic transaction with row-level stock check in `OrdersService`: `quantity: { gte: orderQuantity }`. |

---

## 5. Testing Approach

- **Unit Tests**:
  - Located alongside source files as `*.spec.ts`.
  - Mocks repositories and `DatabaseService` using Jest.
  - Run command: `pnpm --filter @pc-platform/api test`
- **Integration Tests**:
  - Real database tests located in `src/**/*.integration.spec.ts` testing complete controller-service-database flows.
  - Run against a PostgreSQL container with applied Prisma migrations.
- **Static Analysis & Typecheck**:
  - `pnpm --filter @pc-platform/api typecheck`
  - `pnpm --filter @pc-platform/api lint`

---

## 6. How to Modify Safely

1. **Adding a New Endpoint**:
   - Create request/response DTOs in `dto/` validating inputs with `@pc-platform/validation` or Zod.
   - Add controller method with proper HTTP method decorator and Swagger/OpenAPI annotations.
   - Implement business logic in the feature service.
   - Encapsulate Prisma queries in the feature repository.
   - Write corresponding unit and integration tests (`.spec.ts`).
2. **Modifying an Existing Domain Model**:
   - Update `packages/database/prisma/schema.prisma` first.
   - Run `pnpm --filter @pc-platform/database migrate:dev` and `pnpm --filter @pc-platform/database generate`.
   - Update domain types in `packages/types`.
   - Update repository methods in `apps/api`.
