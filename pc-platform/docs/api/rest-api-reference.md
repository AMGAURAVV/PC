# REST API Reference & Endpoint Index — PC Platform

> **Status:** Active | **Base URL:** `/api/v1`  
> **Documentation Index:** Unified API Catalog for Frontend & External Integrations

---

## 1. Global API Conventions

- **Data Format**: `application/json` (UTF-8)
- **Standard Success Envelope**:
  ```json
  {
    "data": { ... },
    "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [{ "field": "email", "message": "Invalid email address format" }],
    "timestamp": "2026-09-10T18:00:00.000Z",
    "path": "/api/v1/auth/register"
  }
  ```
- **Authentication**: `Authorization: Bearer <access_token>`

---

## 2. API Endpoint Matrix

### 2.1 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new customer account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate credentials; returns access & refresh tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate refresh token; returns new token pair |
| `POST` | `/api/v1/auth/logout` | Bearer | Invalidate current refresh token session |
| `GET` | `/api/v1/auth/me` | Bearer | Retrieve authenticated user profile and roles |

---

### 2.2 Products & Catalog (`/api/v1/products`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/products` | Public | Paginated product search with filters (category, brand, price, inStock, specs) |
| `GET` | `/api/v1/products/:id` | Public | Fetch full product details including variants, specifications, images, and prices |
| `GET` | `/api/v1/products/slug/:slug` | Public | Fetch product details by SEO slug |
| `GET` | `/api/v1/products/featured` | Public | Fetch curated featured hardware components |
| `GET` | `/api/v1/products/categories` | Public | List hardware categories with subcategories and product counts |
| `GET` | `/api/v1/products/brands` | Public | List component manufacturers and brand metadata |

---

### 2.3 Custom PC Builder & Compatibility (`/api/v1/builds`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/builds/my` | Bearer | List saved custom PC builds for current user |
| `GET` | `/api/v1/builds/:id` | Optional | Retrieve a specific PC build by ID |
| `POST` | `/api/v1/builds` | Optional | Create or persist a new custom PC build |
| `PUT` | `/api/v1/builds/:id` | Bearer | Update component slots or build configuration |
| `POST` | `/api/v1/builds/validate` | Public | Run live compatibility validation across a component set |
| `POST` | `/api/v1/builds/:id/share` | Bearer | Generate a public shareable link for a build |
| `POST` | `/api/v1/builds/:id/add-to-cart` | Optional | Convert all compatible components in a build to a shopping cart |

---

### 2.4 Shopping Cart (`/api/v1/cart`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/cart` | Optional | Fetch current shopping cart contents, subtotals, discounts, and taxes |
| `POST` | `/api/v1/cart/items` | Optional | Add a product variant or custom build to the cart |
| `PUT` | `/api/v1/cart/items/:id` | Optional | Update quantity of a cart item |
| `DELETE` | `/api/v1/cart/items/:id` | Optional | Remove an item from the cart |
| `POST` | `/api/v1/cart/apply-coupon` | Optional | Apply a promotional coupon code to the cart |
| `DELETE` | `/api/v1/cart/coupon` | Optional | Remove applied coupon from the cart |

---

### 2.5 Orders & Checkout (`/api/v1/orders`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/orders` | Bearer | Fetch order history for the authenticated customer |
| `GET` | `/api/v1/orders/:id` | Bearer | Retrieve order details, items, and tracking status |
| `POST` | `/api/v1/orders/checkout` | Bearer | Initialize order checkout; reserves stock and creates payment order |
| `POST` | `/api/v1/orders/:id/cancel` | Bearer | Request order cancellation prior to shipping |

---

### 2.6 Admin Backoffice API (`/api/v1/admin`)

| Method | Endpoint | Auth | Required Permission | Purpose |
|---|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard` | Bearer | `admin:access` | Aggregated revenue, user counts, and low-stock alerts |
| `POST` | `/api/v1/admin/products` | Bearer | `products:write` | Create a new hardware component with specifications |
| `PUT` | `/api/v1/admin/products/:id` | Bearer | `products:write` | Update component details or pricing |
| `DELETE` | `/api/v1/admin/products/:id` | Bearer | `products:delete` | Soft-delete a hardware component |
| `GET` | `/api/v1/admin/orders` | Bearer | `orders:read` | Paginated administrative order management |
| `PUT` | `/api/v1/admin/orders/:id/status` | Bearer | `orders:write` | Transition order status (`CONFIRMED`, `SHIPPED`, etc.) |
| `GET` | `/api/v1/admin/audit-logs` | Bearer | `audit:read` | Inspect chronological administrative mutation logs |
| `POST` | `/api/v1/admin/coupons` | Bearer | `coupons:write` | Create promotional coupon discount rules |

---

### 2.7 Health & Telemetry (`/api/v1/health`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | Public | Container liveness check probe |
| `GET` | `/api/v1/health/db` | Public | PostgreSQL connection pool readiness check |
