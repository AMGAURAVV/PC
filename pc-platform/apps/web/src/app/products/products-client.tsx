'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Breadcrumbs,
  ProductCard,
  ProductCardSkeleton,
  FilterGroup,
  ActiveFiltersBar,
  SearchInput,
  Pagination,
  Select,
  Switch,
  Slider,
  EmptyState,
  ErrorState,
  CompareTray,
  Button,
  useToast,
} from '@pc-platform/ui';

const CompareModal = dynamic(
  () => import('@pc-platform/ui').then((m) => m.CompareModal),
  { ssr: false },
);
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useProducts } from '../../hooks/use-products';
import { useCategories } from '../../hooks/use-categories';
import { useBrands } from '../../hooks/use-brands';
import { useCart } from '../../hooks/use-cart';
import { useWishlist } from '../../hooks/use-wishlist';
import { useCompare } from '../../hooks/use-compare';

export function ProductsPageClient() {
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

  // Filter & pagination state
  const [search, setSearch] = React.useState('');
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 250000]);
  const [sortBy, setSortBy] = React.useState<string>('newest');
  const [page, setPage] = React.useState(1);

  // Mobile filters drawer toggle
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Fetch categories & brands for facet options
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();

  // Query products from backend API
  const { data: productsData, isLoading, isError, refetch } = useProducts({
    search: search || undefined,
    category: selectedCategories[0] || undefined,
    brand: selectedBrands[0] || undefined,
    inStock: inStockOnly ? true : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 250000 ? priceRange[1] : undefined,
    page,
    limit: 12,
    sort: sortBy === 'price_asc' || sortBy === 'price_desc' ? 'price' : 'createdAt',
    order: sortBy === 'price_asc' || sortBy === 'name_asc' ? 'asc' : 'desc',
  });

  const products = productsData?.data || [];
  const paginationMeta = productsData?.meta;
  const totalPages = paginationMeta?.totalPages || 1;

  // Active filter tags calculation
  const activeFilterTags = React.useMemo(() => {
    const tags: Array<{ id: string; label: string; groupTitle?: string }> = [];
    if (search) {
      tags.push({ id: 'search', label: `"${search}"`, groupTitle: 'Search' });
    }
    selectedCategories.forEach((cat) => {
      tags.push({ id: `cat_${cat}`, label: cat, groupTitle: 'Category' });
    });
    selectedBrands.forEach((brand) => {
      tags.push({ id: `brand_${brand}`, label: brand, groupTitle: 'Brand' });
    });
    if (inStockOnly) {
      tags.push({ id: 'in_stock', label: 'In Stock Only' });
    }
    if (priceRange[1] < 250000 || priceRange[0] > 0) {
      tags.push({
        id: 'price',
        label: `₹${priceRange[0].toLocaleString('en-IN')} - ₹${priceRange[1].toLocaleString('en-IN')}`,
        groupTitle: 'Price',
      });
    }
    return tags;
  }, [search, selectedCategories, selectedBrands, inStockOnly, priceRange]);

  const handleRemoveFilterTag = (id: string) => {
    if (id === 'search') setSearch('');
    else if (id === 'in_stock') setInStockOnly(false);
    else if (id === 'price') setPriceRange([0, 250000]);
    else if (id.startsWith('cat_')) {
      const cat = id.replace('cat_', '');
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else if (id.startsWith('brand_')) {
      const brand = id.replace('brand_', '');
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    }
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setPriceRange([0, 250000]);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Hardware Catalog' },
        ]}
      />

      {/* Header & Results summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
            HARDWARE COMPONENT CATALOG
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {paginationMeta?.total !== undefined
              ? `SHOWING ${products.length} OF ${paginationMeta.total} VERIFIED COMPONENTS`
              : 'BROWSING ENTHUSIAST HARDWARE'}
          </p>
        </div>

        {/* Sort & Mobile Filter Trigger */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden text-xs gap-1.5 font-mono"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>FILTERS</span>
            {activeFilterTags.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-cyan-500 text-black text-[10px] font-bold flex items-center justify-center">
                {activeFilterTags.length}
              </span>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline uppercase">Sort:</span>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="h-9 w-44 text-xs font-mono"
            >
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      <ActiveFiltersBar
        filters={activeFilterTags}
        onRemove={handleRemoveFilterTag}
        onClearAll={handleClearAllFilters}
      />

      {/* Main Grid: Sidebar + Products */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filters */}
        <aside
          className={`md:col-span-3 space-y-6 ${
            mobileFiltersOpen
              ? 'fixed inset-0 z-50 bg-cyber-950 p-6 overflow-y-auto block'
              : 'hidden md:block'
          }`}
        >
          {mobileFiltersOpen && (
            <div className="flex items-center justify-between pb-4 border-b border-border/80 md:hidden">
              <span className="font-mono font-bold text-white text-base">HARDWARE FILTERS</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Close
              </Button>
            </div>
          )}

          {/* Search Facet */}
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              KEYWORD SEARCH
            </span>
            <SearchInput
              value={search}
              onChange={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Filter by name, model..."
            />
          </div>

          {/* In Stock Toggle */}
          <div className="p-3 rounded-xl border border-border/80 bg-cyber-900/40">
            <Switch
              checked={inStockOnly}
              onCheckedChange={(checked) => {
                setInStockOnly(Boolean(checked));
                setPage(1);
              }}
              label="In Stock Only"
              description="Hide backordered or depleted inventory"
            />
          </div>

          {/* Price Range Slider */}
          <div className="p-4 rounded-xl border border-border/80 bg-cyber-900/40 space-y-3">
            <Slider
              label="PRICE BUDGET (INR)"
              min={0}
              max={250000}
              step={2000}
              value={priceRange}
              onValueChange={(val) => {
                setPriceRange([val[0] ?? 0, val[1] ?? 250000]);
                setPage(1);
              }}
              formatValue={(val) => `₹${val.toLocaleString('en-IN')}`}
            />
          </div>

          {/* Category Facet */}
          <div className="rounded-xl border border-border/80 bg-cyber-900/40 p-4">
            <FilterGroup
              title="COMPONENT CATEGORY"
              options={(categoriesData?.data || []).map((c) => ({
                id: c.slug,
                label: c.name,
              }))}
              selectedValues={selectedCategories}
              onChange={(vals) => {
                setSelectedCategories(vals);
                setPage(1);
              }}
            />
          </div>

          {/* Brand Facet */}
          <div className="rounded-xl border border-border/80 bg-cyber-900/40 p-4">
            <FilterGroup
              title="HARDWARE BRAND"
              options={(brandsData?.data || []).map((b) => ({
                id: b.slug,
                label: b.name,
              }))}
              selectedValues={selectedBrands}
              onChange={(vals) => {
                setSelectedBrands(vals);
                setPage(1);
              }}
            />
          </div>

          {mobileFiltersOpen && (
            <Button
              variant="gaming"
              className="w-full mt-4 md:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            >
              APPLY FILTERS
            </Button>
          )}
        </aside>

        {/* Product Cards Grid */}
        <main className="md:col-span-9 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              title="CATALOG TELEMETRY ERROR"
              message="Failed to communicate with catalog database. Please verify your connection."
              onRetry={() => refetch()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon="search"
              title="NO HARDWARE MATCHES YOUR CRITERIA"
              description="Try relaxing your price filters or searching for alternative hardware sockets."
              actionLabel="RESET ALL FILTERS"
              onAction={handleClearAllFilters}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any, idx: number) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 3}
                  isWishlisted={isInWishlist(product.id)}
                  isComparing={isComparing(product.id)}
                  rating={4.8}
                  reviewsCount={24}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 border-t border-border/60 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </main>
      </div>

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
              description: `${item.name} added to cart.`,
              variant: 'success',
            });
          }
        }}
      />
    </div>
  );
}
