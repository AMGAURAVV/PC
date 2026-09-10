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
import { Providers } from '../lib/providers';
import { LayoutShell } from '../components/layout-shell';

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

import { constructMetadata, siteConfig, JsonLd, generateOrganizationSchema, generateWebSiteSchema } from '../lib/seo';

export const metadata: Metadata = constructMetadata({
  canonicalPath: '/',
  keywords: [
    'custom PC builder',
    'PC builder India',
    'gaming PC rig',
    'computer parts online',
    'hardware compatibility test',
    'RTX 4080 super',
    'Ryzen 7 7800X3D',
    'PC parts price history',
  ],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <JsonLd data={[generateOrganizationSchema(), generateWebSiteSchema()]} />
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
