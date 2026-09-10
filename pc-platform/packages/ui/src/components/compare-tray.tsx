import * as React from 'react';
import { X, Layers, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Price } from './price';

export interface CompareProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string | null | undefined;
  category?: string | undefined;
}

export interface CompareTrayProps {
  items: CompareProductItem[];
  onRemove?: ((id: string) => void) | undefined;
  onRemoveItem?: ((id: string) => void) | undefined;
  onClear?: (() => void) | undefined;
  onClearAll?: (() => void) | undefined;
  onOpenCompare?: (() => void) | undefined;
  onCompareNow?: (() => void) | undefined;
  maxItems?: number | undefined;
  className?: string | undefined;
}

export function CompareTray({
  items,
  onRemove,
  onRemoveItem,
  onClear,
  onClearAll,
  onOpenCompare,
  onCompareNow,
  maxItems = 4,
  className,
}: CompareTrayProps) {
  const handleRemove = onRemove || onRemoveItem || (() => {});
  const handleClear = onClear || onClearAll || (() => {});
  const handleOpen = onOpenCompare || onCompareNow || (() => {});

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl',
        'rounded-2xl border border-cyan-500/40 bg-cyber-950/95 backdrop-blur-xl p-3 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)]',
        'animate-in fade-in slide-in-from-bottom-6 duration-300',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                COMPARE HARDWARE
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                {items.length}/{maxItems}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Side-by-side specs, dimensions & power comparison
            </p>
          </div>
        </div>

        {/* Center: Mini Product Thumbnails */}
        <div className="flex items-center gap-2.5 overflow-x-auto max-w-full py-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="relative flex items-center gap-2 bg-cyber-900/90 border border-border/80 rounded-lg p-1.5 pr-2.5 group shrink-0"
            >
              <div className="w-8 h-8 rounded bg-cyber-950 flex items-center justify-center overflow-hidden border border-border/40 shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[9px] font-mono text-muted-foreground">PC</span>
                )}
              </div>
              <div className="max-w-[120px] text-left">
                <p className="text-[11px] font-medium text-foreground truncate">{item.name}</p>
                <Price amount={item.price} size="xs" />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="text-muted-foreground hover:text-rose-400 p-0.5 transition-colors"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Empty slot indicators */}
          {Array.from({ length: Math.max(0, 2 - items.length) }).map((_, i) => (
            <div
              key={i}
              className="hidden sm:flex items-center justify-center w-28 h-11 border border-dashed border-border/60 rounded-lg text-[11px] font-mono text-muted-foreground/60"
            >
              + Select part
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5"
          >
            Clear
          </Button>

          <Button
            variant="gaming"
            size="sm"
            onClick={handleOpen}
            disabled={items.length < 2}
            className="gap-1.5 text-xs font-mono h-9"
          >
            <span>COMPARE ({items.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
