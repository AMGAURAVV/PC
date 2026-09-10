'use client';

import * as React from 'react';
import Image from 'next/image';
import { Check, Plus, AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import { Product, CompatibilityStatus } from '@pc-platform/types';
import { Button, Badge, Price } from '@pc-platform/ui';

interface ComponentCardProps {
  product: Product;
  isSelected?: boolean | undefined;
  compatibilityStatus?: CompatibilityStatus | undefined;
  compatibilityReason?: string | undefined;
  onSelect: (product: Product) => void;
  className?: string | undefined;
}

export function ComponentCard({
  product,
  isSelected = false,
  compatibilityStatus = 'compatible',
  compatibilityReason,
  onSelect,
  className = '',
}: ComponentCardProps) {
  const imageUrl = product.images?.[0]?.url || '/placeholder-hardware.png';
  const isOutOfStock = product.stock <= 0;

  // Extract key specs to display as chips
  const specChips: { label: string; value: string | number }[] = [];
  if (product.specifications) {
    const keys = Object.keys(product.specifications);
    for (const key of keys.slice(0, 4)) {
      const val = product.specifications[key];
      if (val !== undefined && val !== null && val !== '') {
        // Pretty format label
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        specChips.push({ label: formattedKey, value: String(val) });
      }
    }
  }

  const renderCompatBadge = () => {
    switch (compatibilityStatus) {
      case 'incompatible':
        return (
          <Badge variant="destructive" className="gap-1 font-mono text-[10px]">
            <XCircle className="w-3 h-3" /> Incompatible
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" className="gap-1 font-mono text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Warning
          </Badge>
        );
      case 'compatible':
      default:
        return (
          <Badge variant="success" className="gap-1 font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Compatible
          </Badge>
        );
    }
  };

  return (
    <div
      className={`group relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 bg-card hover:border-primary/50 hover:shadow-md ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border/80'
      } ${className}`}
    >
      {/* Left: Thumbnail & Info */}
      <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0 flex items-center justify-center p-2">
          {imageUrl.startsWith('/') || imageUrl.startsWith('http') ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 80px, 96px"
              className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="text-xs text-muted-foreground font-mono">No Image</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-semibold uppercase text-primary tracking-wider">
              {product.brand}
            </span>
            {renderCompatBadge()}
            {isOutOfStock && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/40">
                Out of Stock
              </Badge>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
            {product.name}
          </h3>

          {/* Specs Chips */}
          {specChips.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {specChips.map((chip, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
                >
                  <span className="opacity-70">{chip.label}:</span>{' '}
                  <span className="text-foreground font-medium">{chip.value}</span>
                </span>
              ))}
            </div>
          )}

          {compatibilityReason && compatibilityStatus !== 'compatible' && (
            <p className="mt-1.5 text-xs text-amber-400/90 flex items-center gap-1 font-mono">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{compatibilityReason}</span>
            </p>
          )}
        </div>
      </div>

      {/* Right: Price & Action */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 mt-4 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0 sm:ml-4 sm:min-w-[140px]">
        <div className="text-left sm:text-right">
          <Price amount={product.price} size="lg" className="font-bold text-foreground" />
          <div className="text-[11px] text-muted-foreground">Incl. GST</div>
        </div>

        <Button
          size="sm"
          variant={isSelected ? 'outline' : 'default'}
          disabled={isOutOfStock}
          onClick={() => onSelect(product)}
          className={`gap-1.5 font-semibold transition-all ${
            isSelected
              ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-4 h-4" /> Selected
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Select
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
