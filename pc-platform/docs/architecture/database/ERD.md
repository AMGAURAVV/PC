# PC Platform — Database ERD & Schema Documentation

> **Schema Version**: 2.0.0
> **Engine**: PostgreSQL 16
> **ORM**: Prisma 5.x
> **File**: `packages/database/prisma/schema.prisma`

---

## Domain Overview

| Domain | Tables | Purpose |
|---|---|---|
| **Auth & Users** | users, roles, permissions, user_roles, role_permissions, refresh_tokens, user_addresses | Authentication, RBAC, user profiles |
| **Products** | brands, categories, products, product_categories, product_variants, product_images, product_specifications, component_type_defs, component_spec_definitions | Catalog management |
| **Component Specs** | cpu_specs, gpu_specs, motherboard_specs, ram_specs, storage_specs, psu_specs, case_specs, cooler_specs, fan_specs, monitor_specs, peripheral_specs | Normalized hardware specifications |
| **Inventory & Pricing** | suppliers, inventory, prices, price_history | Multi-supplier stock and pricing |
| **Builds** | builds, build_items, saved_builds, build_versions, shared_build_links, build_templates | PC configurator |
| **Compatibility** | compatibility_rules, compatibility_rule_conditions, compatibility_rule_results, compatibility_warnings, power_requirements, physical_dimensions | Rule-based compatibility data |
| **Commerce** | coupons, coupon_usages, carts, cart_items | Pre-order commerce |
| **Orders** | orders, order_items, payments, shipments, shipment_events | Order lifecycle |
| **UGC & Admin** | reviews, review_images, wishlists, wishlist_items, audit_logs | Social features & audit trail |

**Total: 50 tables**

---

## ERD Diagrams

### Auth & Users Domain

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        enum status
        bool is_verified
        datetime deleted_at
        datetime created_at
        datetime updated_at
    }
    roles {
        uuid id PK
        string name UK
        bool is_system
    }
    permissions {
        uuid id PK
        string action UK
        string module
    }
    user_roles {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
    }
    role_permissions {
        uuid id PK
        uuid role_id FK
        uuid permission_id FK
    }
    refresh_tokens {
        uuid id PK
        uuid user_id FK
        string token_hash UK
        datetime expires_at
        datetime revoked_at
    }
    user_addresses {
        uuid id PK
        uuid user_id FK
        enum type
        string line1
        string city
        string postal_code
        bool is_default
        datetime deleted_at
    }

    users ||--o{ user_roles : "has"
    roles ||--o{ user_roles : "assigned via"
    roles ||--o{ role_permissions : "has"
    permissions ||--o{ role_permissions : "granted via"
    users ||--o{ refresh_tokens : "owns"
    users ||--o{ user_addresses : "has"
```

### Product Catalog Domain

```mermaid
erDiagram
    brands {
        uuid id PK
        string name UK
        string slug UK
        bool is_active
    }
    categories {
        uuid id PK
        string name
        string slug UK
        uuid parent_id FK
        bool is_active
    }
    products {
        uuid id PK
        string name
        string slug UK
        string sku UK
        uuid brand_id FK
        enum component_type
        bool is_active
        datetime deleted_at
    }
    product_categories {
        uuid id PK
        uuid product_id FK
        uuid category_id FK
        bool is_primary
    }
    product_variants {
        uuid id PK
        uuid product_id FK
        string sku UK
        json attributes
    }
    product_images {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        string url
        bool is_primary
    }
    product_specifications {
        uuid id PK
        uuid product_id FK
        string key
        string value
        string unit
        string group_key
    }

    brands ||--o{ products : "makes"
    categories ||--o{ product_categories : "groups"
    products ||--o{ product_categories : "in"
    products ||--o{ product_variants : "has"
    products ||--o{ product_images : "has"
    products ||--o{ product_specifications : "described by"
    product_variants ||--o{ product_images : "has"
    categories ||--o| categories : "parent"
```

### Component Spec Tables (1:1 per product)

```mermaid
erDiagram
    products {
        uuid id PK
        enum component_type
    }
    cpu_specs {
        uuid id PK
        uuid product_id FK-UK
        string socket_type
        int cores
        int threads
        int tdp_w
        string memory_type
        bool has_igpu
    }
    gpu_specs {
        uuid id PK
        uuid product_id FK-UK
        int vram_gb
        int tdp_w
        string power_connectors
        int length_mm
        bool has_raytracing
    }
    motherboard_specs {
        uuid id PK
        uuid product_id FK-UK
        string socket_type
        string form_factor
        string[] supported_mem_types
        int ram_slots
        int max_ram_gb
        bool has_wifi
    }
    ram_specs {
        uuid id PK
        uuid product_id FK-UK
        string mem_type
        int total_capacity_gb
        int speed_mhz
    }
    storage_specs {
        uuid id PK
        uuid product_id FK-UK
        string storage_type
        int capacity_gb
        string interface
        string form_factor
        int seq_read_mbps
    }
    psu_specs {
        uuid id PK
        uuid product_id FK-UK
        int wattage
        string efficiency_rating
        string modular
    }
    case_specs {
        uuid id PK
        uuid product_id FK-UK
        string[] supported_form_factors
        int max_gpu_length_mm
        int max_cpu_cooler_height_mm
    }
    cooler_specs {
        uuid id PK
        uuid product_id FK-UK
        string cooler_type
        string[] supported_sockets
        int tdp_rating_w
        int height_mm
    }

    products ||--o| cpu_specs : "has"
    products ||--o| gpu_specs : "has"
    products ||--o| motherboard_specs : "has"
    products ||--o| ram_specs : "has"
    products ||--o| storage_specs : "has"
    products ||--o| psu_specs : "has"
    products ||--o| case_specs : "has"
    products ||--o| cooler_specs : "has"
```

### Inventory & Pricing Domain

```mermaid
erDiagram
    suppliers {
        uuid id PK
        string name UK
        string code UK
        bool is_platform
    }
    inventory {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        uuid supplier_id FK
        int quantity
        int reserved_qty
        int low_stock_threshold
    }
    prices {
        uuid id PK
        uuid product_id FK
        uuid variant_id FK
        enum price_type
        decimal amount
        string currency
        decimal compare_at
        bool is_active
    }
    price_history {
        uuid id PK
        uuid product_id FK
        enum price_type
        decimal amount
        string currency
        string changed_by
        string reason
        datetime created_at
    }

    suppliers ||--o{ inventory : "holds"
    products ||--o{ inventory : "tracked in"
    products ||--o{ prices : "priced via"
    products ||--o{ price_history : "logged in"
```

### Build Domain

```mermaid
erDiagram
    builds {
        uuid id PK
        uuid user_id FK
        string name
        enum status
        bool is_public
        decimal total_price_cache
        datetime deleted_at
    }
    build_items {
        uuid id PK
        uuid build_id FK
        uuid product_id FK
        enum component_type
        int quantity
        decimal price_snapshot
    }
    saved_builds {
        uuid id PK
        uuid user_id FK
        uuid build_id FK
    }
    build_versions {
        uuid id PK
        uuid build_id FK
        int version_number
        string label
        json snapshot
    }
    shared_build_links {
        uuid id PK
        uuid build_id FK
        string token UK
        datetime expires_at
        bool is_active
    }
    build_templates {
        uuid id PK
        string slug UK
        string category
        json items
        bool is_featured
    }

    users ||--o{ builds : "creates"
    builds ||--o{ build_items : "contains"
    products ||--o{ build_items : "added to"
    users ||--o{ saved_builds : "bookmarks"
    builds ||--o{ saved_builds : "bookmarked as"
    builds ||--o{ build_versions : "versioned via"
    builds ||--o{ shared_build_links : "shared via"
```

### Compatibility Domain

```mermaid
erDiagram
    compatibility_rules {
        uuid id PK
        string name UK
        enum rule_type
        enum severity
        bool is_active
        int priority
    }
    compatibility_rule_conditions {
        uuid id PK
        uuid rule_id FK
        int condition_index
        enum component_type
        string attribute_path
        string operator
        string literal_value
    }
    compatibility_rule_results {
        uuid id PK
        uuid rule_id FK-UK
        string title
        string message
        string suggestion
    }
    compatibility_warnings {
        uuid id PK
        string build_id
        uuid rule_id FK
        enum severity
        string message
        datetime resolved_at
    }
    power_requirements {
        uuid id PK
        uuid product_id FK-UK
        int idle_w
        int typical_w
        int peak_w
    }
    physical_dimensions {
        uuid id PK
        uuid product_id FK-UK
        decimal length_mm
        decimal width_mm
        decimal height_mm
        decimal weight_g
    }

    compatibility_rules ||--o{ compatibility_rule_conditions : "has"
    compatibility_rules ||--o| compatibility_rule_results : "produces"
    compatibility_rules ||--o{ compatibility_warnings : "generates"
    products ||--o| power_requirements : "has"
    products ||--o| physical_dimensions : "has"
```

### Commerce & Order Domain

```mermaid
erDiagram
    carts {
        uuid id PK
        uuid user_id FK
        string session_token UK
        string currency
    }
    cart_items {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity
    }
    orders {
        uuid id PK
        string order_number UK
        uuid user_id FK
        uuid coupon_id FK
        enum status
        decimal total
        string currency
    }
    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name
        string sku
        int quantity
        decimal unit_price
    }
    payments {
        uuid id PK
        uuid order_id FK
        enum provider
        enum status
        decimal amount
        datetime paid_at
    }
    shipments {
        uuid id PK
        uuid order_id FK
        string tracking_number UK
        enum status
        datetime delivered_at
    }
    shipment_events {
        uuid id PK
        uuid shipment_id FK
        enum status
        string location
        datetime occurred_at
    }

    users ||--o{ carts : "owns"
    carts ||--o{ cart_items : "contains"
    users ||--o{ orders : "places"
    orders ||--o{ order_items : "contains"
    orders ||--o{ payments : "paid via"
    orders ||--o{ shipments : "shipped via"
    shipments ||--o{ shipment_events : "tracked via"
```

---

## Table Explanations

### Auth & Users

| Table | Purpose | Key Design |
|---|---|---|
| `users` | User accounts | Soft-delete via `deleted_at`; `status` enum |
| `roles` | RBAC roles | `is_system=true` rows cannot be deleted |
| `permissions` | Granular permissions | Format: `module:action` |
| `user_roles` | M2M users ↔ roles | Unique constraint prevents duplicates |
| `role_permissions` | M2M roles ↔ permissions | Cascade delete with role |
| `refresh_tokens` | JWT refresh token store | Stores SHA-256 hash only |
| `user_addresses` | Shipping addresses | Soft-delete; `is_default` flag |

### Products

| Table | Purpose | Key Design |
|---|---|---|
| `brands` | Normalized brands | Separate entity to avoid string duplication |
| `categories` | Category tree | Self-referential `parent_id` |
| `products` | Master product record | No price/stock — delegated to `prices`/`inventory` |
| `product_categories` | M2M products ↔ categories | `is_primary` flag for main category |
| `product_variants` | SKU-level variants | `attributes` JSON for flexible dimensions |
| `product_images` | Images | `is_primary`, `sort_order`, optional `variant_id` |
| `product_specifications` | EAV generic specs | Filter/search across all component types |

### Normalized Spec Tables

Each is a **1:1 optional** extension of `products`. Only the table matching `component_type` is populated.

| Table | Component | Key Columns for Compatibility |
|---|---|---|
| `cpu_specs` | CPU | `socket_type`, `tdp_w`, `memory_type` |
| `gpu_specs` | GPU | `tdp_w`, `length_mm`, `power_connectors` |
| `motherboard_specs` | MOTHERBOARD | `socket_type`, `form_factor`, `supported_mem_types[]`, `max_ram_gb` |
| `ram_specs` | RAM | `mem_type`, `total_capacity_gb`, `speed_mhz` |
| `storage_specs` | STORAGE | `interface`, `form_factor`, `capacity_gb` |
| `psu_specs` | PSU | `wattage`, `efficiency_rating`, `pcie_connectors` |
| `case_specs` | CASE | `supported_form_factors[]`, `max_gpu_length_mm`, `max_cpu_cooler_height_mm` |
| `cooler_specs` | COOLER | `supported_sockets[]`, `tdp_rating_w`, `height_mm` |
| `fan_specs` | FAN | `size_mm`, `max_rpm`, `is_pwm` |
| `monitor_specs` | MONITOR | `refresh_rate_hz`, `panel_type`, `adaptive_sync_type` |
| `peripheral_specs` | KEYBOARD/MOUSE/etc. | `peripheral_type`, `connectivity[]`, `switch_type` |

### Compatibility (Data-Only)

> No DB triggers. The `compatibility-engine` service reads rules at runtime.

| Table | Purpose |
|---|---|
| `compatibility_rules` | Named rule with type, severity, priority |
| `compatibility_rule_conditions` | `attribute_path` + `operator` + reference or literal value |
| `compatibility_rule_results` | Error message template with `{{CPU.socketType}}` placeholders |
| `compatibility_warnings` | Per-build evaluated warnings stored for display |
| `power_requirements` | Per-product TDP data |
| `physical_dimensions` | Per-product size data |

---

## Indexing Strategy

| Query Pattern | Index |
|---|---|
| Products by brand | `products(brand_id)` |
| Products by component type | `products(component_type)` |
| Active products | `products(is_active)` |
| Products by slug | `products(slug)` |
| Products in category | `product_categories(category_id)` |
| User orders | `orders(user_id)` |
| Orders by status | `orders(status)` |
| Order timeline | `orders(created_at)` |
| Order by number | `orders(order_number)` |
| User cart | `carts(user_id)`, `carts(session_token)` |
| Current prices | `prices(product_id)`, `prices(is_active)` |
| Inventory by product | `inventory(product_id)` |
| Low stock | `inventory(quantity)` |
| Active compat rules | `compatibility_rules(is_active)` |
| Build warnings | `compatibility_warnings(build_id)` |
| User builds | `builds(user_id)` |
| Public builds | `builds(is_public)` |
| Reviews by product | `reviews(product_id)` |
| Audit log | `audit_logs(entity_type, entity_id)`, `audit_logs(created_at)` |

---

## Unique Constraints

| Constraint | Table | Purpose |
|---|---|---|
| `email` | `users` | One account per email |
| `slug`, `sku` | `products` | URL and catalog uniqueness |
| `sku` | `product_variants` | Variant uniqueness |
| `order_number` | `orders` | Human-readable order ID |
| `provider_payment_id` | `payments` | Idempotent payment processing |
| `tracking_number` | `shipments` | Tracking deduplication |
| `token_hash` | `refresh_tokens` | Token lookup |
| `(product_id, variant_id, price_type, currency)` | `prices` | One price per type/currency |
| `(product_id, variant_id, supplier_id)` | `inventory` | One stock row per supplier |
| `(product_id, user_id)` | `reviews` | One review per user per product |
| `(build_id, version_number)` | `build_versions` | Ordered history |
| `token` | `shared_build_links` | Unique share tokens |

---

## Soft Delete Strategy

| Model | Reason |
|---|---|
| `users` | Order history remains queryable |
| `products` | Order item snapshots reference product IDs |
| `builds` | Users may restore deleted builds |
| `user_addresses` | Past orders reference address IDs |
| `brands` | Referenced by products |
| `categories` | Referenced by product categories |
| `reviews` | Moderation audit trail |

Application queries must filter `WHERE deleted_at IS NULL`.

---

## Future Expansion Notes

### Multi-Currency
- `prices` table has `currency VARCHAR` (ISO 4217)
- Unique constraint includes currency → add new row per currency, no schema change

### Multi-Merchant
- `inventory` has `supplier_id FK` per row
- Multiple suppliers can hold stock for the same product variant
- `price_history` optionally references supplier

### Google Cloud SQL Deployment
```bash
# Production migration (no prompts, no schema drift check)
pnpm --filter @pc-platform/database migrate:deploy

# Connection string format for Cloud SQL
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&sslmode=require"
```

