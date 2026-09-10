'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  CompareModal,
  Button,
  useToast,
} from '@pc-platform/ui';
import { Search as SearchIcon, ArrowUpDown, FilterX, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useSearch, useSearchSuggestions } from '../../hooks/use-search';
import { useCategories } from '../../hooks/use-categories';
import { useBrands } from '../../hooks/use-brands';
import { useCart } from '../../hooks/use-cart';
import { useWishlist } from '../../hooks/use-wishlist';
import { useCompare } from '../../hooks/use-compare';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

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

  // Search & Filter state
  const [searchInput, setSearchInput] = React.useState(initialQuery);
  const [activeQuery, setActiveQuery] = React.useState(initialQuery);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 250000]);
  const [sortBy, setSortBy] = React.useState<string>('relevance');
  const [page, setPage] = React.useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Sync state if URL query changes
  React.useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchInput(q);
    setActiveQuery(q);
    setPage(1);
  }, [searchParams]);

  // Fetch categories & brands fallback
  const { data: categoriesData } = useCategories();
  const { data: brandsData } = useBrands();

  // Autocomplete search suggestions
  const { data: suggestionsData, isLoading: isSuggesting } = useSearchSuggestions(searchInput);
  const searchSuggestions = React.useMemo(() => {
    return (suggestionsData?.data || []).map((s) => ({
      id: s.id || s.slug || s.title,
      title: s.title,
      category: s.category || (s.type !== 'product' ? s.type.toUpperCase() : undefined),
      price: s.price,
      slug: s.slug,
    }));
  }, [suggestionsData]);

  // Fetch search results with faceted filters, sorting, and pagination
  const { data: searchResponse, isLoading, isError, refetch } = useSearch({
    query: activeQuery || undefined,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    brand: selectedBrands.length > 0 ? selectedBrands : undefined,
    inStock: inStockOnly ? true : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 250000 ? priceRange[1] : undefined,
    page,
    limit: 12,
    sortBy: sortBy as any,
  });

  const searchResult = searchResponse?.data;
  const products = searchResult?.items || [];
  const facets = searchResult?.facets;
  const totalPages = searchResult?.totalPages || 1;
  const totalItems = searchResult?.total || products.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim() !== activeQuery) {
      setActiveQuery(searchInput.trim());
      setPage(1);
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setSearchInput(term);
    setActiveQuery(term);
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  // Active filter tags calculation
  const activeFilterTags = React.useMemo(() => {
    const tags: Array<{ id: string; label: string; groupTitle?: string }> = [];
    if (activeQuery) {
      tags.push({ id: 'search', label: `"${activeQuery}"`, groupTitle: 'Keyword' });
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
  }, [activeQuery, selectedCategories, selectedBrands, inStockOnly, priceRange]);

  const handleRemoveFilterTag = (tagId: string) => {
    if (tagId === 'search') {
      setActiveQuery('');
      setSearchInput('');
      router.push('/search');
    } else if (tagId.startsWith('cat_')) {
      const cat = tagId.replace('cat_', '');
      setSelectedCategories((prev) => prev.filter((c) => c !== cat));
    } else if (tagId.startsWith('brand_')) {
      const brand = tagId.replace('brand_', '');
      setSelectedBrands((prev) => prev.filter((b) => b !== brand));
    } else if (tagId === 'in_stock') {
      setInStockOnly(false);
    } else if (tagId === 'price') {
      setPriceRange([0, 250000]);
    }
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setPriceRange([0, 250000]);
    setPage(1);
  };

  const categoryOptions = React.useMemo(() => {
    if (facets?.categories && facets.categories.length > 0) {
      return facets.categories.map((c) => ({
        id: c.value,
        label: c.label,
        count: c.count,
      }));
    }
    const cats = categoriesData?.data || [];
    return cats.map((c) => ({
      id: c.slug,
      label: c.name,
    }));
  }, [facets?.categories, categoriesData]);

  const brandOptions = React.useMemo(() => {
    if (facets?.brands && facets.brands.length > 0) {
      return facets.brands.map((b) => ({
        id: b.value,
        label: b.label,
        count: b.count,
      }));
    }
    const brands = brandsData?.data || [];
    return brands.map((b) => ({
      id: b.slug,
      label: b.name,
    }));
  }, [facets?.brands, brandsData]);

  const popularSearches = ['GeForce RTX 4080', 'Core i9', 'Ryzen 7 7800X3D', 'DDR5 6000MHz', 'NZXT H9', 'Liquid Cooler'];

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Search Header Banner */}
      <div className="border-b border-border bg-gradient-to-b from-card/70 to-background/50 backdrop-blur-md pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Search Results' },
            ]}
          />

          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <SearchIcon className="h-7 w-7 text-primary" />
              {activeQuery ? (
                <span>
                  Results for <span className="text-primary font-mono font-semibold">&ldquo;{activeQuery}&rdquo;</span>
                </span>
              ) : (
                <span>Search Catalog</span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Find high-performance processors, graphics cards, motherboards, memory, and accessories.
            </p>
          </div>

          {/* Search bar input with live suggestions dropdown */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <SearchInput
                value={searchInput}
                onChange={(val) => setSearchInput(val)}
                onSelectSuggestion={(item) => handleSuggestionClick(item.title)}
                suggestions={searchSuggestions}
                isLoading={isSuggesting}
                placeholder="Search by part number, chipset, brand, or model..."
                className="w-full bg-secondary/70 border-border/80 focus:border-primary pr-10"
              />
            </div>
            <Button type="submit" variant="primary" className="font-semibold shadow-md shadow-primary/20">
              Search
            </Button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Popular:
            </span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => handleSuggestionClick(term)}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 border border-border/60 text-muted-foreground hover:text-white hover:border-primary/50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Active Filters Bar */}
        {activeFilterTags.length > 0 && (
          <div className="mb-6">
            <ActiveFiltersBar
              filters={activeFilterTags}
              onRemove={handleRemoveFilterTag}
              onClearAll={handleClearAllFilters}
            />
          </div>
        )}

        {/* Top Control Bar: Total found, Sort, Mobile Filter Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="text-sm text-muted-foreground font-mono">
            {!isLoading && (
              <span>
                Showing <strong className="text-white">{products.length}</strong> of{' '}
                <strong className="text-white">{totalItems}</strong> matching parts
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden flex items-center gap-2 border-border"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeFilterTags.length > 0 && `(${activeFilterTags.length})`}
            </Button>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-44 text-xs h-9 bg-secondary/60 border-border"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
          {/* Desktop Filters Sidebar */}
          <aside
            className={`lg:block ${
              mobileFiltersOpen ? 'block' : 'hidden'
            } col-span-1 space-y-6 bg-card/40 border border-border/70 rounded-xl p-5 backdrop-blur-sm self-start sticky top-20`}
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter Hardware
              </h2>
              {activeFilterTags.length > 0 && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-mono"
                >
                  <FilterX className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* In Stock Only Switch */}
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-sm text-foreground">In Stock Only</span>
              <Switch
                checked={inStockOnly}
                onCheckedChange={(checked) => {
                  setInStockOnly(checked);
                  setPage(1);
                }}
              />
            </div>

            {/* Price Range Slider */}
            <div className="space-y-3 border-b border-border/40 pb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Max Price</span>
                <span className="font-mono text-primary font-bold">
                  ₹{priceRange[1].toLocaleString('en-IN')}
                </span>
              </div>
              <Slider
                min={1000}
                max={250000}
                step={5000}
                value={[priceRange[1]]}
                onValueChange={(val) => {
                  setPriceRange([0, val[0] ?? 250000]);
                  setPage(1);
                }}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>₹1,000</span>
                <span>₹2,50,000+</span>
              </div>
            </div>

            {/* Categories Group */}
            {categoryOptions.length > 0 && (
              <FilterGroup
                title="Category"
                options={categoryOptions}
                selectedValues={selectedCategories}
                onChange={(values) => {
                  setSelectedCategories(values);
                  setPage(1);
                }}
                searchable
              />
            )}

            {/* Brands Group */}
            {brandOptions.length > 0 && (
              <FilterGroup
                title="Manufacturer"
                options={brandOptions}
                selectedValues={selectedBrands}
                onChange={(values) => {
                  setSelectedBrands(values);
                  setPage(1);
                }}
                searchable
              />
            )}
          </aside>

          {/* Product Listing Content */}
          <div className="col-span-1 lg:col-span-3 space-y-8">
            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <ErrorState
                title="Unable to load search results"
                message="A network or server error occurred while querying parts catalog."
                onRetry={() => refetch()}
              />
            )}

            {/* Empty State */}
            {!isLoading && !isError && products.length === 0 && (
              <div className="bg-card/30 border border-border/80 rounded-2xl p-8 sm:p-12 text-center">
                <EmptyState
                  title={activeQuery ? `No components found for "${activeQuery}"` : 'No components found'}
                  description="Try broadening your search term, adjusting filters, or selecting from popular hardware categories below."
                  actionLabel="Clear Filters"
                  onAction={handleClearAllFilters}
                />

                <div className="mt-8 pt-8 border-t border-border/50 max-w-xl mx-auto">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Suggested Search Queries
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['GeForce RTX 4090', 'Intel Core i7', 'AMD Ryzen 9', 'DDR5 32GB', 'Corsair 850W', 'Samsung 990 PRO'].map(
                      (suggest) => (
                        <Button
                          key={suggest}
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuggestionClick(suggest)}
                          className="text-xs border-border/70 hover:border-primary"
                        >
                          {suggest}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Cards Grid */}
            {!isLoading && !isError && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isWishlisted={isInWishlist(product.id)}
                      isComparing={isComparing(product.id)}
                      onAddToCart={() => {
                        addToCart(product, 1);
                        toast({
                          title: 'Added to Cart',
                          description: `${product.name} added to your shopping cart.`,
                        });
                      }}
                      onToggleWishlist={async () => {
                        await toggleWishlist(product);
                        toast({
                          title: isInWishlist(product.id) ? 'Removed from Wishlist' : 'Saved to Wishlist',
                          description: `${product.name} updated in your saved items.`,
                        });
                      }}
                      onToggleCompare={() => {
                        toggleCompare(product);
                      }}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="pt-6 border-t border-border/60 flex justify-center">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Compare Tray */}
      <CompareTray
        items={compareItems}
        onRemoveItem={removeCompare}
        onClearAll={clearCompare}
        onCompareNow={() => setIsCompareOpen(true)}
      />

      {/* Side-by-Side Comparison Modal */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        items={compareItems}
        onRemoveItem={removeCompare}
        onAddToCart={(p: any) => {
          const prod = p?.product || p;
          addToCart(prod, 1);
          toast({
            title: 'Added to Cart',
            description: `${prod.name || 'Hardware'} added to your shopping cart.`,
          });
        }}
      />
    </div>
  );
}

export function SearchClient() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
          <div className="text-muted-foreground animate-pulse font-mono text-sm">Loading search catalog...</div>
        </div>
      }
    >
      <SearchPageContent />
    </React.Suspense>
  );
}

export default SearchClient;
