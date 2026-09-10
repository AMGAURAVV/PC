# How-To: Modify the Homepage

> **Target Audience:** Frontend Engineers  
> **Estimated Time:** 15–30 minutes  
> **Files Involved:**  
> - `apps/web/src/app/page.tsx` (Server Component & SEO Metadata)  
> - `apps/web/src/app/home-client.tsx` (Client Component layout & sections)  
> - `packages/ui/src/components/` (Shared UI components)

---

## 1. Overview & Architecture

The homepage is structured using Next.js 14 App Router conventions to optimize both search indexing and client interactivity:
1. **`page.tsx` (Server Component)**: Generates metadata, OpenGraph cards, schema.org structured data, and canonical tags.
2. **`home-client.tsx` (Client Component)**: Implements interactive sections:
   - **Hero Section**: High-impact headline, live builder call-to-action (CTA), and hardware telemetry badges.
   - **Interactive Configurator Teaser**: Quick component picker preview.
   - **Featured Products Carousel**: Dynamic product recommendations fetched via TanStack Query.
   - **Community Builds Showcase**: Curated community rigs with compatibility scores.
   - **Platform Features Grid**: Socket matching, real-time pricing, express shipping badges.

---

## 2. Step-by-Step Instructions

### Step 1: Modifying SEO Title, Description, and Keywords
Open [`apps/web/src/app/page.tsx`](file:///apps/web/src/app/page.tsx):
```typescript
export const metadata: Metadata = constructMetadata({
  title: 'Your New Homepage Title',
  description: 'Updated description for search engines...',
  keywords: ['custom PC builder', 'RTX 5090', 'gaming PC'],
});
```

### Step 2: Modifying Hero Text & Call-to-Action
Open [`apps/web/src/app/home-client.tsx`](file:///apps/web/src/app/home-client.tsx). Locate the Hero section:
```tsx
// Update headline
<h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
  Build Your Dream Rig with Zero Guesswork
</h1>

// Update primary CTA button
<Link href="/builder" className="...">
  Launch Custom PC Configurator
</Link>
```

### Step 3: Adding or Reordering Sections
To add a new section (e.g. "Seasonal Discounts Banner"):
1. Create a sub-component or inline section in `apps/web/src/app/home-client.tsx`:
```tsx
function SeasonalBannerSection() {
  return (
    <section className="py-12 bg-slate-900 border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white">Summer Hardware Fest</h2>
        <p className="text-slate-400">Up to 25% off DDR5 RAM & PCIe 5.0 SSDs</p>
      </div>
    </section>
  );
}
```
2. Insert `<SeasonalBannerSection />` within the main JSX flow of `HomePageClient`.

---

## 3. Verification & Testing

Run the local development server to inspect the changes:
```bash
# Start web app on port 3000
pnpm --filter @pc-platform/web dev
```
Open [http://localhost:3000](http://localhost:3000) and verify:
1. Visual layout, typography, and responsive rendering across mobile (375px) and desktop (1440px).
2. Browser title bar reflects updated metadata.
3. No console errors or hydration mismatch warnings.

Run static type check and lint:
```bash
pnpm --filter @pc-platform/web typecheck
pnpm --filter @pc-platform/web lint
```

---

## 4. Common Pitfalls & Guardrails
- **Hydration Mismatch**: Do not render dynamic timestamps or random numbers directly in the initial render without `useEffect` or `suppressHydrationWarning`.
- **Image Performance**: Always use `next/image` with explicit `width`, `height`, and `priority` for above-the-fold hero images to maintain high LCP scores.
