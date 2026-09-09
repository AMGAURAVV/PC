/**
 * Home Page — apps/web
 *
 * This is a Server Component. Data fetching happens here on the server.
 * No 'use client' directive — this renders on the server for SEO.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PC Platform — Build Your Dream PC in India',
  description:
    'Browse thousands of PC components, use our compatibility checker, and build your perfect custom PC. Best prices in India.',
};

export default function HomePage() {
  return (
    <main>
      {/*
       * UI components will be added here in the next phase.
       * This file establishes the page structure and metadata.
       *
       * Planned sections:
       *   - Hero (PC Builder CTA)
       *   - Featured products
       *   - Category quick-access
       *   - Why PC Platform
       *   - Testimonials
       */}
      <section className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">PC Platform</h1>
        <p className="mt-4 text-muted-foreground">
          Build system initializing — UI coming in next phase.
        </p>
      </section>
    </main>
  );
}
