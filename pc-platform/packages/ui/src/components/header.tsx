import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { SearchInput } from './search';
import { MegaMenu, defaultHardwareCategories } from './mega-menu';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from './drawer';
import {
  Cpu,
  ShoppingCart,
  Menu,
  Wrench,
  Bookmark,
  ChevronDown,
  User,
  ShieldCheck,
  Search,
} from 'lucide-react';

export interface HeaderProps {
  cartItemCount?: number;
  savedBuildsCount?: number;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  } | null;
  onSearch?: (query: string) => void;
  onOpenCart?: () => void;
  onOpenSavedBuilds?: () => void;
  onSignIn?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  cartItemCount = 0,
  savedBuildsCount = 0,
  user,
  onSearch,
  onOpenCart,
  onOpenSavedBuilds,
  onSignIn,
  className,
}) => {
  const [megaMenuOpen, setMegaMenuOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-cyber-800/80 bg-cyber-950/80 backdrop-blur-xl',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Hardware Menu Trigger */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all">
                <div className="w-full h-full bg-cyber-950 rounded-[10px] flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-wider text-base text-white font-mono flex items-center gap-1">
                  NEXUS<span className="text-cyan-400">RIGS</span>
                </span>
                <span className="text-[9px] font-mono text-cyber-500 tracking-widest uppercase">
                  PRECISION SYSTEMS
                </span>
              </div>
            </a>

            {/* Hardware Category Mega Menu Trigger (Desktop) */}
            <div
              className="hidden lg:block relative"
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                onMouseEnter={() => setMegaMenuOpen(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  megaMenuOpen
                    ? 'text-cyan-400 bg-cyber-900'
                    : 'text-cyber-300 hover:text-white hover:bg-cyber-900/60'
                )}
              >
                <span>Hardware Catalog</span>
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200',
                    megaMenuOpen && 'rotate-180 text-cyan-400'
                  )}
                />
              </button>

              {/* Mega Menu Dropdown */}
              {megaMenuOpen && (
                <div className="absolute left-0 top-full pt-3 w-[880px]">
                  <MegaMenu
                    isOpen={megaMenuOpen}
                    onClose={() => setMegaMenuOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* PC Builder link */}
            <a
              href="/pc-builder"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30 transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>PC BUILDER</span>
            </a>
          </div>

          {/* Center Search (Desktop) */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <SearchInput
              placeholder="Search components, GPUs, CPUs, chipsets..."
              onSearch={onSearch}
              className="w-full"
            />
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-cyber-300 hover:text-white"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* Saved Builds / Wishlist */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSavedBuilds}
              className="relative text-cyber-300 hover:text-white hover:bg-cyber-900"
              aria-label="Saved Builds"
            >
              <Bookmark className="w-4 h-4" />
              {savedBuildsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                  {savedBuildsCount}
                </span>
              )}
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenCart}
              className="relative text-cyber-300 hover:text-white hover:bg-cyber-900"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black shadow-[0_0_8px_rgba(6,182,212,0.6)]">
                  {cartItemCount}
                </span>
              )}
            </Button>

            {/* User Account / Sign In */}
            {user ? (
              <a
                href="/account"
                className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full bg-cyber-900 border border-cyber-800 hover:border-cyber-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 flex items-center justify-center text-black font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-cyber-200 hidden sm:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </a>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onSignIn}
                className="gap-1.5 text-xs font-mono"
              >
                <User className="w-3.5 h-3.5" />
                <span>SIGN IN</span>
              </Button>
            )}

            {/* Mobile Drawer Navigation Toggle */}
            <div className="lg:hidden">
              <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DrawerTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-cyber-300 hover:text-white"
                    aria-label="Toggle menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent side="right" className="w-[300px] sm:w-[350px] p-6">
                  <DrawerHeader className="px-0 pt-0">
                    <DrawerTitle className="text-white font-mono flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-cyan-400" />
                      NEXUS NAVIGATION
                    </DrawerTitle>
                  </DrawerHeader>
                  <div className="py-4 space-y-4">
                    <a
                      href="/pc-builder"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-cyber-900 border border-cyan-500/40 text-cyan-300 font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-cyan-400" />
                        PC System Builder
                      </span>
                      <span className="text-xs font-mono bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                        ENGINE
                      </span>
                    </a>

                    <div className="space-y-1">
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyber-500 px-2">
                        HARDWARE DIRECTORY
                      </p>
                      {defaultHardwareCategories.map((cat) => (
                        <div key={cat.title} className="space-y-1 py-1">
                          <p className="text-xs font-semibold text-cyber-300 px-2 pt-2 flex items-center gap-2">
                            {cat.icon}
                            {cat.title}
                          </p>
                          <div className="pl-6 space-y-1">
                            {cat.items.slice(0, 3).map((item) => (
                              <a
                                key={item.title}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1 text-xs text-cyber-400 hover:text-white"
                              >
                                {item.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-cyber-800 space-y-2">
                      <a
                        href="/guides"
                        className="block px-2 py-1.5 text-xs text-cyber-300 hover:text-white"
                      >
                        Compatibility Guide & Rules
                      </a>
                      <a
                        href="/support"
                        className="block px-2 py-1.5 text-xs text-cyber-300 hover:text-white"
                      >
                        Support & Diagnostics
                      </a>
                    </div>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {mobileSearchOpen && (
          <div className="md:hidden py-3 border-t border-cyber-800/60">
            <SearchInput
              placeholder="Search components..."
              onSearch={(q) => {
                onSearch?.(q);
                setMobileSearchOpen(false);
              }}
              className="w-full"
            />
          </div>
        )}
      </div>
    </header>
  );
};
