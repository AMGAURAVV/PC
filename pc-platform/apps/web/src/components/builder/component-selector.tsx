'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, X, Sparkles } from 'lucide-react';
import { Product, CompatibilityResult } from '@pc-platform/types';
import { useProducts } from '../../hooks/use-products';
import { BUILDER_CATEGORIES, BuilderSlotId } from './types';
import { ComponentCard } from './component-card';
import {
  Input,
  Button,
  Badge,
  Select,
  Switch,
  Label,
  Slider,
  Skeleton,
  EmptyState,
} from '@pc-platform/ui';

interface ComponentSelectorProps {
  slotId: BuilderSlotId;
  currentProductId?: string | undefined;
  compatibilityResult?: CompatibilityResult | null | undefined;
  onSelectProduct: (slotId: BuilderSlotId, product: Product) => void;
  onClose?: (() => void) | undefined;
  className?: string | undefined;
}

export function ComponentSelector({
  slotId,
  currentProductId,
  compatibilityResult,
  onSelectProduct,
  onClose,
  className = '',
}: ComponentSelectorProps) {
  const categoryConfig =
    BUILDER_CATEGORIES.find((c) => c.id === slotId) || BUILDER_CATEGORIES[0]!;

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedBrand, setSelectedBrand] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'price_asc' | 'price_desc' | 'name'>('price_asc');
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [maxPriceFilter, setMaxPriceFilter] = React.useState<number>(250000);

  // Fetch products from backend for this component category
  const { data: productsResponse, isLoading, error } = useProducts({
    componentCategory: categoryConfig.category,
    limit: 50,
  });

  const allProducts = productsResponse?.data || [];

  // Extract unique brands for filtering
  const brands = React.useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  }, [allProducts]);

  // Determine highest price for slider
  const highestPrice = React.useMemo(() => {
    if (allProducts.length === 0) return 250000;
    return Math.max(...allProducts.map((p) => p.price));
  }, [allProducts]);

  // Filter and sort products
  const filteredProducts = React.useMemo(() => {
    let list = [...allProducts];

    // Filter by keyword if category specifies (e.g. keyboard vs mouse)
    if (categoryConfig.keyword) {
      const kw = categoryConfig.keyword.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          (p.category && p.category.name.toLowerCase().includes(kw))
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.model?.toLowerCase().includes(q)
      );
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      list = list.filter((p) => p.brand === selectedBrand);
    }

    // In stock only
    if (inStockOnly) {
      list = list.filter((p) => p.stock > 0);
    }

    // Max price filter
    list = list.filter((p) => p.price <= maxPriceFilter);

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

    return list;
  }, [allProducts, categoryConfig, searchQuery, selectedBrand, inStockOnly, maxPriceFilter, sortBy]);

  // Helper to determine if a product has known issues from compatibility evaluation
  const getProductCompatibility = (product: Product) => {
    if (!compatibilityResult) {
      return { status: 'compatible' as const, reason: undefined };
    }

    // Check if product is in affectedComponents of any issue
    const issue = compatibilityResult.issues?.find((iss) =>
      iss.affectedComponents?.includes(product.id)
    );
    if (issue) {
      return {
        status: 'incompatible' as const,
        reason: `${issue.title}: ${issue.suggestedResolution}`,
      };
    }

    const warning = compatibilityResult.warnings?.find((w) =>
      w.affectedComponents?.includes(product.id)
    );
    if (warning) {
      return {
        status: 'warning' as const,
        reason: `${warning.title}: ${warning.suggestedResolution}`,
      };
    }

    return { status: 'compatible' as const, reason: undefined };
  };

  return (
    <div className={`flex flex-col h-full bg-card border border-border/80 rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/80 bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-primary">
                Select Hardware
              </span>
              {categoryConfig.required ? (
                <Badge variant="warning" className="text-[10px] font-mono">
                  Mandatory
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-mono">
                  Optional
                </Badge>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
              {categoryConfig.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl line-clamp-1 sm:line-clamp-none">
              {categoryConfig.helpText}
            </p>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close selector"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Search & Quick Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${categoryConfig.name}...`}
              className="pl-9 bg-background/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5 shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {(selectedBrand !== 'all' || inStockOnly || maxPriceFilter < highestPrice) && (
                <span className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </Button>

            <div className="w-40 shrink-0">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 text-xs"
              >
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Collapsible Filters Bar */}
        {showFilters && (
          <div className="mt-3 p-3.5 rounded-lg bg-background/80 border border-border/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs animate-in fade-in-50 duration-200">
            {/* Brand Filter */}
            <div>
              <label className="font-semibold text-muted-foreground mb-1 block">Brand</label>
              <Select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-9 text-xs"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>

            {/* Price Cap Slider */}
            <div>
              <div className="flex justify-between font-semibold text-muted-foreground mb-1">
                <span>Max Price</span>
                <span className="text-foreground font-mono">₹{maxPriceFilter.toLocaleString('en-IN')}</span>
              </div>
              <Slider
                value={[maxPriceFilter]}
                min={1000}
                max={highestPrice > 0 ? highestPrice : 250000}
                step={1000}
                onValueChange={(val) => setMaxPriceFilter(val[0] ?? 250000)}
                className="mt-2"
              />
            </div>

            {/* In-Stock Switch */}
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:pt-4">
              <Switch
                id="stock-toggle"
                checked={inStockOnly}
                onCheckedChange={setInStockOnly}
              />
              <Label htmlFor="stock-toggle" className="cursor-pointer font-medium text-xs">
                In Stock Only
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Results Count & Subtitle */}
      <div className="px-4 py-2 bg-muted/10 border-b border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing <strong className="text-foreground">{filteredProducts.length}</strong> available {categoryConfig.name}s
        </span>
        <span className="flex items-center gap-1 text-[11px] font-mono text-primary">
          <Sparkles className="w-3.5 h-3.5" /> Engine Compatibility Active
        </span>
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-border/50 flex gap-4 items-center">
                <Skeleton className="w-20 h-20 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-9 w-24 shrink-0" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive font-medium">Failed to load hardware catalog.</p>
            <p className="text-xs text-muted-foreground mt-1">Please check your network connection or try again.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No components found"
            description="Try adjusting your search query, brand filter, or price limit."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedBrand('all');
              setInStockOnly(false);
              setMaxPriceFilter(highestPrice);
            }}
          />
        ) : (
          filteredProducts.map((product) => {
            const compat = getProductCompatibility(product);
            const isSelected = currentProductId === product.id;

            return (
              <ComponentCard
                key={product.id}
                product={product}
                isSelected={isSelected}
                compatibilityStatus={compat.status}
                compatibilityReason={compat.reason}
                onSelect={(p) => onSelectProduct(slotId, p)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
