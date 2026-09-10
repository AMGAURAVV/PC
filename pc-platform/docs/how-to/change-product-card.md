# How-To: Modify the Product Card Component

> **Target Audience:** Frontend Engineers  
> **Estimated Time:** 15–20 minutes  
> **Files Involved:**  
> - `packages/ui/src/components/product-card.tsx` (Component implementation)  
> - `packages/ui/src/index.ts` (Public export)  
> - `apps/web/src/app/products/` (Consumer views)

---

## 1. Overview & Architecture

The `<ProductCard />` component is the central visual unit across the platform, rendering in search results, category pages, brand listings, deals, and the homepage.

It displays:
- Product primary image with fallback placeholder
- Brand name & component badge (e.g., GPU, CPU)
- Product title with link to detail page
- Key specifications pills (e.g., 16GB GDDR6X, AM5 socket)
- Price display (Retail price, discount percentage, Sale price)
- Stock availability indicator (`In Stock`, `Low Stock`, `Out of Stock`)
- Interactive actions: "Add to Cart", "Add to Build", "Compare" checkbox

---

## 2. Step-by-Step Instructions

### Step 1: Open `product-card.tsx`
Navigate to [`packages/ui/src/components/product-card.tsx`](file:///packages/ui/src/components/product-card.tsx).

### Step 2: Modifying Props / Data Structure
Inspect the `ProductCardProps` interface:
```typescript
export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  inStock?: boolean;
  stockQuantity?: number;
  specs?: Array<{ label: string; value: string }>;
  rating?: number;
  reviewCount?: number;
  onAddToCart?: (id: string) => void;
  onAddToBuild?: (id: string) => void;
  isComparing?: boolean;
  onToggleCompare?: (id: string) => void;
}
```
If adding a new prop (e.g. `warrantyYears?: number`), update the interface and destructure it in the component.

### Step 3: Modifying Layout & Styling
To add a warranty badge in the metadata row:
```tsx
{warrantyYears && (
  <span className="inline-flex items-center text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
    🛡️ {warrantyYears}Y Warranty
  </span>
)}
```

### Step 4: Updating the Skeleton Component
Whenever the layout of `ProductCard` is modified, update the paired `<ProductCardSkeleton />` in the same file to prevent layout shifts during page loading.

---

## 3. Building & Verifying Changes

Recompile the shared UI package:
```bash
pnpm --filter @pc-platform/ui build
```

Verify in the Design System showcase page:
```bash
pnpm --filter @pc-platform/web dev
```
Open [http://localhost:3000/design-system](http://localhost:3000/design-system) and check the Product Card section.

Run typecheck across consuming apps:
```bash
pnpm --filter @pc-platform/web typecheck
pnpm --filter @pc-platform/admin typecheck
```

---

## 4. Common Pitfalls & Guardrails
- **Click Event Bubbling**: Action buttons ("Add to Cart", "Compare") must call `e.stopPropagation()` and `e.preventDefault()` to avoid triggering navigation on the wrapping `<Link href="/products/[slug]">`.
- **Image Aspect Ratio**: Keep image containers locked to fixed aspect ratios (`aspect-square` or `aspect-[4/3]`) to avoid Cumulative Layout Shift (CLS).
