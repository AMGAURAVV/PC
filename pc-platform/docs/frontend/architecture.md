# Frontend Architecture — PC Platform

> **Status:** Active | **Applications:** `apps/web` (Storefront), `apps/admin` (Backoffice), `packages/ui` (Design System)  
> **Tech Stack:** Next.js 14 (App Router), React 18, TypeScript 5, TailwindCSS, TanStack React Query 5, Lucide Icons

---

## 1. Module Overview & Responsibilities

The PC Platform frontend layer is composed of two independent Next.js 14 applications and a shared UI component package:

1. **`apps/web` (Storefront)**:
   - Consumer-facing e-commerce storefront, product catalog browsing, interactive PC builder / configurator, community build showcase, user account portal, and cart/checkout flow.
   - Optimized for fast Largest Contentful Paint (LCP), SEO, dynamic route caching, and zero-layout-shift responsive design.

2. **`apps/admin` (Backoffice Management Portal)**:
   - Operational portal for administrators, catalog managers, inventory coordinators, and support staff.
   - Secure management of product listings, pricing matrices, order lifecycles, user access control, coupon rules, and system audit logs.

3. **`packages/ui` (Shared Design System)**:
   - Reusable React component library providing buttons, badges, modals, input fields, cards, tables, skeleton loaders, and theme tokens.

---

## 2. Technical Specification & Module Contracts

| Dimension | Specification |
|---|---|
| **Purpose** | Present a high-performance, accessible, and responsive user experience for e-commerce, PC assembly, and administration. |
| **Responsibilities** | User interface rendering, client-side input validation, query caching/hydration, authenticated session persistence, checkout UI. |
| **Inputs** | User inputs (clicks, search terms, form submissions), route parameters (`/products/[slug]`), HTTP cookies (`auth_token`), localStorage. |
| **Outputs** | Semantic HTML5 DOM, optimized WebP/AVIF imagery, HTTP REST requests dispatched to `@pc-platform/api-client`. |
| **Dependencies** | `@pc-platform/api-client`, `@pc-platform/types`, `@pc-platform/validation`, `@pc-platform/ui`, `@tanstack/react-query`, `lucide-react`. |
| **Database Tables** | **NONE (Zero Knowledge).** The frontend never connects to PostgreSQL or imports `@prisma/client`. |
| **Consumed API Endpoints** | `/api/v1/auth/*`, `/api/v1/products/*`, `/api/v1/builds/*`, `/api/v1/cart/*`, `/api/v1/orders/*`, `/api/v1/admin/*`. |

---

## 3. Component Architecture & Rendering Boundaries

The frontend strictly enforces Next.js 14 App Router boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                   Server Component (RSC)                    │
│   (Fetches initial data, generates metadata, handles SEO)   │
│   File: apps/web/src/app/products/[slug]/page.tsx           │
└──────────────────────────────┬──────────────────────────────┘
                               │ (passes serialized props)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Client Component ('use client')           │
│   (Interactive state, TanStack Query hooks, event handlers) │
│   File: apps/web/src/components/products/product-detail.tsx  │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Data Fetching & Caching Strategy
- **TanStack Query (React Query 5)**: Manages client-side query caching, background revalidation, and mutation states.
  - Query keys follow the structured convention: `['products', filters]`, `['cart']`, `['build', id]`.
  - Default `staleTime`: 60 seconds for catalog queries; 0 seconds for cart and active build state.
- **Image Optimization**: Next.js `<Image />` component with configured formats (`['image/avif', 'image/webp']`) and responsive device sizes.
- **Route Segment Config**: Static pages use `revalidate = 3600`; dynamic e-commerce cart/builder routes use dynamic client hydration.

---

## 4. Failure Modes & Resilience Patterns

| Failure Scenario | Impact | Mitigation / Resilience Pattern |
|---|---|---|
| **Backend API Unreachable** | Pages fail to fetch live catalog or cart data | React Error Boundaries display user-friendly fallback state with "Retry" action. Stale cached data is displayed where possible. |
| **Auth Token Expired (401)** | User action rejected by API | The `@pc-platform/api-client` interceptor attempts silent refresh via `/api/v1/auth/refresh`. If refresh fails, user is redirected to `/login?redirect=...`. |
| **Form Validation Error (400)** | Mutation rejected by server | Zod schema validation runs client-side in real time before submission; server validation errors are mapped directly to input field error labels. |
| **Slow Network / Asset Latency** | Potential layout shift or unresponsive UI | Skeleton screens (`packages/ui/src/components/skeleton.tsx`) display placeholder shapes while data resolves. |

---

## 5. Testing Approach

- **End-to-End Browser Tests (Playwright)**:
  - Location: `tests/e2e/`
  - Runs full user journeys: registration, login, product search, custom PC builder with compatibility warning checks, cart checkout with mock payments.
  - Command: `pnpm test:e2e`
- **Linting & Code Formatting**:
  - `pnpm --filter @pc-platform/web lint`
  - `pnpm --filter @pc-platform/admin lint`
- **TypeScript Compilation**:
  - `pnpm --filter @pc-platform/web typecheck`
  - `pnpm --filter @pc-platform/admin typecheck`

---

## 6. How to Modify Safely

1. **Adding a New Page**:
   - Create a directory inside `apps/web/src/app/<route-name>/page.tsx`.
   - Export `metadata` for SEO title and description.
   - Separate server data fetching from interactive client components using `'use client'`.
2. **Modifying an API Call**:
   - Update `@pc-platform/api-client` in `packages/api-client/src/index.ts` first.
   - Build package: `pnpm --filter @pc-platform/api-client build`.
   - Consume the updated client method in frontend React Query hooks.
3. **Changing Design System Components**:
   - Edit components in `packages/ui/src/components/`.
   - Ensure all props accept standard HTML attributes and Tailwind class name overrides (`className?: string`).
   - Run `pnpm --filter @pc-platform/ui build` and verify across both storefront and admin.
