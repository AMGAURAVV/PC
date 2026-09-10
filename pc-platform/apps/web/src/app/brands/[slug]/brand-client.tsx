'use client';

import * as React from 'react';
import {
  Breadcrumbs,
  ProductCard,
  ProductCardSkeleton,
  EmptyState,
  ErrorState,
  Select,
  CompareTray,
  CompareModal,
  useToast,
} from '@pc-platform/ui';
import { Award, Globe, ArrowUpDown } from 'lucide-react';
import { useProducts } from '../../../hooks/use-products';
import { useBrand } from '../../../hooks/use-brands';
import { useCart } from '../../../hooks/use-cart';
import { useWishlist } from '../../../hooks/use-wishlist';
import { useCompare } from '../../../hooks/use-compare';

export interface BrandDetailClientProps {
  slug: string;
}

export function BrandDetailClient({ slug }: BrandDetailClientProps) {
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

  const [sortBy, setSortBy] = React.useState('newest');

  // Fetch brand details from API
  const { data: brandResponse } = useBrand(slug);
  const brand = brandResponse?.data;

  // Fetch products by brand
  const { data: productsResponse, isLoading: isProductsLoading, isError, refetch } = useProducts({
    brand: slug,
    limit: 24,
    sort: sortBy === 'price_asc' || sortBy === 'price_desc' ? 'price' : 'createdAt',
    order: sortBy === 'price_asc' ? 'asc' : 'desc',
  });

  const products = productsResponse?.data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Brands', href: '/products' },
          { label: brand?.name || slug.toUpperCase() },
        ]}
      />

      {/* Brand Hero Banner */}
      <div className="relative rounded-2xl border border-border/80 bg-cyber-950/60 p-6 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold">
            <Award className="w-4 h-4" />
            <span>AUTHORIZED PARTNER LINEUP</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight uppercase">
            {brand?.name || slug.toUpperCase()}
          </h1>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Directly sourced hardware engineered by {brand?.name || slug.toUpperCase()} with full manufacturer warranty coverage and verified component firmware.
          </p>

          {brand?.websiteUrl && (
            <div className="pt-2">
              <a
                href={brand.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Visit Official Brand Website ↗</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bar: Results Count & Sort */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <span className="text-xs font-mono text-muted-foreground uppercase">
          {products.length} VERIFIED HARDWARE MODELS
        </span>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline uppercase">Sort:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 w-40 text-xs font-mono"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </Select>
        </div>
      </div>

      {/* Product Grid */}
      {isProductsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="BRAND CATALOG TELEMETRY ERROR"
          message="Failed to retrieve hardware manufactured by this brand."
          onRetry={() => refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon="cpu"
          title={`NO PRODUCTS CURRENTLY LISTED FOR ${brand?.name || slug.toUpperCase()}`}
          description="We are currently ingesting new inventory from this brand."
          actionLabel="VIEW ALL HARDWARE"
          onAction={() => (window.location.href = '/products')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={isInWishlist(product.id)}
              isComparing={isComparing(product.id)}
              rating={4.9}
              reviewsCount={15}
              onToggleWishlist={() => toggleWishlist(product)}
              onToggleCompare={() => toggleCompare(product)}
              onAddToCart={() => {
                addToCart(product, 1);
                toast({
                  title: 'ADDED TO CART',
                  description: `${product.name} added to cart.`,
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
