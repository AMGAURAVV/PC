import * as React from 'react';
import { ShoppingCart, Plus, Heart, Cpu, Star, Check, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from './card';
import { Badge } from './badge';
import { Price } from './price';
import { Button } from './button';

export interface ProductSpecSummary {
  label: string;
  value: string | number;
}

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string | undefined;
  name?: string | undefined;
  slug?: string | undefined;
  brand?: string | undefined;
  category?: string | undefined;
  imageUrl?: string | null | undefined;
  price?: number | undefined;
  compareAtPrice?: number | null | undefined;
  specs?: ProductSpecSummary[] | undefined;
  inStock?: boolean | undefined;
  isCompatible?: boolean | null | undefined;
  isWishlisted?: boolean | undefined;
  isComparing?: boolean | undefined;
  rating?: number | undefined;
  reviewsCount?: number | undefined;
  priority?: boolean | undefined;
  product?: any | undefined;
  onAddToCart?: ((idOrProduct: any) => void) | undefined;
  onAddToBuild?: ((idOrProduct: any) => void) | undefined;
  onToggleWishlist?: ((idOrProduct: any) => void) | undefined;
  onToggleCompare?: ((idOrProduct: any) => void) | undefined;
}

export function ProductCard({
  id,
  name,
  slug,
  brand,
  category,
  imageUrl,
  price,
  compareAtPrice,
  specs = [],
  inStock,
  isCompatible = null,
  isWishlisted = false,
  isComparing = false,
  rating,
  reviewsCount,
  priority = false,
  product,
  onAddToCart,
  onAddToBuild,
  onToggleWishlist,
  onToggleCompare,
  className,
  ...props
}: ProductCardProps) {
  const resolvedId = id || product?.id || '';
  const resolvedName = name || product?.name || '';
  const resolvedSlug =
    slug ||
    product?.slug ||
    (resolvedName ? resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : resolvedId);
  const resolvedBrand =
    brand || (typeof product?.brand === 'string' ? product.brand : product?.brand?.name) || '';
  const resolvedCategory =
    category || (typeof product?.category === 'string' ? product.category : product?.category?.name) || '';
  const resolvedImage =
    imageUrl !== undefined ? imageUrl : product?.images?.[0]?.url || product?.imageUrl || null;
  const resolvedPrice = price !== undefined ? price : product?.price || 0;
  const resolvedCompareAtPrice =
    compareAtPrice !== undefined ? compareAtPrice : product?.compareAtPrice;
  const resolvedInStock =
    inStock !== undefined
      ? inStock
      : product?.stock !== undefined
      ? product.stock > 0
      : product?.inStock !== undefined
      ? product.inStock
      : true;

  const discountPercent =
    resolvedCompareAtPrice && resolvedCompareAtPrice > resolvedPrice
      ? Math.round(((resolvedCompareAtPrice - resolvedPrice) / resolvedCompareAtPrice) * 100)
      : 0;

  return (
    <Card
      variant="technical"
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl transition-all duration-300 hover:border-cyan-500/50 hover:shadow-glow-cyan/20 bg-cyber-950/80',
        className,
      )}
      {...props}
    >
      {/* Top badges & actions bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap pointer-events-auto">
          {discountPercent > 0 && (
            <Badge variant="destructive" className="text-[10px] font-mono font-bold">
              -{discountPercent}%
            </Badge>
          )}

          {resolvedCategory && (
            <Badge variant="tech" className="text-[10px] uppercase font-bold tracking-wider">
              {resolvedCategory}
            </Badge>
          )}

          {isCompatible === true && (
            <Badge variant="compatible" dot className="text-[10px]">
              Compatible
            </Badge>
          )}

          {isCompatible === false && (
            <Badge variant="incompatible" dot className="text-[10px]">
              Incompatible
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product || resolvedId);
              }}
              aria-label="Compare"
              title="Add to Compare"
              className={cn(
                'rounded-full p-2 bg-cyber-900/80 backdrop-blur-md border border-border/60 transition-colors',
                isComparing
                  ? 'text-cyan-400 border-cyan-500/80 bg-cyan-950/80'
                  : 'text-muted-foreground hover:text-cyan-400 hover:border-cyan-500/40',
              )}
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          )}

          {onToggleWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(product || resolvedId);
              }}
              aria-label="Wishlist"
              title="Add to Wishlist"
              className={cn(
                'rounded-full p-2 bg-cyber-900/80 backdrop-blur-md border border-border/60 transition-colors',
                isWishlisted
                  ? 'text-rose-500 hover:text-rose-400 border-rose-500/60 bg-rose-950/40'
                  : 'text-muted-foreground hover:text-rose-400 hover:border-rose-500/40',
              )}
            >
              <Heart className={cn('h-3.5 w-3.5', isWishlisted && 'fill-current')} />
            </button>
          )}
        </div>
      </div>

      {/* Product Image Stage */}
      <a
        href={`/products/${resolvedSlug}`}
        className="relative aspect-[4/3] w-full overflow-hidden bg-cyber-950/60 p-4 flex items-center justify-center border-b border-border/40 cursor-pointer block"
      >
        {resolvedImage ? (
          <img
            src={resolvedImage}
            alt={resolvedName}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground/40">
            <Cpu className="h-16 w-16 stroke-1 mb-1 text-cyber-500" />
            <span className="text-[11px] font-mono text-cyber-500">HARDWARE PREVIEW</span>
          </div>
        )}
      </a>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            {resolvedBrand ? (
              <a
                href={`/brands/${resolvedBrand.toLowerCase()}`}
                className="text-xs uppercase tracking-wider text-cyan-400 font-semibold hover:underline"
              >
                {resolvedBrand}
              </a>
            ) : <span />}

            {rating !== undefined && (
              <div className="flex items-center gap-1 text-xs text-amber-400 font-mono">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating.toFixed(1)}</span>
                {reviewsCount !== undefined && (
                  <span className="text-[10px] text-muted-foreground">({reviewsCount})</span>
                )}
              </div>
            )}
          </div>

          <a href={`/products/${resolvedSlug}`} className="block">
            <h4
              className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-cyan-300 transition-colors"
              title={resolvedName}
            >
              {resolvedName}
            </h4>
          </a>

          {/* Technical Spec Chips */}
          {specs.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {specs.slice(0, 3).map((spec, i) => (
                <span
                  key={i}
                  className="inline-flex items-center text-[10px] font-mono bg-cyber-800/90 text-slate-300 px-2 py-0.5 rounded border border-cyber-700/80"
                >
                  <span className="text-muted-foreground mr-1">{spec.label}:</span>
                  {spec.value}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Price & Actions Bottom Bar */}
        <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Price amount={resolvedPrice} compareAt={resolvedCompareAtPrice} size="md" />

            <span
              className={cn(
                'text-[11px] font-medium flex items-center gap-1 font-mono',
                resolvedInStock ? 'text-emerald-400' : 'text-rose-400',
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {resolvedInStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onAddToBuild && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 border-border/80 hover:border-cyan-500/50 hover:text-cyan-400"
                onClick={() => onAddToBuild(product || resolvedId)}
                disabled={!resolvedInStock}
              >
                <Plus className="h-3.5 w-3.5" />
                Build
              </Button>
            )}

            {onAddToCart && (
              <Button
                variant="gaming"
                size="sm"
                className={cn('w-full text-xs gap-1.5', !onAddToBuild && 'col-span-2')}
                onClick={() => onAddToCart(product || resolvedId)}
                disabled={!resolvedInStock}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Add to Cart
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
