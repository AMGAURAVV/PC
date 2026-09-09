/**
 * apps/web — Root Layout
 *
 * Sets up global fonts, providers (TanStack Query, Theme),
 * and the base HTML shell.
 *
 * NOTE: No data fetching here. No API calls in layout.
 */

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PC Platform — Build Your Dream PC',
    template: '%s | PC Platform',
  },
  description:
    'India\'s premier custom PC building platform. Browse components, check compatibility, and build your perfect PC.',
  keywords: ['custom PC', 'PC builder', 'gaming PC', 'PC parts India', 'compatible parts'],
  authors: [{ name: 'PC Platform' }],
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'PC Platform',
    title: 'PC Platform — Build Your Dream PC',
    description: 'India\'s premier custom PC building platform.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {/*
         * Providers are in a separate Client Component to avoid
         * making this Server Component a client component.
         * See: src/lib/providers.tsx
         */}
        {children}
      </body>
    </html>
  );
}
