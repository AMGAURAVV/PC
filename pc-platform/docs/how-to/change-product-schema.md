# How-To: Modify the Product Database Schema

> **Target Audience:** Fullstack & Database Engineers  
> **Estimated Time:** 30–45 minutes  
> **Files Involved:**  
> - `packages/database/prisma/schema.prisma`  
> - `packages/types/src/`  
> - `packages/validation/src/`  
> - `apps/api/src/products/`

---

## 1. Overview & Golden Rules

Modifying the product schema affects database persistence, API serialization, and frontend displays. To prevent outages or breaking migrations, follow the **Expand-and-Contract** pattern:
1. **Never make a new column `NOT NULL` without a default value** on a table that already contains data.
2. **Never drop or rename a column in the same deployment** as application code changes.
3. Always generate and commit Prisma migrations.

---

## 2. Step-by-Step Instructions

### Step 1: Edit `schema.prisma`
Open [`packages/database/prisma/schema.prisma`](file:///packages/database/prisma/schema.prisma). Locate `model Product`:
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  // ... existing fields ...
  
  // Example: Adding warranty months and country of origin
  warrantyMonths Int?     @default(24) @map("warranty_months")
  countryOfOrigin String? @map("country_of_origin")

  @@index([warrantyMonths])
}
```

### Step 2: Create and Apply Migration
In your local development environment:
```bash
# Generate and apply migration
pnpm --filter @pc-platform/database migrate:dev --name add_product_warranty_fields

# Regenerate Prisma Client
pnpm --filter @pc-platform/database generate
```

### Step 3: Update Shared Types
Open `packages/types/src/products.ts` (or `packages/types/src/index.ts`):
```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  warrantyMonths?: number;
  countryOfOrigin?: string | null;
  // ...
}
```
Recompile types:
```bash
pnpm --filter @pc-platform/types build
```

### Step 4: Update Validation Schemas
Open `packages/validation/src/product.ts` to allow input in product creation/editing DTOs:
```typescript
export const createProductSchema = z.object({
  name: z.string().min(1),
  warrantyMonths: z.number().int().positive().optional(),
  countryOfOrigin: z.string().optional(),
  // ...
});
```
Recompile validation:
```bash
pnpm --filter @pc-platform/validation build
```

### Step 5: Update Backend Repository & DTOs
1. Update `apps/api/src/products/dto/product.dto.ts` with the new fields.
2. Update `apps/api/src/products/products.repository.ts` if specific include or select projections are required.

---

## 3. Verification & Testing

1. Run unit tests in validation:
   ```bash
   pnpm --filter @pc-platform/validation test
   ```
2. Run API integration tests:
   ```bash
   pnpm --filter @pc-platform/api test
   ```
3. Verify typecheck across all workspaces:
   ```bash
   pnpm typecheck
   ```

---

## 4. Production Deployment Checklist
- [ ] Migration file committed to `.git` under `packages/database/prisma/migrations/`.
- [ ] CI pipeline passes `lint`, `typecheck`, and `integration-tests`.
- [ ] Production deployment runs `pnpm db:migrate:prod` (`prisma migrate deploy`) prior to container restart.
