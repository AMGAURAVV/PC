# Backend Architecture — PC Platform

> Covers `apps/api`  
> Status: Active | Last Updated: 2026-09

---

## 1. Guiding Principles

1. **Modular monolith** — all API code in one process, separated by domain modules
2. **Thin controllers** — controllers handle routing and auth; services handle logic
3. **Prisma via abstraction** — all DB access through `DatabaseService`, not raw Prisma imports
4. **Zod for input validation** — all incoming DTOs are validated at the controller/pipe layer
5. **Compatibility is external** — the API calls the compatibility engine; no rules live here

---

## 2. Technology Stack

| Concern | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript (strict) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh), Passport.js |
| Validation | Zod (via custom ZodValidationPipe) |
| Cache | Redis (via ioredis) |
| Testing | Jest, Supertest |
| API Style | REST, versioned (`/api/v1/`) |

---

## 3. Directory Structure

```
apps/api/
├── src/
│   ├── main.ts                    # NestJS bootstrap, global pipes/guards
│   ├── app.module.ts              # Root module — imports all feature modules
│   │
│   ├── config/                    # Configuration module (reads .env)
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   │
│   ├── common/                    # Shared utilities across modules
│   │   ├── decorators/            # @CurrentUser, @Roles, @Public
│   │   ├── filters/               # Global exception filters
│   │   ├── guards/                # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/          # Response transform, logging
│   │   ├── pipes/                 # ZodValidationPipe
│   │   └── types/                 # API-specific type extensions
│   │
│   ├── auth/                      # Auth module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/            # JWT, LocalStrategy
│   │   └── dto/
│   │
│   ├── users/                     # Users module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │
│   ├── products/                  # Products module
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.service.spec.ts
│   │   └── dto/
│   │
│   ├── categories/                # Category taxonomy
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   └── categories.service.ts
│   │
│   ├── builds/                    # PC build management
│   │   ├── builds.module.ts
│   │   ├── builds.controller.ts
│   │   ├── builds.service.ts      # Calls compatibility engine
│   │   └── dto/
│   │
│   ├── orders/                    # Order management
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   └── dto/
│   │
│   ├── search/                    # Full-text search
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   └── search.service.ts
│   │
│   ├── admin/                     # Admin-only endpoints
│   │   ├── admin.module.ts
│   │   ├── products/              # Admin product CRUD
│   │   ├── orders/                # Order fulfillment
│   │   └── users/                 # User management
│   │
│   └── health/                    # Health check endpoint
│       └── health.controller.ts
│
├── test/                          # Integration tests
├── package.json
└── tsconfig.json
```

---

## 4. Module Pattern

Every domain follows the same pattern:

```
<domain>/
├── <domain>.module.ts       # Imports providers, exports service
├── <domain>.controller.ts   # Routes → delegates to service
├── <domain>.service.ts      # Business logic → uses DatabaseService
├── <domain>.service.spec.ts # Unit tests
└── dto/
    ├── create-<domain>.dto.ts
    └── update-<domain>.dto.ts
```

**Controller is thin:**
```typescript
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id); // delegate
  }
}
```

**Service owns logic:**
```typescript
@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async findOne(id: string): Promise<Product> {
    const product = await this.db.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }
}
```

---

## 5. Database Access Pattern

All database access goes through `DatabaseService` from `packages/database`.

```typescript
// packages/database/src/database.service.ts
import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class DatabaseService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

Services inject `DatabaseService`, never `PrismaClient` directly.

This is the **single abstraction point** — if PostgreSQL is migrated to Cloud SQL, only the connection string changes.

---

## 6. Authentication & Authorization

### Guards

```
JwtAuthGuard    → Validates access token (default, global)
RolesGuard      → Checks user roles (ADMIN, USER)
@Public()       → Decorator to bypass JwtAuthGuard
```

### Token flow

```
POST /auth/login
  → Returns: { access_token: string }
  → Sets cookie: refresh_token (httpOnly, Secure, SameSite=Strict)

POST /auth/refresh
  → Reads refresh_token cookie
  → Returns new access_token

POST /auth/logout
  → Revokes refresh_token (Redis blocklist)
```

### Role-based access

```typescript
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Post('products')
create(@Body() dto: CreateProductDto) { ... }
```

---

## 7. Validation Pipeline

```
HTTP Request
  → ZodValidationPipe (validates body against Zod schema)
  → Controller method
  → Service logic
  → DatabaseService
```

Zod schemas are imported from `packages/validation` — the same schemas used by frontend forms.

---

## 8. Error Response Format

All errors are handled by a global `HttpExceptionFilter`:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Product abc123 not found",
  "timestamp": "2026-09-07T12:00:00.000Z",
  "path": "/api/v1/products/abc123"
}
```

---

## 9. Response Transformation

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 847
  }
}
```

---

## 10. Compatibility Engine Communication

The `BuildsService` calls the compatibility engine via HTTP:

```typescript
// apps/api/src/builds/builds.service.ts
async checkCompatibility(components: BuildComponents): Promise<CompatibilityResult> {
  const response = await this.httpService.post(
    `${this.configService.get('COMPATIBILITY_ENGINE_URL')}/check`,
    components,
    { headers: { 'x-api-key': this.configService.get('COMPATIBILITY_ENGINE_API_KEY') } }
  );
  return response.data as CompatibilityResult;
}
```

If the compatibility engine is down, the API returns a service unavailable error — builds cannot be validated without it.
