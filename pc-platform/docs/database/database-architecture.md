# Database Architecture — PC Platform

> Status: Active | Last Updated: 2026-09

---

## 1. Overview

The platform uses **PostgreSQL 16** as its primary database, accessed exclusively through **Prisma ORM**. The entire database layer is encapsulated in `packages/database` — no other package connects to PostgreSQL directly.

---

## 2. Key Design Principles

1. **Single access point** — only `packages/database` imports `@prisma/client`
2. **Migrations as code** — every schema change is a Prisma migration file, committed to the repo
3. **Cloud-portable** — changing `DATABASE_URL` is sufficient to move to Google Cloud SQL, Supabase, Railway, or any PostgreSQL provider
4. **Seed-first design** — the database has a seed script that populates categories, sample products, and an admin user
5. **No raw SQL in application code** — use Prisma's query builder; raw SQL only in performance-critical migrations if needed

---

## 3. Database Package Structure

```
packages/database/
├── prisma/
│   ├── schema.prisma            # Single schema file — source of truth
│   ├── migrations/              # Auto-generated migration history
│   │   └── <timestamp>_<name>/
│   │       └── migration.sql
│   └── seed.ts                  # Seed script (pnpm db:seed)
│
├── src/
│   ├── index.ts                 # Package exports
│   └── database.service.ts     # PrismaService (NestJS injectable)
│
├── package.json
└── tsconfig.json
```

---

## 4. Schema Design

### Core Entities

```prisma
// packages/database/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── Enums ────────────────────────────────────────────────────

enum Role {
  USER
  ADMIN
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum ComponentCategory {
  CPU
  MOTHERBOARD
  RAM
  GPU
  STORAGE
  PSU
  CASE
  COOLING
  MONITOR
  PERIPHERALS
  OS
}

// ── Users ────────────────────────────────────────────────────

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String    @map("password_hash")
  firstName    String    @map("first_name")
  lastName     String    @map("last_name")
  role         Role      @default(USER)
  isVerified   Boolean   @default(false) @map("is_verified")
  addresses    Address[]
  orders       Order[]
  builds       Build[]
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  @@map("users")
}

model Address {
  id         String  @id @default(cuid())
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String  @map("user_id")
  line1      String
  line2      String?
  city       String
  state      String
  pincode    String
  isDefault  Boolean @default(false) @map("is_default")

  @@map("addresses")
}

// ── Products ─────────────────────────────────────────────────

model Category {
  id          String     @id @default(cuid())
  name        String
  slug        String     @unique
  description String?
  parentId    String?    @map("parent_id")
  parent      Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  products    Product[]
  createdAt   DateTime   @default(now()) @map("created_at")

  @@map("categories")
}

model Product {
  id                String            @id @default(cuid())
  name              String
  slug              String            @unique
  description       String
  shortDescription  String?           @map("short_description")
  price             Decimal           @db.Decimal(10, 2)
  compareAtPrice    Decimal?          @db.Decimal(10, 2) @map("compare_at_price")
  sku               String            @unique
  stock             Int               @default(0)
  isActive          Boolean           @default(true) @map("is_active")
  isFeatured        Boolean           @default(false) @map("is_featured")
  category          Category          @relation(fields: [categoryId], references: [id])
  categoryId        String            @map("category_id")
  componentCategory ComponentCategory @map("component_category")
  brand             String
  model             String
  specifications    Json              // Component-specific specs (socket, TDP, etc.)
  images            ProductImage[]
  buildItems        BuildItem[]
  orderItems        OrderItem[]
  compatSpecs       ComponentSpec?    // Structured compatibility data
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")

  @@index([categoryId])
  @@index([componentCategory])
  @@index([isActive])
  @@map("products")
}

model ProductImage {
  id        String  @id @default(cuid())
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String  @map("product_id")
  url       String
  alt       String?
  position  Int     @default(0)

  @@map("product_images")
}

model ComponentSpec {
  id                String   @id @default(cuid())
  product           Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId         String   @unique @map("product_id")
  socketType        String?  @map("socket_type")        // AM5, LGA1700
  formFactor        String?  @map("form_factor")         // ATX, mATX, ITX
  tdp               Int?                                 // Watts
  ramType           String?  @map("ram_type")            // DDR5, DDR4
  ramSlots          Int?     @map("ram_slots")
  maxRamGb          Int?     @map("max_ram_gb")
  storageInterface  String?  @map("storage_interface")  // M.2, SATA
  powerConnector    String?  @map("power_connector")
  wattage           Int?                                 // For PSUs
  pcieSlots         Int?     @map("pcie_slots")
  maxGpuLength      Int?     @map("max_gpu_length")     // mm

  @@map("component_specs")
}

// ── Builds ───────────────────────────────────────────────────

model Build {
  id           String      @id @default(cuid())
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String      @map("user_id")
  name         String
  description  String?
  isPublic     Boolean     @default(false) @map("is_public")
  totalPrice   Decimal     @db.Decimal(10, 2) @map("total_price")
  items        BuildItem[]
  order        Order?
  createdAt    DateTime    @default(now()) @map("created_at")
  updatedAt    DateTime    @updatedAt @map("updated_at")

  @@index([userId])
  @@map("builds")
}

model BuildItem {
  id        String  @id @default(cuid())
  build     Build   @relation(fields: [buildId], references: [id], onDelete: Cascade)
  buildId   String  @map("build_id")
  product   Product @relation(fields: [productId], references: [id])
  productId String  @map("product_id")
  quantity  Int     @default(1)

  @@unique([buildId, productId])
  @@map("build_items")
}

// ── Orders ───────────────────────────────────────────────────

model Order {
  id              String      @id @default(cuid())
  user            User        @relation(fields: [userId], references: [id])
  userId          String      @map("user_id")
  build           Build?      @relation(fields: [buildId], references: [id])
  buildId         String?     @unique @map("build_id")
  status          OrderStatus @default(PENDING)
  subtotal        Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2) @map("shipping_cost")
  tax             Decimal     @db.Decimal(10, 2)
  total           Decimal     @db.Decimal(10, 2)
  shippingAddress Json        @map("shipping_address")
  items           OrderItem[]
  payment         Payment?
  notes           String?
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  @@index([userId])
  @@index([status])
  @@map("orders")
}

model OrderItem {
  id          String  @id @default(cuid())
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId     String  @map("order_id")
  product     Product @relation(fields: [productId], references: [id])
  productId   String  @map("product_id")
  productName String  @map("product_name")   // Snapshot at time of order
  price       Decimal @db.Decimal(10, 2)      // Snapshot at time of order
  quantity    Int

  @@map("order_items")
}

model Payment {
  id                String   @id @default(cuid())
  order             Order    @relation(fields: [orderId], references: [id])
  orderId           String   @unique @map("order_id")
  provider          String   // razorpay
  providerPaymentId String?  @map("provider_payment_id")
  providerOrderId   String?  @map("provider_order_id")
  amount            Decimal  @db.Decimal(10, 2)
  currency          String   @default("INR")
  status            String   // created, captured, failed
  paidAt            DateTime? @map("paid_at")
  createdAt         DateTime @default(now()) @map("created_at")

  @@map("payments")
}
```

---

## 5. Migration Strategy

```bash
# 1. Edit schema.prisma
# 2. Generate migration (creates SQL file in prisma/migrations/)
pnpm db:migrate

# Migration files are committed to git
# They are applied automatically in CI/CD pipelines
```

**Golden rule:** Never edit a migration file after it has been applied to any environment.

---

## 6. Cloud Portability

The entire database layer is PostgreSQL-agnostic from the perspective of the application. To migrate:

| From | To | Steps |
|---|---|---|
| Docker Postgres | Google Cloud SQL | Update `DATABASE_URL` → run `pnpm db:migrate` |
| Docker Postgres | Supabase | Update `DATABASE_URL` → run `pnpm db:migrate` |
| Docker Postgres | Railway | Update `DATABASE_URL` → run `pnpm db:migrate` |
| Docker Postgres | AWS RDS | Update `DATABASE_URL` → run `pnpm db:migrate` |

Frontend apps never see the `DATABASE_URL`. The API does not embed connection strings in its responses. The abstraction is complete.

For complete cloud setup instructions, zero-downtime cutover runbooks, backup policies, and rollback procedures, see:
👉 **[Google Cloud SQL Migration & Portability Guide](./migration-to-google-cloud-sql.md)**

---

## 7. Indexes and Performance

- All foreign keys are indexed
- `products` table: index on `category_id`, `component_category`, `is_active`
- `orders` table: index on `user_id`, `status`
- Full-text search: PostgreSQL `tsvector` column on `products` (added in a future migration)

---

## 8. Soft Deletes

Products are never hard-deleted (order history integrity). Use `isActive = false` to deactivate.

Users: hard delete is possible but soft-delete is preferred for audit trail.
