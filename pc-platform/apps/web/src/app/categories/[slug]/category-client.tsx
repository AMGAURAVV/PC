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
import { Sliders, ArrowUpDown } from 'lucide-react';
import { useProducts } from '../../../hooks/use-products';
import { useCategories } from '../../../hooks/use-categories';
import { useCart } from '../../../hooks/use-cart';
import { useWishlist } from '../../../hooks/use-wishlist';
import { useCompare } from '../../../hooks/use-compare';

export interface CategoryDetailClientProps {
  slug: string;
}

export function CategoryDetailClient({ slug }: CategoryDetailClientProps) {
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

  // Fetch all categories to find the current category details
  const { data: categoriesResponse } = useCategories();
  const category = (categoriesResponse?.data || []).find((c) => c.slug === slug);

  // Fetch products under this category
  const { data: productsResponse, isLoading, isError, refetch } = useProducts({
    category: slug,
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
          { label: 'Categories', href: '/products' },
          { label: category?.name || slug.toUpperCase() },
        ]}
      />

      {/* Category Hero Banner */}
      <div className="relative rounded-2xl border border-border/80 bg-cyber-950/60 p-6 sm:p-10 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 font-bold">
            <Sliders className="w-4 h-4" />
            <span>COMPONENT ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight uppercase">
            {category?.name || slug.replace('-', ' ')}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {category?.description ||
              `Explore high-performance ${category?.name || slug} components verified for socket fitment, PCIe bus speed, and thermal stability.`}
          </p>
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
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="CATEGORY TELEMETRY ERROR"
          message="Failed to retrieve components under this category."
          onRetry={() => refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          icon="cpu"
          title="NO HARDWARE FOUND IN THIS CATEGORY"
          description="New components are undergoing compatibility verification. Check back shortly."
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
              rating={4.8}
              reviewsCount={18}
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
