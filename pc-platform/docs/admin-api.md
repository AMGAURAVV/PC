# PC Platform Admin API Documentation

**Version:** 1.0.0  
**Authentication:** Bearer JWT (`Authorization: Bearer <access-token>`)  
**Authorization (RBAC):** Roles required: `admin` or `super_admin`  
**Base URL:** `/api/v1` (or directly via `/admin/...`)

---

## 1. Architecture & Guarantees

### 1.1 Role-Based Access Control (RBAC)
All admin routes are guarded by `@UseGuards(RolesGuard)` and `@Roles('super_admin', 'admin')`.
- Non-authenticated requests receive `401 Unauthorized`.
- Authenticated non-admin users (e.g. `customer`) receive `403 Forbidden`.
- Super-admin-only operations (such as hard deletion or elevated role assignment) can enforce `@Roles('super_admin')`.

### 1.2 Comprehensive Audit Logging
Every single state-mutating operation (create, update, delete, publish, archive, bulk adjust, moderate, cancel, refund) automatically writes an `AuditLog` row:
- **Actor:** `actorId` (UUID) and `actorEmail` extracted from JWT.
- **Action:** `CREATE`, `UPDATE`, `DELETE`, `PUBLISH`, `ARCHIVE`, `SUSPEND`, `ACTIVATE`, `BULK_UPDATE`, `ASSIGN_ROLES`, `ORDER_CANCEL`, `ORDER_REFUND`, `SHIPMENT_DISPATCH`.
- **Target Entity:** `entityType` (`Product`, `Category`, `Brand`, `Inventory`, `Price`, `Order`, `User`, `Review`, `CompatibilityRule`, `BuildTemplate`, `Banner`, `HomepageSection`).
- **Entity ID:** The UUID of the affected record.
- **Entity Label:** Human-readable reference (e.g. product title, brand name, order number, user email).
- **Audit Diff:** Full snapshots stored in JSON columns `before` and `after`.
- **Timestamp:** ISO 8601 recorded automatically.
- **Metadata:** Contextual parameters (bulk operation counters, reasons, tracking numbers).

### 1.3 Optimistic Concurrency Control (OCC)
To prevent lost updates when multiple administrators work concurrently on catalog records:
- Endpoints accept `expectedUpdatedAt` (ISO 8601 timestamp string).
- If the database record's `updatedAt` is newer than `expectedUpdatedAt`, the mutation is aborted and returns `409 Conflict`:
  ```json
  {
    "success": false,
    "statusCode": 409,
    "message": "Product was modified by another administrator. Please refresh before saving.",
    "timestamp": "2026-09-09T03:55:00.000Z",
    "path": "/admin/products/prod-123"
  }
  ```

### 1.4 Safe Destructive Operations & Dependency Protection
Hard deletions of operational entities with dependents are strictly blocked by default:
- **Categories:** Cannot be deleted if assigned products or subcategories exist. Must reassign or delete sub-entities first, or explicitly supply query parameter `?force=true`.
- **Brands:** Cannot be deleted if products are associated with the brand.
- **Products:** If a product exists in historical `orderItem` records, `DELETE /admin/products/:id` performs a non-destructive **soft-archive** (`isActive: false`, `isDraft: true`) instead of hard deletion to maintain order integrity.
- **Users:** Users with order history cannot be hard deleted.

### 1.5 Draft / Published Lifecycle States
- **Draft (`isDraft: true`, `isActive: false`):** Work-in-progress products or content invisible to customers.
- **Published (`isDraft: false`, `isActive: true`):** Live in customer catalog. Requires at least one active price tier (`400 Bad Request` if unpriced).
- **Archived (`isActive: false`):** Deprecated or retired parts hidden from public storefronts.

### 1.6 Bulk Operations
Batch endpoints accept an array of identifiers and process them safely. Instead of all-or-nothing failure, they return a standardized `BulkOperationResultDto`:
```json
{
  "totalRequested": 10,
  "successCount": 9,
  "failureCount": 1,
  "errors": [
    { "id": "prod-bad", "error": "Cannot publish product without at least one active price" }
  ]
}
```

---

## 2. API Reference

### 2.1 Dashboard & KPI Metrics

#### `GET /admin/dashboard` or `GET /admin/dashboard/metrics`
Returns aggregate business metrics across orders, revenue, inventory alerts, products, and users.
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": {
      "revenue": 524900.50,
      "orders": {
        "total": 1420,
        "recent": [...]
      },
      "products": {
        "total": 350,
        "published": 310,
        "draft": 40
      },
      "inventory": {
        "lowStockCount": 12,
        "outOfStockCount": 3
      },
      "users": {
        "total": 2890
      },
      "reviews": {
        "pendingModeration": 7
      },
      "recentActivity": [...]
    }
  }
  ```

---

### 2.2 Products Management (`/admin/products`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/products` | Paginated product list with search, status, component type, brand, and stock filters |
| `GET` | `/admin/products/:id` | Full admin product record with variants, images, specs, inventory, prices |
| `POST` | `/admin/products` | Create product (supports draft/published, prices, warehouse stock) |
| `PATCH` | `/admin/products/:id` | Update product with optimistic concurrency (`expectedUpdatedAt`) |
| `PATCH` | `/admin/products/:id/publish` | Make product live (verifies active price exists) |
| `PATCH` | `/admin/products/:id/archive` | Deactivate product from live storefront |
| `PATCH` | `/admin/products/:id/draft` | Revert product to draft status |
| `DELETE` | `/admin/products/:id` | Safely soft-archive or hard delete product |
| `POST` | `/admin/products/bulk/status` | Batch change status (`PUBLISH`, `ARCHIVE`, `DRAFT`, `FEATURE`, `UNFEATURE`) |
| `POST` | `/admin/products/bulk/delete` | Batch safe delete products |
| `POST` | `/admin/products/:id/variants` | Add SKU variant (e.g. color, capacity, clock speed) |
| `PATCH` | `/admin/products/:id/variants/:variantId` | Update variant details and active state |
| `POST` | `/admin/products/:id/images` | Upload image metadata, alt text, and sort order |
| `PATCH` | `/admin/products/:id/images/:imageId` | Set primary image or reorder |
| `DELETE` | `/admin/products/:id/images/:imageId` | Remove product image |
| `PUT` | `/admin/products/:id/specifications` | Upsert structured component specifications (CPU, GPU, RAM, etc.) |

#### Create Product Example
`POST /admin/products`
```json
{
  "name": "AMD Ryzen 7 7800X3D",
  "slug": "amd-ryzen-7-7800x3d",
  "sku": "100-100000910WOF",
  "barcode": "730143314930",
  "description": "8-core gaming processor with 3D V-Cache technology.",
  "shortDescription": "The ultimate gaming processor.",
  "componentType": "CPU",
  "brandId": "brand-amd-uuid",
  "basePrice": 449.99,
  "compareAtPrice": 499.99,
  "currency": "INR",
  "initialStock": 25,
  "isDraft": false,
  "isActive": true,
  "tags": ["gaming", "am5", "x3d"],
  "categoryIds": ["cat-cpu-uuid"]
}
```

---

### 2.3 Categories Management (`/admin/categories`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/categories` | List hierarchical category tree with product counts |
| `GET` | `/admin/categories/:id` | Get single category with parent and subcategories |
| `POST` | `/admin/categories` | Create category with parent nesting and metadata |
| `PATCH` | `/admin/categories/:id` | Update category attributes |
| `DELETE` | `/admin/categories/:id` | Safe delete (blocks if products or subcategories exist) |
| `POST` | `/admin/categories/reorder` | Update display order of categories |

---

### 2.4 Brands Management (`/admin/brands`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/brands` | List brands with search and product count |
| `GET` | `/admin/brands/:id` | Get brand details and associated products |
| `POST` | `/admin/brands` | Create brand (name, logo, website, country) |
| `PATCH` | `/admin/brands/:id` | Update brand details |
| `DELETE` | `/admin/brands/:id` | Safe delete (blocks if assigned products exist) |

---

### 2.5 Inventory & Warehouse Management (`/admin/inventory`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/inventory` | List stock levels with `lowStockOnly` and `outOfStockOnly` filters |
| `GET` | `/admin/inventory/product/:productId` | Breakdown of warehouse stock across variants |
| `POST` | `/admin/inventory/adjust` | Adjust stock delta (`RESTOCK`, `CORRECTION`, `DAMAGE`, `RETURN`) |
| `POST` | `/admin/inventory/bulk-adjust` | Batch adjust stock across multiple items |
| `PATCH` | `/admin/inventory/:id/threshold` | Update low stock alert threshold |

#### Adjust Stock Example
`POST /admin/inventory/adjust`
```json
{
  "productId": "prod-cpu-1",
  "quantityDelta": 10,
  "type": "RESTOCK",
  "reason": "PO-2026-09 shipment received"
}
```

---

### 2.6 Prices & Price History (`/admin/prices`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/prices` | Create price tier (`RETAIL`, `SALE`, `WHOLESALE`) |
| `PATCH` | `/admin/prices/:id` | Update price (automatically logs `PriceHistory`) |
| `POST` | `/admin/prices/bulk-update` | Batch update prices by percentage or fixed delta |
| `GET` | `/admin/prices/history` | Query audit trail of price changes by product or date |

#### Bulk Price Update Example
`POST /admin/prices/bulk-update`
```json
{
  "productIds": ["prod-gpu-1", "prod-gpu-2"],
  "adjustmentType": "PERCENTAGE",
  "adjustmentValue": -5,
  "reason": "Weekend Flash Sale promotion"
}
```

---

### 2.7 Compatibility Rules (`/admin/compatibility-rules`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/compatibility-rules` | Query compatibility rules with ruleType and severity filters |
| `GET` | `/admin/compatibility-rules/:id` | Get rule with its condition tree |
| `POST` | `/admin/compatibility-rules` | Author compatibility rule with condition evaluation logic |
| `PATCH` | `/admin/compatibility-rules/:id` | Update rule parameters or severity |
| `DELETE` | `/admin/compatibility-rules/:id` | Remove compatibility rule |
| `PATCH` | `/admin/compatibility-rules/:id/toggle` | Quickly enable/disable rule |

#### Create Rule Example
`POST /admin/compatibility-rules`
```json
{
  "name": "AM5 Socket DDR5 Requirement",
  "description": "AMD Socket AM5 motherboards only support DDR5 memory",
  "ruleType": "MEMORY_TYPE_MATCH",
  "severity": "ERROR",
  "priority": 10,
  "conditions": [
    {
      "conditionIndex": 0,
      "componentType": "MOTHERBOARD",
      "attributePath": "motherboardSpec.socketType",
      "operator": "EQUALS",
      "value": "AM5",
      "targetComponentType": "RAM",
      "targetAttributePath": "ramSpec.ddrGeneration"
    }
  ]
}
```

---

### 2.8 PC Build Templates (`/admin/build-templates`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/build-templates` | List build templates (budget, tier, featured status) |
| `GET` | `/admin/build-templates/:id` | Get full build template and component slot configuration |
| `POST` | `/admin/build-templates` | Create curated template with component items |
| `PATCH` | `/admin/build-templates/:id` | Update template specs or pricing targets |
| `DELETE` | `/admin/build-templates/:id` | Remove template |
| `PATCH` | `/admin/build-templates/:id/toggle` | Toggle active/featured state |

---

### 2.9 Discount Coupons (`/admin/coupons`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/coupons` | List coupons with redemption counts and date filters |
| `GET` | `/admin/coupons/:id` | Get coupon details and redemption history |
| `POST` | `/admin/coupons` | Create coupon (`PERCENTAGE` or `FIXED`, max redemptions, min spend) |
| `PATCH` | `/admin/coupons/:id` | Update coupon rules or validity window |
| `DELETE` | `/admin/coupons/:id` | Deactivate/delete coupon |
| `POST` | `/admin/coupons/bulk/status` | Batch activate/deactivate coupons |

---

### 2.10 Orders Management (`/admin/orders`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/orders` | Search orders by status, user, order number, or date range |
| `GET` | `/admin/orders/:id` | Get complete order dossier (items, shipping, payments, events) |
| `PATCH` | `/admin/orders/:id/status` | Advance status (`PROCESSING`, `SHIPPED`, `DELIVERED`) with notes |
| `POST` | `/admin/orders/:id/cancel` | Cancel order with optional inventory restocking |
| `POST` | `/admin/orders/:id/refund` | Issue full or partial refund and update payment status |

---

### 2.11 Users & Role Management (`/admin/users`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/users` | List users with role, status (`ACTIVE`, `SUSPENDED`), and search |
| `GET` | `/admin/users/:id` | Get user profile and past order metrics |
| `PATCH` | `/admin/users/:id/status` | Update account status (e.g. `SUSPENDED` with reason) |
| `PATCH` | `/admin/users/:id/roles` | Assign security roles (`admin`, `super_admin`, `customer`) |
| `POST` | `/admin/users/bulk/status` | Batch suspend or activate users |
| `DELETE` | `/admin/users/:id` | Safe delete user (blocked if order history exists) |

---

### 2.12 Customer Reviews Moderation (`/admin/reviews`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/reviews` | Moderation queue with status filters (`PENDING`, `APPROVED`, `REJECTED`) |
| `GET` | `/admin/reviews/:id` | Get review details, verified buyer status, product context |
| `PATCH` | `/admin/reviews/:id/moderate` | Approve or reject review with moderator note |
| `POST` | `/admin/reviews/bulk/moderate` | Batch approve or reject reviews |
| `DELETE` | `/admin/reviews/:id` | Delete toxic or fraudulent review |

---

### 2.13 CMS Banners, Homepage Sections & Featured Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/banners` | List banners by position (`HERO`, `PROMO`, `SIDEBAR`) |
| `POST` | `/admin/banners` | Create banner slide with image, target URL, and active dates |
| `PATCH` | `/admin/banners/:id` | Update banner |
| `DELETE` | `/admin/banners/:id` | Remove banner slide |
| `GET` | `/admin/homepage/sections` | Get layout configuration of homepage sections |
| `POST` | `/admin/homepage/sections` | Add layout section (product grid, banner slider, etc.) |
| `PATCH` | `/admin/homepage/sections/:id` | Reorder or reconfigure homepage section |
| `DELETE` | `/admin/homepage/sections/:id` | Remove homepage section |
| `GET` | `/admin/featured-products` | Get currently featured spotlight products |
| `POST` | `/admin/featured-products` | Curate and set list of featured products |

---

### 2.14 Platform Audit Logs (`/admin/audit-logs`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/admin/audit-logs` | Query mutation audit logs with pagination and filters |
| `GET` | `/admin/audit-logs/:id` | Get full audit log with before/after state diff snapshots |

#### Query Parameters
- `actorId` (string): Filter by administrator user UUID
- `action` (string): Filter by action (`CREATE`, `UPDATE`, `DELETE`, etc.)
- `entityType` (string): Filter by target entity (`Product`, `Order`, `Category`, etc.)
- `entityId` (string): Filter by specific entity UUID
- `startDate` (ISO 8601): Start of date range
- `endDate` (ISO 8601): End of date range
- `search` (string): Search in entity label or actor email
- `page` (number, default 1)
- `limit` (number, default 20, max 100)
