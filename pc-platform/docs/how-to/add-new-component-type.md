# How-To: Add a New Hardware Component Type

> **Target Audience:** Fullstack Engineers & System Architects  
> **Estimated Time:** 45–60 minutes  
> **Files Involved:**  
> - `packages/database/prisma/schema.prisma`  
> - `packages/types/src/`  
> - `packages/validation/src/`  
> - `apps/api/src/products/`  
> - `services/compatibility-engine/src/`  
> - `apps/web/src/app/builder/`

---

## 1. Overview & Architecture

Component types represent distinct hardware classifications in the PC Platform (e.g., `CPU`, `GPU`, `MOTHERBOARD`, `RAM`).

Adding a new component type (e.g., `CAPTURE_CARD`) requires updating the shared database enum, typing contracts, validation schemas, and UI configurator slots.

---

## 2. Step-by-Step Instructions

### Step 1: Update Prisma Enum & Migration
Open [`packages/database/prisma/schema.prisma`](file:///packages/database/prisma/schema.prisma). Locate `enum ComponentType`:
```prisma
enum ComponentType {
  CPU
  GPU
  MOTHERBOARD
  RAM
  STORAGE
  PSU
  CASE
  COOLER
  FAN
  MONITOR
  KEYBOARD
  MOUSE
  HEADSET
  WEBCAM
  SPEAKER
  MICROPHONE
  UPS
  OS
  CAPTURE_CARD // <── Added new type
  OTHER
}
```

Optional: If the new component has unique hardware specifications, declare a specification model:
```prisma
model CaptureCardSpec {
  id             String   @id @default(uuid())
  productId      String   @unique @map("product_id")
  maxResolution  String   @map("max_resolution") // e.g. "4K60"
  interface      String   // e.g. "PCIe 3.0 x4", "USB 3.2"
  passthrough    String?  // e.g. "4K120 HDR"
  product        Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("component_capture_card_specs")
}
```

Create migration:
```bash
pnpm --filter @pc-platform/database migrate:dev --name add_capture_card_component_type
pnpm --filter @pc-platform/database generate
```

---

### Step 2: Update Shared Types
Open `packages/types/src/index.ts` (or `packages/types/src/components.ts`):
```typescript
export enum ComponentType {
  // ... existing ...
  CAPTURE_CARD = 'CAPTURE_CARD',
  OTHER = 'OTHER',
}
```
Recompile types:
```bash
pnpm --filter @pc-platform/types build
```

---

### Step 3: Update Validation Schemas
Open `packages/validation/src/product.ts`:
```typescript
export const componentTypeSchema = z.enum([
  'CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU',
  'CASE', 'COOLER', 'FAN', 'MONITOR', 'KEYBOARD', 'MOUSE',
  'HEADSET', 'WEBCAM', 'SPEAKER', 'MICROPHONE', 'UPS', 'OS',
  'CAPTURE_CARD', // <── Added
  'OTHER',
]);
```
Recompile validation:
```bash
pnpm --filter @pc-platform/validation build
```

---

### Step 4: Update PC Configurator & Compatibility Engine
1. If the component consumes PCIe lanes or power draw, update `services/compatibility-engine/src/parser/rule-context.ts`:
```typescript
export interface RuleContext {
  // ...
  captureCards?: NormalizedComponent[];
}
```
2. In `apps/web/src/app/builder/builder-client.tsx`, add a slot selector for the new component type.

---

## 3. Verification & Testing

1. Test validation package:
   ```bash
   pnpm --filter @pc-platform/validation test
   ```
2. Test database seed script:
   ```bash
   pnpm --filter @pc-platform/database seed
   ```
3. Test compatibility engine:
   ```bash
   pnpm --filter @pc-platform/compatibility-engine test
   ```
4. Verify overall monorepo typecheck:
   ```bash
   pnpm typecheck
   ```
