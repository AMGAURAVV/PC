'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Cpu,
  CircuitBoard,
  Fan,
  Layers,
  HardDrive,
  Database,
  Zap,
  Box,
  Wind,
  Monitor,
  Keyboard,
  Mouse,
  Disc,
  Headphones,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Product } from '@pc-platform/types';
import { BuilderCategoryConfig, BuilderSlotId } from './types';
import { Button, Badge, Price } from '@pc-platform/ui';

const CATEGORY_ICONS: Record<BuilderSlotId, LucideIcon> = {
  cpu: Cpu,
  motherboard: CircuitBoard,
  cooler: Fan,
  ram: Layers,
  gpu: HardDrive,
  storage: Database,
  psu: Zap,
  case: Box,
  fans: Wind,
  monitor: Monitor,
  keyboard: Keyboard,
  mouse: Mouse,
  os: Disc,
  accessories: Headphones,
};

interface SelectedComponentProps {
  category: BuilderCategoryConfig;
  selection?: { product: Product; quantity: number } | undefined;
  onChoose: (slotId: BuilderSlotId) => void;
  onReplace: (slotId: BuilderSlotId) => void;
  onRemove: (slotId: BuilderSlotId) => void;
  onUpdateQuantity?: ((slotId: BuilderSlotId, quantity: number) => void) | undefined;
  className?: string | undefined;
}

export function SelectedComponent({
  category,
  selection,
  onChoose,
  onReplace,
  onRemove,
  onUpdateQuantity,
  className = '',
}: SelectedComponentProps) {
  const Icon = CATEGORY_ICONS[category.id] || Box;

  if (!selection) {
    // Empty Slot State
    return (
      <div
        className={`group relative flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 rounded-xl border border-dashed border-border/80 hover:border-primary/60 bg-card/40 hover:bg-card/80 transition-all duration-200 ${className}`}
      >
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="p-3 rounded-lg bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
              {category.required ? (
                <Badge variant="warning" className="text-[10px] font-mono py-0 h-4">
                  Required
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground/70">Optional</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{category.helpText}</p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onChoose(category.id)}
          className="mt-3 sm:mt-0 w-full sm:w-auto gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary transition-all font-semibold"
        >
          <Plus className="w-4 h-4" /> Select {category.name.split(' ')[0]}
        </Button>
      </div>
    );
  }

  const { product, quantity } = selection;
  const imageUrl = product.images?.[0]?.url || '/placeholder-hardware.png';

  // Key specs
  const keySpecs: string[] = [];
  if (product.specifications) {
    for (const [k, v] of Object.entries(product.specifications).slice(0, 3)) {
      if (v) keySpecs.push(`${k}: ${v}`);
    }
  }

  return (
    <div
      className={`group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-border/90 bg-card hover:border-primary/40 shadow-sm transition-all duration-200 ${className}`}
    >
      {/* Category Indicator Tag */}
      <div className="absolute top-2 right-2 sm:static sm:mr-3 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 text-[11px] font-mono text-muted-foreground">
          <Icon className="w-3.5 h-3.5 text-primary" />
          <span>{category.name}</span>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 w-full sm:w-auto">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted/40 border border-border/50 overflow-hidden shrink-0 flex items-center justify-center p-1.5">
          {imageUrl.startsWith('/') || imageUrl.startsWith('http') ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          ) : (
            <Icon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-6 sm:pr-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold uppercase text-primary">
              {product.brand}
            </span>
            <span className="sm:hidden text-[11px] text-muted-foreground font-mono">
              • {category.name}
            </span>
          </div>

          <Link
            href={`/products/${product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
            target="_blank"
            className="text-sm sm:text-base font-bold text-foreground hover:text-primary transition-colors line-clamp-1 inline-flex items-center gap-1 group/link"
          >
            <span>{product.name}</span>
            <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </Link>

          {keySpecs.length > 0 && (
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 line-clamp-1">
              {keySpecs.join(' | ')}
            </p>
          )}

          {/* Quantity Controls for Multi-item categories */}
          {['ram', 'fans', 'storage'].includes(category.id) && onUpdateQuantity && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Qty:</span>
              <div className="flex items-center border border-border/80 rounded-md bg-muted/20">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => onUpdateQuantity(category.id, quantity - 1)}
                  className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  -
                </button>
                <span className="px-2 py-0.5 text-xs font-mono font-bold">{quantity}</span>
                <button
                  type="button"
                  disabled={quantity >= 8}
                  onClick={() => onUpdateQuantity(category.id, quantity + 1)}
                  className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price & Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0 sm:ml-4">
        <div className="text-left sm:text-right">
          <Price amount={product.price * quantity} size="md" className="font-bold text-foreground" />
          {quantity > 1 && (
            <div className="text-[10px] text-muted-foreground font-mono">
              ₹{product.price.toLocaleString('en-IN')} each
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onReplace(category.id)}
            title="Replace with different hardware"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replace
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(category.id)}
            title="Remove from build"
            className="h-8 px-2 text-xs text-destructive/80 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
