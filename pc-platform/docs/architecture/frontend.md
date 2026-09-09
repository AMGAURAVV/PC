# Frontend Architecture — PC Platform

> Covers `apps/web` and `apps/admin`  
> Status: Active | Last Updated: 2026-09

---

## 1. Guiding Principles

1. **No direct database access** — all data comes from `apps/api` via `packages/api-client`
2. **No business logic in components** — validation rules, compatibility checks, and pricing logic live in the backend
3. **No hardcoded data** — products, prices, and categories are always fetched
4. **Type-safe API communication** — every API call is typed via `packages/api-client` and `packages/types`
5. **Server Components by default** — use `'use client'` only when necessary (interactivity, browser APIs)

---

## 2. Technology Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Components | shadcn/ui + `packages/ui` |
| Server state | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| Schema validation | Zod (from `packages/validation`) |
| API client | `packages/api-client` |

---

## 3. Directory Structure

### `apps/web`

```
apps/web/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx           # Root layout (fonts, providers)
│   │   ├── page.tsx             # Home page
│   │   ├── (shop)/              # Route group: shop pages
│   │   │   ├── products/
│   │   │   │   ├── page.tsx     # Product listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # Product detail
│   │   │   ├── categories/
│   │   │   └── search/
│   │   ├── (builder)/           # Route group: PC builder
│   │   │   ├── build/
│   │   │   │   └── page.tsx     # PC builder wizard
│   │   │   └── builds/
│   │   ├── (account)/           # Route group: user account
│   │   │   ├── account/
│   │   │   ├── orders/
│   │   │   └── builds/
│   │   ├── (checkout)/          # Route group: cart + checkout
│   │   │   ├── cart/
│   │   │   └── checkout/
│   │   └── (auth)/              # Route group: auth pages
│   │       ├── login/
│   │       └── register/
│   │
│   ├── components/              # App-specific components
│   │   ├── layout/              # Header, footer, nav
│   │   ├── products/            # Product card, grid, filters
│   │   ├── builder/             # PC builder wizard components
│   │   ├── cart/                # Cart sidebar, item list
│   │   └── checkout/            # Checkout form, payment
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utilities, constants, providers
│   │   ├── providers.tsx        # TanStack Query, auth providers
│   │   ├── auth.ts              # Auth utilities
│   │   └── utils.ts
│   │
│   └── types/                   # App-level type extensions
│
├── public/                      # Static assets
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### `apps/admin`

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   └── (dashboard)/         # Protected admin routes
│   │       ├── dashboard/
│   │       ├── products/        # Product CRUD
│   │       ├── categories/
│   │       ├── orders/          # Order management
│   │       ├── users/
│   │       └── settings/
│   ├── components/
│   ├── hooks/
│   └── lib/
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 4. Data Fetching Pattern

### Server Components (default — preferred)

```tsx
// app/(shop)/products/page.tsx
import { getProducts } from '@pc-platform/api-client';

export default async function ProductsPage() {
  // Runs on server — no client-side fetch waterfall
  const products = await getProducts({ page: 1, limit: 24 });

  return <ProductGrid products={products.data} />;
}
```

### Client Components (for interactive data)

```tsx
// components/products/ProductFilters.tsx
'use client';

import { useProducts } from '@/hooks/use-products';

export function ProductFilters() {
  const { data, isLoading } = useProducts({ category: 'cpu' });
  // ...
}
```

### Custom hooks (TanStack Query wrappers)

```tsx
// hooks/use-products.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@pc-platform/api-client';
import type { ProductFilters } from '@pc-platform/types';

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => getProducts(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## 5. Form Pattern (React Hook Form + Zod)

Validation schemas come from `packages/validation` — **never re-defined in components**.

```tsx
// components/auth/LoginForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@pc-platform/validation';
import type { LoginInput } from '@pc-platform/types';

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // form.handleSubmit calls api-client, not fetch()
}
```

---

## 6. Authentication

- Access token stored in **memory** (React context / Zustand)
- Refresh token stored in **httpOnly cookie** (set by API)
- On page load: check if refresh token exists, auto-refresh access token
- Protected routes use Next.js middleware to redirect unauthenticated users

```
middleware.ts → checks cookie existence → redirects to /login
```

No JWT verification happens in the frontend. Only the API validates tokens.

---

## 7. PC Builder Wizard

The PC builder is a multi-step form-like wizard:

```
Step 1: Select Use Case (Gaming / Workstation / Budget / Custom)
Step 2: Select CPU → triggers compatibility check
Step 3: Select Motherboard (filtered by CPU socket)
Step 4: Select RAM (filtered by motherboard spec)
Step 5: Select GPU
Step 6: Select Storage
Step 7: Select PSU (filtered by total TDP)
Step 8: Select Case (filtered by form factor)
Step 9: Review + Save / Checkout
```

Each step:
- Calls `api-client` to fetch compatible components for the current selection
- Compatibility errors are returned by the API (which calls the compatibility engine)
- **No compatibility logic exists in the frontend**

---

## 8. Dependency Rules for Frontend

✅ **Allowed imports:**
- `@pc-platform/types`
- `@pc-platform/validation`
- `@pc-platform/api-client`
- `@pc-platform/ui`
- `@pc-platform/config`

❌ **Forbidden imports:**
- `@pc-platform/database` (Prisma)
- `@prisma/client`
- Any `apps/api` or `services/*` imports
- Direct `fetch()` calls to the DB or internal services
