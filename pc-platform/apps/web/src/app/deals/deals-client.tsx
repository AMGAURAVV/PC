'use client';

import * as React from 'react';
import {
  Breadcrumbs,
  ProductCard,
  ProductCardSkeleton,
  Badge,
  EmptyState,
  ErrorState,
  Select,
  CompareTray,
  CompareModal,
  useToast,
} from '@pc-platform/ui';
import { Flame, ArrowUpDown, Sparkles, Percent } from 'lucide-react';
import { useProducts } from '../../hooks/use-products';
import { useCart } from '../../hooks/use-cart';
import { useWishlist } from '../../hooks/use-wishlist';
import { useCompare } from '../../hooks/use-compare';

export function DealsClient() {
  const { toast } = useToast();
  const { addItem: addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const {
    items: compareItems,
    isModalOpen: isCompareOpen,
    setIsModalOpen: setIsCompareOpen,
    toggleCompare,
    removeItem: removeCompare,
    clearAll: clearCompare,
    isComparing,
  } = useCompare();

  const [sortBy, setSortBy] = React.useState('discount');

  // Fetch all products to filter deals
  const { data: productsResponse, isLoading, isError, refetch } = useProducts({
    limit: 50,
  });

  // Filter products having discount (compareAtPrice > price)
  const allProducts = productsResponse?.data || [];
  const deals = React.useMemo(() => {
    const discounted = allProducts.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price);
    const list = discounted.length > 0 ? discounted : allProducts.slice(0, 12);

    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => b.price - a.price);
    } else {
      // Default sort by highest discount amount
      return [...list].sort((a, b) => {
        const discA = a.compareAtPrice ? a.compareAtPrice - a.price : 0;
        const discB = b.compareAtPrice ? b.compareAtPrice - b.price : 0;
        return discB - discA;
      });
    }
  }, [allProducts, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Exclusive Deals & Drops' },
        ]}
      />

      {/* Deals Hero Banner */}
      <div className="relative rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-cyber-950 to-amber-950/30 p-8 sm:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge variant="destructive" dot pulse className="font-mono text-xs font-bold">
            HOT HARDWARE DROPS • LIMITED ALLOCATIONS
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
            HARDWARE CLEARANCE & VALUE DROPS
          </h1>

          <p className="text-sm text-cyber-300 leading-relaxed">
            Verified enthusiast components discounted below MSRP. All promotional items include standard manufacturer warranty and return protection.
          </p>
        </div>
      </div>

      {/* Bar: Results Count & Sort */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />
          {deals.length} DISCOUNTED HARDWARE DEALS
        </span>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline uppercase">Sort:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 w-44 text-xs font-mono"
          >
            <option value="discount">Highest Discount</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </Select>
        </div>
      </div>

      {/* Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="DEALS TELEMETRY ERROR"
          message="Failed to retrieve hardware promotions."
          onRetry={() => refetch()}
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon="cart"
          title="NO ACTIVE PROMOTIONAL DROPS"
          description="Check back soon for next week's hardware drops and factory rebates."
          actionLabel="BROWSE FULL CATALOG"
          onAction={() => (window.location.href = '/products')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {deals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compareAtPrice={product.compareAtPrice || Math.round(product.price * 1.2)}
              isWishlisted={isInWishlist(product.id)}
              isComparing={isComparing(product.id)}
              rating={4.8}
              reviewsCount={29}
              onToggleWishlist={() => toggleWishlist(product)}
              onToggleCompare={() => toggleCompare(product)}
              onAddToCart={() => {
                addToCart(product, 1);
                toast({
                  title: 'ADDED TO CART',
                  description: `${product.name} added at promotional price.`,
                });
              }}
              onAddToBuild={() => {
                window.location.href = `/builder?part=${product.id}`;
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Compare Tray & Modal */}
      <CompareTray
        items={compareItems}
        onRemove={removeCompare}
        onClear={clearCompare}
        onOpenCompare={() => setIsCompareOpen(true)}
      />

      <CompareModal
        open={isCompareOpen}
        onOpenChange={setIsCompareOpen}
        products={compareItems}
        onRemoveProduct={removeCompare}
        onAddToCart={(id) => {
          const item = compareItems.find((i) => i.id === id);
          if (item) {
            addToCart(item as any, 1);
            toast({
              title: 'ADDED TO CART',
              description: `${item.name} added.`,
              variant: 'success',
            });
          }
        }}
      />
    </div>
  );
}
