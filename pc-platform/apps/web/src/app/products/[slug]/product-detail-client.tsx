'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Breadcrumbs,
  Price,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ProductCard,
  ProductCardSkeleton,
  ErrorState,
  CompareTray,
  useToast,
  Input,
  Textarea,
  Label,
} from '@pc-platform/ui';
import {
  ShoppingCart,
  Heart,
  Layers,
  Star,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  Cpu,
} from 'lucide-react';
import { useProduct, useProducts } from '../../../hooks/use-products';
import { useProductReviews, useCreateReview } from '../../../hooks/use-reviews';
import { useCart } from '../../../hooks/use-cart';
import { useWishlist } from '../../../hooks/use-wishlist';
import { useCompare } from '../../../hooks/use-compare';
import { usePriceHistory } from '../../../hooks/use-prices';

// Lazy load heavy chart and comparison modal to reduce initial JS execution
const PriceHistoryChart = dynamic(
  () =>
    import('../../../components/products/price-history-chart').then(
      (m) => m.PriceHistoryChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-cyber-900/60 rounded-2xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-mono text-cyan-400/60">LOADING TELEMETRY ENGINE...</span>
      </div>
    ),
  },
);

const CompareModal = dynamic(
  () => import('@pc-platform/ui').then((m) => m.CompareModal),
  { ssr: false },
);

export interface ProductDetailClientProps {
  slug: string;
  initialProduct?: any;
}

export function ProductDetailClient({ slug, initialProduct }: ProductDetailClientProps) {
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

  // Active gallery image
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);

  // Review form state
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewTitle, setReviewTitle] = React.useState('');
  const [reviewComment, setReviewComment] = React.useState('');

  // Fetch product by slug from API (hydrated with SSR initialProduct)
  const { data: productResponse, isLoading, isError } = useProduct(
    slug,
    true,
    initialProduct ? { initialData: { success: true, data: initialProduct } } : undefined,
  );
  const product = productResponse?.data;

  // Fetch price history telemetry
  const { data: priceSummaryResponse, isLoading: isPriceHistoryLoading } = usePriceHistory(
    product?.id || '',
    { enabled: Boolean(product?.id) },
  );
  const priceSummary = priceSummaryResponse?.data;

  // Fetch reviews for this product
  const { data: reviewsResponse, refetch: refetchReviews } = useProductReviews(product?.id || '');
  const reviews = reviewsResponse?.data || [];

  // Create review mutation
  const createReviewMutation = useCreateReview(product?.id || '');

  // Fetch related products in same category
  const { data: relatedResponse } = useProducts({
    category: product?.category?.slug,
    limit: 4,
  });
  const relatedProducts = (relatedResponse?.data || []).filter((p: any) => p.id !== product?.id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="h-6 w-64 bg-cyber-900 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 h-96 bg-cyber-900 rounded-2xl animate-pulse" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-8 w-3/4 bg-cyber-900 rounded animate-pulse" />
            <div className="h-6 w-1/3 bg-cyber-900 rounded animate-pulse" />
            <div className="h-24 w-full bg-cyber-900 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ErrorState
          title="HARDWARE NOT FOUND"
          message={`Unable to retrieve component telemetry for slug "${slug}". The product may have been archived or is temporarily unavailable.`}
          retryLabel="RETURN TO CATALOG"
          onRetry={() => (window.location.href = '/products')}
        />
      </div>
    );
  }

  // Gallery images fallback
  const galleryImages =
    product.images && product.images.length > 0
      ? product.images.map((img: any) => img.url)
      : [];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewComment.trim()) return;

    try {
      await createReviewMutation.mutateAsync({
        productId: product.id,
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      toast({
        title: 'REVIEW SUBMITTED',
        description: 'Thank you for your hardware feedback.',
        variant: 'success',
      });
      setReviewTitle('');
      setReviewComment('');
      refetchReviews();
    } catch {
      toast({
        title: 'SUBMISSION FAILED',
        description: 'Please sign in to post verified hardware reviews.',
        variant: 'destructive',
      });
    }
  };

  const brandSlug = product.brand?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Components', href: '/products' },
          { label: product.brand || 'Hardware', href: brandSlug ? `/brands/${brandSlug}` : '/products' },
          { label: product.name },
        ]}
      />

      {/* Main Product Showcase Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Stage */}
          <div className="relative aspect-[4/3] w-full rounded-2xl border border-border/80 bg-cyber-950/80 p-8 flex items-center justify-center overflow-hidden shadow-2xl">
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[selectedImageIndex] || galleryImages[0]}
                alt={product.name}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="max-h-full max-w-full object-contain transition-all duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground/50">
                <Cpu className="w-20 h-20 stroke-1 mb-2" />
                <span className="font-mono text-xs">OFFICIAL COMPONENT DIAGRAM</span>
              </div>
            )}

            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="absolute top-4 left-4">
                <Badge variant="destructive" className="font-mono text-xs font-bold">
                  SAVE {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnail Selector */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {galleryImages.map((img: any, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl border p-1 bg-cyber-900 flex items-center justify-center overflow-hidden transition-all shrink-0 ${
                    idx === selectedImageIndex
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40'
                      : 'border-border/60 hover:border-border'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Specifications, Price & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            {product.brand && (
              <a
                href={brandSlug ? `/brands/${brandSlug}` : '/products'}
                className="text-xs uppercase tracking-widest font-mono font-bold text-cyan-400 hover:underline"
              >
                {product.brand}
              </a>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-white font-mono leading-tight">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
              <span className="text-foreground font-semibold">SKU: {product.sku}</span>
              <span>•</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">4.8</span>
                <a href="#reviews" className="text-muted-foreground underline hover:text-cyan-400 ml-1">
                  ({reviews.length} reviews)
                </a>
              </div>
            </div>
          </div>

          {/* Price Block */}
          <div className="p-4 rounded-xl border border-border/80 bg-cyber-900/40 space-y-2">
            <div className="flex flex-wrap items-baseline gap-3">
              <Price amount={product.price} compareAt={product.compareAtPrice} size="xl" />
              <Badge
                variant={product.stock > 0 ? 'compatible' : 'incompatible'}
                dot
                className="text-xs font-mono"
              >
                {product.stock > 0 ? 'In Stock (Dispatching in 24h)' : 'Temporarily Depleted'}
              </Badge>
              {priceSummary && priceSummary.lowestPrice > 0 && product.price <= priceSummary.lowestPrice && (
                <Badge variant="success" className="text-[10px] font-mono">
                  ALL-TIME LOW
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
              <p>Inclusive of all taxes & verified warranty. Insured express delivery.</p>
              {priceSummary && priceSummary.lowestPrice > 0 && (
                <span className="text-cyan-400 font-semibold hidden sm:inline">
                  Lowest recorded: ₹{priceSummary.lowestPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Description Summary */}
          <p className="text-sm text-cyber-300 leading-relaxed">
            {product.description ||
              'High-performance PC component engineered for extreme thermal reliability, deterministic clocks, and seamless compatibility with modern multi-core platforms.'}
          </p>

          {/* Quantity & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg bg-cyber-900/80">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-white"
                >
                  -
                </button>
                <span className="px-3 py-2 text-xs font-mono font-bold text-white min-w-[2.5rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-white"
                >
                  +
                </button>
              </div>

              <Button
                variant="gaming"
                size="lg"
                onClick={() => {
                  addToCart(product, quantity);
                  toast({
                    title: 'ADDED TO SHOPPING CART',
                    description: `${quantity}x ${product.name} added.`,
                    variant: 'success',
                  });
                }}
                disabled={product.stock <= 0}
                className="flex-1 gap-2 font-mono text-xs tracking-wider"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>ADD TO CART</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = `/builder?part=${product.id}`)}
                className="gap-1.5 text-xs font-mono"
              >
                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                <span>ADD TO BUILD</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleWishlist(product)}
                className={`gap-1.5 text-xs font-mono ${
                  isInWishlist(product.id) ? 'text-rose-400 border-rose-500/50' : ''
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                <span>{isInWishlist(product.id) ? 'WISHLISTED' : 'WISHLIST'}</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleCompare(product)}
                className={`gap-1.5 text-xs font-mono ${
                  isComparing(product.id) ? 'text-cyan-400 border-cyan-500/50' : ''
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isComparing(product.id) ? 'COMPARING' : 'COMPARE'}</span>
              </Button>
            </div>
          </div>

          {/* Compatibility Trust Box */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>GUARANTEED RULE ENGINE COMPATIBILITY</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When added to the Nexus Custom PC Builder, this component will be evaluated against your motherboard chipset, CPU cooler clearance, and PSU 12V transient rails.
            </p>
          </div>
        </div>
      </section>

      {/* Tabs: Specifications, Price History & Reviews */}
      <section className="pt-6 border-t border-border/60">
        <Tabs defaultValue="specifications">
          <TabsList>
            <TabsTrigger value="specifications">Full Specifications</TabsTrigger>
            <TabsTrigger value="price-history">Price History & Trends</TabsTrigger>
            <TabsTrigger value="reviews" id="reviews">
              Reviews & Benchmarks ({reviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Price History & Trends */}
          <TabsContent value="price-history" className="pt-4">
            <PriceHistoryChart
              summary={priceSummary}
              isLoading={isPriceHistoryLoading}
              productName={product?.name}
            />
          </TabsContent>

          {/* Tab 1: Detailed Specifications Table */}
          <TabsContent value="specifications" className="space-y-4 pt-4">
            <h3 className="text-base font-bold font-mono text-white">
              DETAILED HARDWARE SPECIFICATIONS
            </h3>

            <div className="rounded-xl border border-border/80 bg-cyber-950/60 overflow-hidden">
              <table className="w-full text-left text-xs font-mono divide-y divide-border/60">
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-cyber-900/40">
                    <td className="p-3 text-muted-foreground w-1/3">Component Category</td>
                    <td className="p-3 text-foreground font-medium">{product.componentCategory}</td>
                  </tr>
                  <tr className="hover:bg-cyber-900/40">
                    <td className="p-3 text-muted-foreground">Manufacturer / Brand</td>
                    <td className="p-3 text-foreground font-medium">{product.brand || '—'}</td>
                  </tr>
                  <tr className="hover:bg-cyber-900/40">
                    <td className="p-3 text-muted-foreground">Model Name / Number</td>
                    <td className="p-3 text-foreground font-medium">{product.model || product.name}</td>
                  </tr>
                  <tr className="hover:bg-cyber-900/40">
                    <td className="p-3 text-muted-foreground">Base SKU</td>
                    <td className="p-3 text-foreground font-medium">{product.sku}</td>
                  </tr>

                  {/* Dynamically render all structured specifications */}
                  {product.specifications &&
                    Object.entries(product.specifications).map(([key, value]) => (
                      <tr key={key} className="hover:bg-cyber-900/40">
                        <td className="p-3 text-muted-foreground uppercase">{key}</td>
                        <td className="p-3 text-cyan-300 font-semibold">{String(value)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Tab 2: Reviews */}
          <TabsContent value="reviews" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Reviews List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-base font-bold font-mono text-white">
                  VERIFIED HARDWARE REVIEWS
                </h3>

                {reviews.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs font-mono text-muted-foreground">
                    No customer reviews yet. Be the first to share your benchmarks!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl border border-border/70 bg-cyber-900/40 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-cyber-700'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{rev.title}</h4>
                        <p className="text-xs text-cyber-300 leading-relaxed">{rev.comment}</p>
                        <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-muted-foreground">
                          <span>By {rev.userName}</span>
                          {rev.verifiedPurchase && (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Verified Rig Owner
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review Submission Form */}
              <div className="lg:col-span-5 p-6 rounded-2xl border border-border/80 bg-cyber-950/60 space-y-4">
                <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                  SUBMIT YOUR REVIEW
                </h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Star Rating</Label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-cyber-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label required>Review Headline</Label>
                    <Input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="e.g. Unmatched 1440p gaming thermals"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label required>Hardware Experience & Benchmarks</Label>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share clock speeds, temperatures, fan curve, or installation notes..."
                      required
                    />
                  </div>

                  <Button variant="gaming" size="sm" type="submit" className="w-full font-mono text-xs">
                    POST HARDWARE REVIEW
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Related Hardware & Accessories */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-mono text-white">
              RECOMMENDED HARDWARE PAIRINGS
            </h2>
            <a href="/products" className="text-xs font-mono text-cyan-400 hover:underline">
              View full catalog →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel: any) => (
              <ProductCard
                key={rel.id}
                product={rel}
                isWishlisted={isInWishlist(rel.id)}
                isComparing={isComparing(rel.id)}
                onToggleWishlist={() => toggleWishlist(rel)}
                onToggleCompare={() => toggleCompare(rel)}
                onAddToCart={() => {
                  addToCart(rel, 1);
                  toast({
                    title: 'ADDED TO CART',
                    description: `${rel.name} added.`,
                  });
                }}
              />
            ))}
          </div>
        </section>
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
              description: `${item.name} added to cart.`,
              variant: 'success',
            });
          }
        }}
      />
    </div>
  );
}
