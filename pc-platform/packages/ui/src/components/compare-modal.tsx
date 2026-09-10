import * as React from 'react';
import { X, Layers, ShoppingCart, Check, AlertCircle, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription } from './modal';
import { Price } from './price';
import { Badge } from './badge';
import { Button } from './button';

export interface DetailedCompareProduct {
  id: string;
  name: string;
  slug: string;
  brand?: string | undefined;
  category?: string | undefined;
  price: number;
  compareAtPrice?: number | null | undefined;
  imageUrl?: string | null | undefined;
  inStock?: boolean | undefined;
  specifications?: Record<string, any> | undefined;
}

export interface CompareModalProps {
  open?: boolean | undefined;
  isOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  onClose?: (() => void) | undefined;
  products?: DetailedCompareProduct[] | undefined;
  items?: DetailedCompareProduct[] | any[] | undefined;
  onRemoveProduct?: ((id: string) => void) | undefined;
  onRemove?: ((id: string) => void) | undefined;
  onRemoveItem?: ((id: string) => void) | undefined;
  onAddToCart?: ((idOrProduct: any) => void) | undefined;
}

export function CompareModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  products,
  items,
  onRemoveProduct,
  onRemove,
  onRemoveItem,
  onAddToCart,
}: CompareModalProps) {
  const resolvedOpen = open !== undefined ? open : isOpen !== undefined ? isOpen : false;
  const handleOpenChange = onOpenChange || ((o: boolean) => { if (!o && onClose) onClose(); });
  const resolvedProducts: DetailedCompareProduct[] = (products || items || []) as DetailedCompareProduct[];
  const handleRemove = onRemoveProduct || onRemove || onRemoveItem || (() => {});

  // Collect all unique spec keys across all compared products
  const allSpecKeys = React.useMemo(() => {
    const keysSet = new Set<string>();
    resolvedProducts.forEach((p) => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach((k) => keysSet.add(k));
      }
    });
    return Array.from(keysSet).sort();
  }, [resolvedProducts]);

  return (
    <Modal open={resolvedOpen} onOpenChange={handleOpenChange}>
      <ModalContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-6">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2 font-mono text-white text-lg">
            <Layers className="w-5 h-5 text-cyan-400" />
            HARDWARE SPECIFICATION COMPARISON
          </ModalTitle>
          <ModalDescription>
            Side-by-side architectural and physical comparison across selected hardware.
          </ModalDescription>
        </ModalHeader>

        {resolvedProducts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground font-mono text-sm">
            No products selected for comparison.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/80">
                  <th className="p-4 w-44 min-w-44 text-xs font-mono uppercase tracking-wider text-muted-foreground bg-cyber-950/40">
                    COMPONENT
                  </th>
                  {resolvedProducts.map((p) => (
                    <th
                      key={p.id}
                      className="p-4 min-w-56 align-top bg-cyber-950/20 border-l border-border/60"
                    >
                      <div className="flex flex-col gap-3 relative">
                        <button
                          type="button"
                          onClick={() => handleRemove(p.id)}
                          className="absolute -top-1 -right-1 text-muted-foreground hover:text-rose-400 p-1 rounded-full hover:bg-cyber-900 transition-colors"
                          title="Remove from comparison"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="w-full h-32 rounded-lg bg-cyber-900 flex items-center justify-center p-2 overflow-hidden border border-border/40">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-mono text-muted-foreground">NO IMAGE</span>
                          )}
                        </div>

                        <div>
                          {p.brand && (
                            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                              {p.brand}
                            </span>
                          )}
                          <a
                            href={`/products/${p.slug}`}
                            className="block text-sm font-semibold text-foreground hover:text-cyan-300 transition-colors line-clamp-2 mt-0.5"
                          >
                            {p.name}
                          </a>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <Price amount={p.price} compareAt={p.compareAtPrice} size="md" />
                          <Badge
                            variant={p.inStock !== false ? 'compatible' : 'incompatible'}
                            className="text-[10px]"
                          >
                            {p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>

                        {onAddToCart && (
                          <Button
                            variant="gaming"
                            size="sm"
                            onClick={() => onAddToCart(p)}
                            disabled={p.inStock === false}
                            className="w-full text-xs gap-1.5"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                {/* Category Row */}
                <tr className="hover:bg-cyber-900/40 transition-colors">
                  <td className="p-3.5 font-semibold text-muted-foreground bg-cyber-950/40 uppercase">
                    Category
                  </td>
                  {resolvedProducts.map((p) => (
                    <td key={p.id} className="p-3.5 border-l border-border/40 text-foreground">
                      {p.category || 'Hardware'}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Spec Rows */}
                {allSpecKeys.map((key) => {
                  const values = resolvedProducts.map((p) => p.specifications?.[key] ?? '—');
                  // Check if values differ across products
                  const isDiffering =
                    resolvedProducts.length > 1 &&
                    values.some((v, idx) => idx > 0 && String(v) !== String(values[0]));

                  return (
                    <tr
                      key={key}
                      className={cn(
                        'hover:bg-cyber-900/40 transition-colors',
                        isDiffering && 'bg-cyan-950/20',
                      )}
                    >
                      <td className="p-3.5 font-medium text-muted-foreground bg-cyber-950/40 flex items-center justify-between">
                        <span>{key}</span>
                        {isDiffering && (
                          <span className="text-[10px] text-cyan-400 font-bold ml-1">DIFF</span>
                        )}
                      </td>
                      {resolvedProducts.map((p, i) => (
                        <td
                          key={p.id}
                          className={cn(
                            'p-3.5 border-l border-border/40',
                            isDiffering ? 'text-cyan-300 font-semibold' : 'text-slate-300',
                          )}
                        >
                          {String(values[i])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}
