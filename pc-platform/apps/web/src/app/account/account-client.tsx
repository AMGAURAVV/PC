'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Breadcrumbs,
  Button,
  Card,
  Input,
  Label,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Price,
  EmptyState,
  useToast,
} from '@pc-platform/ui';
import {
  User,
  Heart,
  Package,
  MapPin,
  Settings,
  ShoppingBag,
  Trash2,
  Cpu,
  Shield,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useWishlist } from '../../hooks/use-wishlist';
import { useCart } from '../../hooks/use-cart';

export function AccountClient() {
  const { toast } = useToast();
  const { items: wishlistItems, toggleWishlist, isLoaded: isWishlistLoaded } = useWishlist();
  const { addItem: addToCart } = useCart();

  const [activeTab, setActiveTab] = React.useState('wishlist');

  // Profile mock form state
  const [profile, setProfile] = React.useState({
    name: 'Gaurav Sharma',
    email: 'gaurav.sharma@example.com',
    phone: '+91 98765 43210',
    gamingTier: 'Legendary Enthusiast',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Profile Updated',
      description: 'Your account preferences have been saved successfully.',
    });
  };

  const handleMoveToCart = async (item: (typeof wishlistItems)[0]) => {
    addToCart(item.product, 1);
    await toggleWishlist(item.product);
    toast({
      title: 'Moved to Cart',
      description: `${item.product.name} moved from wishlist to your shopping cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Account Hero Header */}
      <div className="border-b border-border bg-gradient-to-b from-card/60 to-background/40 pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'My Account' },
            ]}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-card border border-primary/40 flex items-center justify-center text-primary font-bold text-2xl shadow-lg shadow-primary/10">
                GS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">{profile.name}</h1>
                  <Badge variant="primary" className="text-[10px] font-mono uppercase">
                    PRO BUILDER
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{profile.email} • Member since 2024</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-3">
              <Link href="/orders">
                <Button variant="outline" size="sm" className="border-border text-xs gap-2">
                  <Package className="h-4 w-4 text-primary" /> View My Orders
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="secondary" size="sm" className="text-xs gap-2">
                  <ShoppingBag className="h-4 w-4" /> Go to Cart
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Account Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border p-1 rounded-xl">
            <TabsTrigger value="wishlist" className="gap-2 text-xs font-semibold">
              <Heart className="h-4 w-4" /> Wishlist ({wishlistItems.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 text-xs font-semibold">
              <User className="h-4 w-4" /> Profile & Security
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2 text-xs font-semibold">
              <MapPin className="h-4 w-4" /> Saved Addresses
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Wishlist */}
          <TabsContent value="wishlist" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Saved Wishlist Parts</h2>
                <p className="text-xs text-muted-foreground">
                  Components and peripherals you have bookmarked for your next build upgrade.
                </p>
              </div>
            </div>

            {wishlistItems.length === 0 ? (
              <div className="bg-card/30 border border-border/80 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/50 border border-border mx-auto flex items-center justify-center text-muted-foreground">
                  <Heart className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">Your wishlist is empty</h3>
                  <p className="text-xs text-muted-foreground">
                    Bookmark graphics cards, CPUs, and accessories to monitor price changes and quickly add them to your cart.
                  </p>
                </div>
                <div className="pt-2">
                  <Link href="/products">
                    <Button variant="primary" size="sm">
                      Explore Hardware Catalog
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => {
                  const p = item.product;
                  return (
                    <div
                      key={p.id}
                      className="group bg-card/40 hover:bg-card/60 border border-border/80 hover:border-primary/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Thumbnail */}
                        <Link
                          href={`/products/${p.slug}`}
                          className="relative aspect-video w-full bg-secondary/60 rounded-lg overflow-hidden border border-border/60 flex items-center justify-center block"
                        >
                          {p.images && p.images[0] ? (
                            <Image
                              src={p.images[0].url}
                              alt={p.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Cpu className="h-12 w-12 text-muted-foreground/50" />
                          )}
                        </Link>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                              {p.category?.name || 'Hardware'}
                            </Badge>
                            {p.stock > 0 ? (
                              <span className="text-[10px] text-emerald-400 font-mono">In Stock</span>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-mono">Backorder</span>
                            )}
                          </div>

                          <Link href={`/products/${p.slug}`}>
                            <h3 className="text-sm font-bold text-white hover:text-primary transition-colors line-clamp-2">
                              {p.name}
                            </h3>
                          </Link>

                          <div className="pt-2">
                            <Price
                              amount={p.price}
                              compareAt={p.compareAtPrice}
                              className="text-base font-bold text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="pt-4 mt-4 border-t border-border/60 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMoveToCart(item)}
                          className="flex-1 text-xs font-semibold gap-1.5"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> Move to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await toggleWishlist(p);
                            toast({
                              title: 'Removed from Wishlist',
                              description: `${p.name} removed.`,
                            });
                          }}
                          className="border-border text-muted-foreground hover:text-destructive hover:border-destructive/40"
                          title="Remove"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Profile & Security */}
          <TabsContent value="profile" className="space-y-6">
            <div className="bg-card/40 border border-border/80 rounded-xl p-6 backdrop-blur-md max-w-2xl space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Personal Information</h2>
                <p className="text-xs text-muted-foreground">
                  Update your contact details and account security settings.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name" className="text-xs font-medium text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="prof-name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="prof-phone" className="text-xs font-medium text-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="prof-phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="bg-secondary/60 border-border text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-email" className="text-xs font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="prof-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="bg-secondary/60 border-border text-sm"
                  />
                </div>

                <div className="pt-3 flex justify-end">
                  <Button type="submit" variant="primary" size="sm" className="font-semibold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          {/* Tab 3: Saved Addresses */}
          <TabsContent value="addresses" className="space-y-6">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Delivery Locations</h2>
                  <p className="text-xs text-muted-foreground">
                    Manage default addresses for fast 1-click checkout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default address card */}
                <div className="bg-card/40 border-2 border-primary/60 rounded-xl p-5 relative space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary" className="text-[10px] uppercase font-mono">
                      Default Primary
                    </Badge>
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Home / Lab</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Gaurav Sharma<br />
                    Flat 402, Quantum Towers, Cyber City<br />
                    Phase II, Hitec City<br />
                    Hyderabad, Telangana - 500081<br />
                    Ph: +91 98765 43210
                  </p>
                </div>

                {/* Secondary address card */}
                <div className="bg-card/40 border border-border/80 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono border-border">
                      Office
                    </Badge>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Work HQ</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Nexus Innovations Tech Hub<br />
                    Tower B, 7th Floor, Financial District<br />
                    Gachibowli, Hyderabad - 500032<br />
                    Ph: +91 98765 43210
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
