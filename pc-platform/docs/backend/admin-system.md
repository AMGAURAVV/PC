# Admin System Architecture — PC Platform

> **Status:** Active | **Module:** `apps/api/src/admin` & `apps/admin`  
> **Tech Stack:** NestJS 10, Next.js 14, TanStack Query, RBAC Permissions, Prisma ORM

---

## 1. Module Overview & Responsibilities

The **Admin System** provides unified operational control over the PC Platform. It spans the dedicated Next.js backoffice portal (`apps/admin`) and the administrative backend module (`apps/api/src/admin`).

### Core Responsibilities:
1. **Catalog & Specification Management**: Creation, updating, categorization, specification mapping, and soft-deletion of hardware components.
2. **Pricing & Currency Control**: Managing multiple price tiers (`RETAIL`, `SALE`, `COST`, `WHOLESALE`), scheduling sale dates, and bulk price updates.
3. **Inventory & Warehouse Tracking**: Stock allocation, low-stock threshold alerting, supplier tracking, and warehouse adjustment logging.
4. **Order Fulfillment & Lifecycle Transitions**: Inspecting orders, updating shipping statuses, capturing payments, issuing refunds, and viewing audit histories.
5. **User & Access Control (RBAC)**: Role definition, granular permission assignments, suspending malicious accounts, and MFA requirements.
6. **Promotions & Coupon Engine**: Creating discount codes (percentage, fixed amount, free shipping), usage limits, and minimum cart thresholds.
7. **Comprehensive Audit Logging**: Immutable chronological recording of every administrative mutation (`AuditAction`: `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `LOGIN`, etc.).

---

## 2. Technical Specification & Module Contracts

| Dimension | Specification |
|---|---|
| **Purpose** | Empower staff to manage catalog, commerce, users, and operational workflows securely with strict role-based authorization. |
| **Responsibilities** | Admin authentication, permission checking, CRUD operations on operational entities, audit log recording, aggregate dashboard reporting. |
| **Inputs** | Admin HTTP requests containing Bearer JWT with `ADMIN` role claim, JSON payloads for catalog/pricing updates, query parameters for search/filtering. |
| **Outputs** | Operational JSON resources, paginated tables, CSV exports, aggregated analytics summaries (revenue, order counts, user growth). |
| **Dependencies** | `@pc-platform/database`, `@pc-platform/types`, `@pc-platform/validation`, `AuthModule`, `ProductsModule`, `OrdersModule`. |
| **Database Tables** | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `audit_logs`, `products`, `prices`, `inventory`, `orders`, `coupons`. |
| **API Endpoints** | Base prefix `/api/v1/admin` serving `/dashboard`, `/products`, `/prices`, `/inventory`, `/orders`, `/users`, `/coupons`, `/audit-logs`, `/community`. |

---

## 3. Security & Access Control Architecture (RBAC)

Every administrative route is guarded by multiple authorization layers:

```
                  Incoming Admin HTTP Request
                              │
                              ▼
                   [ JwtAuthGuard ]
             Validates signature & expiration
                              │
                              ▼
                   [ RolesGuard ]
             Requires User.role === 'ADMIN'
                              │
                              ▼
                [ PermissionsGuard ]
   Checks specific privilege (e.g. 'products:write', 'orders:refund')
                              │
                              ▼
                 Admin Controller Execution
                              │
                              ▼
            AuditLogService.logAction(...)
```

### 3.1 Audit Logging Standard
Every mutating administrative action automatically writes to the `audit_logs` table:
```typescript
await this.auditLogService.log({
  userId: adminUser.id,
  action: AuditAction.UPDATE,
  entityType: 'Product',
  entityId: productId,
  before: oldProductState,
  after: newProductState,
  metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
});
```

---

## 4. Failure Modes & Resilience Patterns

| Failure Scenario | Impact | Mitigation / Resilience Pattern |
|---|---|---|
| **Unauthorized Access Attempt** | Non-admin user attempts access | `RolesGuard` rejects immediately with `403 Forbidden` and logs a security alert. |
| **Concurrent Admin Edit Conflict** | Two admins edit the same product concurrently | Optimistic locking via `updatedAt` timestamp comparison prevents silent overwrite. |
| **Privilege Escalation Attempt** | Admin user attempts to grant themselves super-admin privileges | Role assignment endpoints require explicit `users:manage_roles` permission. Super-admin role can only be altered by existing super-admins. |
| **Audit Logging Failure** | Audit log write fails during admin mutation | Admin mutations and audit log writes are bound within the same database transaction (`this.db.$transaction`). If logging fails, the mutation rolls back. |

---

## 5. Testing Approach

- **Integration Testing**:
  - `apps/api/src/admin/admin.integration.spec.ts`: Validates authentication guards, role enforcement, product creation, coupon management, and audit log generation.
- **Unit Testing**:
  - Service unit tests in `apps/api/src/admin/services/*.spec.ts`.
- **E2E Backoffice Tests**:
  - Playwright browser testing verifying administrative login, product creation, and price updating in `tests/e2e/admin.spec.ts`.

---

## 6. How to Modify Safely

1. **Adding a New Admin Feature**:
   - Define new permissions in `RolePermission` enum / seed in `packages/database`.
   - Create controller in `apps/api/src/admin/controllers/admin-<feature>.controller.ts`.
   - Protect with `@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)` and `@RequirePermissions('<feature>:read')`.
   - Always invoke `AuditLogService` for create, update, or delete operations.
   - Build corresponding page in `apps/admin/src/app/<feature>/page.tsx`.
