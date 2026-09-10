'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Button,
  Badge,
  ProductCard,
  ProductCardSkeleton,
  EmptyState,
  ErrorState,
  CompareTray,
  useToast,
} from '@pc-platform/ui';

const CompareModal = dynamic(
  () => import('@pc-platform/ui').then((m) => m.CompareModal),
  { ssr: false },
);
import {
  Cpu,
  Layers,
  HardDrive,
  Zap,
  Box,
  Fan,
  Wrench,
  ShieldCheck,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
  Truck,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useProducts } from '../hooks/use-products';
import { useCategories } from '../hooks/use-categories';
import { useBrands } from '../hooks/use-brands';
import { useCart } from '../hooks/use-cart';
import { useWishlist } from '../hooks/use-wishlist';
import { useCompare } from '../hooks/use-compare';

const CATEGORY_TILES = [
  { name: 'Processors', slug: 'processors', icon: Cpu, desc: 'Intel Core 14th Gen & AMD Ryzen 9000/7000' },
  { name: 'Graphics Cards', slug: 'graphics-cards', icon: Layers, desc: 'NVIDIA RTX 40-Series & AMD Radeon RX 7000' },
  { name: 'Motherboards', slug: 'motherboards', icon: Sliders, desc: 'Z790, B760, X670E, B650 chipset boards' },
  { name: 'Memory', slug: 'memory', icon: Sparkles, desc: 'High-speed DDR5 (6000-7200 MT/s) & DDR4 kits' },
  { name: 'Storage', slug: 'storage', icon: HardDrive, desc: 'Gen5 and Gen4 NVMe M.2 SSDs up to 14,000 MB/s' },
  { name: 'Power Supplies', slug: 'power-supplies', icon: Zap, desc: 'ATX 3.0 PCIe 5.0 Gold, Platinum & Titanium' },
  { name: 'Cases & Chassis', slug: 'cases', icon: Box, desc: 'Panoramic dual-chamber and high-airflow chassis' },
  { name: 'Cooling Systems', slug: 'cooling', icon: Fan, desc: '360mm AIO liquid coolers & high-efficiency air coolers' },
];

export function HomePageClient() {
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

  // Fetch featured products from backend API
  const { data: featuredData, isLoading: isFeaturedLoading, isError: isFeaturedError } = useProducts({
    limit: 6,
  });

  // Fetch all categories from backend API
  const { data: categoriesData } = useCategories();

  // Fetch brands from backend API
  const { data: brandsData } = useBrands();

  const featuredProducts = featuredData?.data || [];
  const brands = brandsData?.data || [];

  return (
    <div className="min-h-screen space-y-16 sm:space-y-24 pb-20">
      {/* 1. Hero Hardware Section */}
      <section className="relative overflow-hidden border-b border-border/80 bg-cyber-950 py-16 sm:py-24">
        {/* Glow backdrop effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-500/15 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyber-900/80 px-3.5 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan-300">
              AUTHORITATIVE COMPATIBILITY ENGINE • ONLINE
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-mono leading-tight max-w-4xl mx-auto">
            PRECISION RIGS.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500">
              ZERO BOTTLENECKS.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-cyber-300 max-w-2xl mx-auto leading-relaxed">
            India&apos;s premier custom PC configurator and enthusiast component store. Every part evaluated by multi-rule clearance, socket, and power telemetry.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a href="/builder">
              <Button variant="gaming" size="lg" className="gap-2 text-sm font-mono tracking-wider h-12 px-6">
                <Wrench className="w-4 h-4" />
                <span>START CUSTOM BUILD</span>
              </Button>
            </a>

            <a href="/products">
              <Button variant="outline" size="lg" className="gap-2 text-sm font-mono tracking-wider h-12 px-6 border-border/80 hover:border-cyan-500/60">
                <span>EXPLORE ALL HARDWARE</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Quick Telemetry Chips */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-muted-foreground border-t border-border/40 max-w-3xl mx-auto">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-foreground font-semibold">64 Rule Matrices</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span className="text-foreground font-semibold">100% Genuine Brand Warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <span className="text-foreground font-semibold">Insured Rigid Transit</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Browse by Category Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest">
              <Sliders className="w-4 h-4" />
              HARDWARE ARCHITECTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              BROWSE BY COMPONENT CATEGORY
            </h2>
          </div>
          <a
            href="/products"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold group"
          >
            <span>VIEW ALL CATEGORIES</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORY_TILES.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group block p-6 rounded-2xl border border-border/70 bg-cyber-950/60 hover:bg-cyber-900/40 hover:border-cyan-500/60 transition-all duration-300 relative overflow-hidden shadow-lg hover:shadow-glow-cyan/15"
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:from-cyan-500/20 transition-all" />
                <div className="w-12 h-12 rounded-xl bg-cyber-900 border border-border/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 group-hover:border-cyan-500/60 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {cat.desc}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-mono text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>EXPLORE CATALOG</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Hardware Grid (Live API Data) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-purple-400 uppercase font-bold tracking-widest">
              <Flame className="w-4 h-4 text-amber-400" />
              VERIFIED FLAGSHIP HARDWARE
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              FEATURED HARDWARE RELEASES
            </h2>
          </div>
          <a
            href="/deals"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold group"
          >
            <span>VIEW DEALS & PROMOTIONS</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {isFeaturedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isFeaturedError ? (
          <ErrorState
            title="FAILED TO RETRIEVE HARDWARE RELEASES"
            message="Unable to communicate with the hardware telemetry server. Ensure the API service is active."
            errorCode="CATALOG_ERR_503"
          />
        ) : featuredProducts.length === 0 ? (
          <EmptyState
            icon="cpu"
            title="NO FEATURED HARDWARE AT THIS TIME"
            description="Our hardware team is validating new components. Check back shortly."
            actionLabel="BROWSE FULL CATALOG"
            onAction={() => (window.location.href = '/products')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product: any, idx: number) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={idx < 2}
                isWishlisted={isInWishlist(product.id)}
                isComparing={isComparing(product.id)}
                rating={4.8}
                reviewsCount={32}
                onToggleWishlist={() => toggleWishlist(product)}
                onToggleCompare={() => toggleCompare(product)}
                onAddToCart={() => {
                  addToCart(product, 1);
                  toast({
                    title: 'ADDED TO CART',
                    description: `${product.name} added to your shopping cart.`,
                  });
                }}
                onAddToBuild={() => {
                  window.location.href = `/builder?part=${product.id}`;
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Deals Spotlight Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-border/80 bg-gradient-to-r from-cyan-950/40 via-cyber-950 to-purple-950/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <Badge variant="gaming" dot pulse>
                LIMITED TIME HARDWARE DROPS
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white font-mono leading-tight">
                UPGRADE YOUR RIG WITH UP TO <span className="text-cyan-400">30% OFF</span> SELECT CPUS & GPUS
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                Exclusive partner pricing on factory-overclocked graphics cards, high-density DDR5 memory kits, and PCIe 5.0 solid-state drives.
              </p>
              <div className="pt-2">
                <a href="/deals">
                  <Button variant="gaming" size="lg" className="gap-2 font-mono text-xs">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span>EXPLORE ALL DEALS</span>
                  </Button>
                </a>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3 font-mono text-xs text-cyber-300">
              <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-border/60 flex items-center justify-between">
                <span>DDR5 6000MT/s Kits</span>
                <span className="text-cyan-400 font-bold">FROM ₹8,999</span>
              </div>
              <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-border/60 flex items-center justify-between">
                <span>Gen4 2TB NVMe SSDs</span>
                <span className="text-cyan-400 font-bold">FROM ₹11,499</span>
              </div>
              <div className="p-3.5 rounded-xl bg-cyber-900/80 border border-border/60 flex items-center justify-between">
                <span>850W Gold ATX 3.0</span>
                <span className="text-cyan-400 font-bold">FROM ₹10,999</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Top Hardware Brands */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase font-bold tracking-widest">
              <Award className="w-4 h-4" />
              OFFICIAL PARTNERS
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
              AUTHORIZED HARDWARE BRANDS
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {(brands.length > 0 ? brands : [
            { name: 'NVIDIA', slug: 'nvidia' },
            { name: 'AMD', slug: 'amd' },
            { name: 'Intel', slug: 'intel' },
            { name: 'ASUS', slug: 'asus' },
            { name: 'MSI', slug: 'msi' },
            { name: 'Corsair', slug: 'corsair' },
          ]).map((b) => (
            <a
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="p-4 rounded-xl border border-border/60 bg-cyber-950/60 hover:bg-cyber-900/60 hover:border-cyan-500/50 flex flex-col items-center justify-center text-center transition-all group shadow-sm"
            >
              <span className="text-sm font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                {b.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground mt-1">
                Explore Lineup →
              </span>
            </a>
          ))}
        </div>
      </section>

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
