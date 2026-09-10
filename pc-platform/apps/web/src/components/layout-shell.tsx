'use client';

import * as React from 'react';
import { Header, Footer } from '@pc-platform/ui';
import { useCart } from '../hooks/use-cart';
import { useWishlist } from '../hooks/use-wishlist';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header
        cartItemCount={itemCount}
        savedBuildsCount={wishlistCount}
        onSearch={(query) => {
          if (query) {
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
          }
        }}
        onOpenCart={() => {
          window.location.href = '/cart';
        }}
        onOpenSavedBuilds={() => {
          window.location.href = '/account';
        }}
        onSignIn={() => {
          window.location.href = '/account';
        }}
      />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
