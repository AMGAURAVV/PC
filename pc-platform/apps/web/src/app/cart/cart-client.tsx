'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Breadcrumbs,
  Button,
  Card,
  Price,
  Badge,
  EmptyState,
  useToast,
} from '@pc-platform/ui';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  Heart,
  ShoppingBag,
  Cpu,
} from 'lucide-react';
import { useCart } from '../../hooks/use-cart';
import { useWishlist } from '../../hooks/use-wishlist';

export function CartClient() {
  const { toast } = useToast();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart, isLoaded } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [promoCode, setPromoCode] = React.useState('');
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null);

  // Free shipping threshold: ₹50,000
  const freeShippingThreshold = 50000;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingAmount = items.length === 0 ? 0 : isFreeShipping ? 0 : 499;
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxAmount = Math.round((subtotal - discountAmount) * 0.18); // 18% GST estimate
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingAmount);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (code === 'NEXUS10') {
      setDiscountPercent(10);
      setAppliedPromo('NEXUS10 (10% Off)');
      toast({
        title: 'Promo Applied!',
        description: '10% discount applied to your cart subtotal.',
      });
    } else if (code === 'BUILDER50') {
      setDiscountPercent(15);
      setAppliedPromo('BUILDER50 (15% Off)');
      toast({
        title: 'VIP Builder Promo Applied!',
        description: '15% discount applied to your cart subtotal.',
      });
    } else {
      toast({
        title: 'Invalid Promo Code',
        description: 'Try "NEXUS10" for 10% off your gaming rig order.',
        variant: 'destructive',
      });
    }
  };

  const handleRemovePromo = () => {
    setDiscountPercent(0);
    setAppliedPromo(null);
    setPromoCode('');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm animate-pulse">
          Loading your gaming cart...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card/60 to-background/40 pt-8 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shopping Cart' },
            ]}
          />

          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <ShoppingBag className="h-7 w-7 text-primary" /> Shopping Cart
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Review your high-performance hardware components and proceed to checkout.
              </p>
            </div>

            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Cart
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-16 text-center max-w-xl mx-auto space-y-6">
            <div className="h-24 w-24 mx-auto rounded-full bg-secondary/60 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/60" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Your Cart is Empty</h2>
              <p className="text-sm text-muted-foreground">
                You haven&apos;t added any PC components yet. Browse our cutting-edge processors, graphic cards, and rigs or start building your custom system.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/products">
                <Button variant="primary" size="lg" className="w-full sm:w-auto font-semibold">
                  Browse All Hardware
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-border">
                  Launch Rig Configurator
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Cart Content: Items List + Order Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Col: Cart Item Cards (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Progress bar */}
              <div className="bg-card/40 border border-border/80 rounded-xl p-4 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-foreground font-medium">
                    <Truck className="h-4 w-4 text-primary" />
                    {isFreeShipping ? (
                      <span className="text-emerald-400 font-semibold">
                        Congratulations! You unlocked FREE express insured shipping.
                      </span>
                    ) : (
                      <span>
                        Add{' '}
                        <strong className="text-white font-mono">
                          ₹{(freeShippingThreshold - subtotal).toLocaleString('en-IN')}
                        </strong>{' '}
                        more to qualify for free shipping
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {freeShippingProgress}%
                  </span>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-emerald-400 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>

              {/* Items Table/Cards */}
              <div className="space-y-3">
                {items.map((item) => {
                  const p = item.product;
                  const itemTotal = p.price * item.quantity;
                  const inWishlist = isInWishlist(p.id);

                  return (
                    <div
                      key={p.id}
                      className="group bg-card/40 hover:bg-card/60 border border-border/70 hover:border-border rounded-xl p-4 sm:p-5 transition-all duration-200 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center gap-4"
                    >
                      {/* Thumbnail */}
                      <Link
                        href={`/products/${p.slug}`}
                        className="relative w-20 h-20 sm:w-24 sm:h-24 bg-secondary/60 rounded-lg overflow-hidden border border-border/80 flex items-center justify-center shrink-0"
                      >
                        {p.images && p.images[0] ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <Cpu className="h-10 w-10 text-muted-foreground/50" />
                        )}
                      </Link>

                      {/* Info & Specs */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                            {p.category?.name || 'Hardware'}
                          </Badge>
                          {p.brand && (
                            <span className="text-xs text-muted-foreground">by {p.brand}</span>
                          )}
                        </div>

                        <Link href={`/products/${p.slug}`} className="block">
                          <h3 className="text-sm sm:text-base font-semibold text-white hover:text-primary transition-colors line-clamp-2">
                            {p.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-3 pt-1">
                          <Price
                            amount={p.price}
                            compareAt={p.compareAtPrice}
                            className="text-sm font-bold text-white"
                          />
                          <span className="text-xs text-muted-foreground font-mono">
                            SKU: {p.sku || p.id.slice(0, 8)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls & Line Total */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground font-mono hidden sm:block">
                            Item Total
                          </div>
                          <div className="text-base sm:text-lg font-bold font-mono text-primary">
                            ₹{itemTotal.toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Counter Controls */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-secondary/80 border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQuantity(p.id, item.quantity - 1);
                                } else {
                                  removeItem(p.id);
                                }
                              }}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(p.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Action icons: Wishlist & Remove */}
                          <button
                            onClick={async () => {
                              await toggleWishlist(p);
                              toast({
                                title: inWishlist ? 'Removed from Wishlist' : 'Saved to Wishlist',
                                description: `${p.name} updated in your wishlist.`,
                              });
                            }}
                            className={`p-1.5 rounded-lg border border-border/70 hover:border-border transition-colors ${
                              inWishlist
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-white bg-secondary/40'
                            }`}
                            title="Save for later"
                          >
                            <Heart className="h-4 w-4" fill={inWishlist ? 'currentColor' : 'none'} />
                          </button>

                          <button
                            onClick={() => {
                              removeItem(p.id);
                              toast({
                                title: 'Item Removed',
                                description: `${p.name} removed from your cart.`,
                              });
                            }}
                            className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:text-destructive hover:border-destructive/40 bg-secondary/40 transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Continue shopping link */}
              <div className="pt-3">
                <Link
                  href="/products"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  ← Continue shopping hardware components
                </Link>
              </div>
            </div>

            {/* Right Col: Order Summary (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card/50 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-6 sticky top-20 shadow-xl shadow-black/20">
                <h2 className="text-lg font-bold text-white tracking-tight pb-3 border-b border-border/60">
                  Order Summary
                </h2>

                {/* Calculation breakdown */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Items Subtotal ({itemCount} {itemCount === 1 ? 'part' : 'parts'})</span>
                    <span className="font-mono text-white font-medium">
                      ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount ({appliedPromo})</span>
                      <span className="font-mono font-medium">
                        -₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-muted-foreground">
                    <span>Estimated Insured Shipping</span>
                    <span className="font-mono text-white font-medium">
                      {shippingAmount === 0 ? (
                        <span className="text-emerald-400 uppercase text-xs font-bold">FREE</span>
                      ) : (
                        `₹${shippingAmount.toLocaleString('en-IN')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Estimated 18% GST (Included)</span>
                    <span className="font-mono text-muted-foreground">
                      ₹{taxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex justify-between items-baseline">
                    <span className="text-base font-bold text-white">Estimated Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-primary">
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] text-muted-foreground">All taxes & duty included</p>
                    </div>
                  </div>
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary" /> Have a builder coupon?
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. NEXUS10"
                      className="flex-1 px-3 py-2 text-xs uppercase font-mono bg-secondary/70 border border-border rounded-lg text-white focus:outline-none focus:border-primary"
                    />
                    <Button type="submit" variant="secondary" size="sm" className="text-xs font-semibold">
                      Apply
                    </Button>
                  </div>
                  {appliedPromo && (
                    <div className="flex items-center justify-between text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 px-2.5 py-1.5 rounded-md">
                      <span>✓ {appliedPromo} applied</span>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[10px] text-muted-foreground hover:text-white underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </form>

                {/* Proceed to Checkout CTA */}
                <div className="pt-2">
                  <Link href="/checkout" className="block">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold shadow-lg shadow-primary/25 group flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-border/50 space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>100% Genuine, Authorised Manufacturer Warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary shrink-0" />
                    <span>Insured Shock-Proof Packaging & Express Transit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>7-Day Hassle-Free Replacement for Defective Parts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
