import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../lib/providers';
import { AdminShell } from '../components/shell/admin-shell';

export const metadata: Metadata = {
  title: 'Nexus Rigs — Admin Backoffice',
  description: 'PC Platform hardware catalog, compatibility rules, and order management.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060910] text-foreground antialiased selection:bg-cyan-500 selection:text-black">
        <Providers>
          <AdminShell>{children}</AdminShell>
        </Providers>
      </body>
    </html>
  );
}
