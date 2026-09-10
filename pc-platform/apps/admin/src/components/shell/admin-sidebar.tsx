'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  FolderTree,
  Building2,
  Boxes,
  BadgePercent,
  Layers,
  Sparkles,
  ShoppingBag,
  Users,
  Star,
  Ticket,
  Home,
  BarChart3,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@pc-platform/ui';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { title: 'Overview', href: '/', icon: LayoutDashboard },
  { title: 'Products', href: '/products', icon: Cpu },
  { title: 'Categories', href: '/categories', icon: FolderTree },
  { title: 'Brands', href: '/brands', icon: Building2 },
  { title: 'Inventory', href: '/inventory', icon: Boxes, badge: 'Live' },
  { title: 'Prices', href: '/prices', icon: BadgePercent },
  { title: 'Compatibility', href: '/compatibility', icon: Layers, badge: 'Rules' },
  { title: 'Build Templates', href: '/build-templates', icon: Sparkles },
  { title: 'Orders', href: '/orders', icon: ShoppingBag },
  { title: 'Users', href: '/users', icon: Users },
  { title: 'Reviews', href: '/reviews', icon: Star },
  { title: 'Coupons', href: '/coupons', icon: Ticket },
  { title: 'Homepage', href: '/homepage', icon: Home },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
  { title: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={`sticky top-0 h-screen bg-[#090d16] border-r border-cyber-800/80 transition-all duration-200 flex flex-col z-30 shrink-0 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand & Console Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-cyber-800/80">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-bold text-white shadow-lg shadow-cyan-500/20">
              NR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-sm text-white tracking-wider">
                  NEXUS RIGS
                </span>
                <Badge variant="tech" className="text-[9px] px-1 py-0 h-4">
                  OPS
                </Badge>
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase">
                Console Backoffice
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-bold text-white">
              NR
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-cyber-400 hover:text-white p-1 rounded hover:bg-cyber-800/50 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-thumb-cyber-800">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md font-mono text-xs transition-all group ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-500/10'
                  : 'text-cyber-400 hover:text-white hover:bg-cyber-800/40 border border-transparent'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.title : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-cyber-400 group-hover:text-white'
                }`}
              />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-cyber-800 text-cyber-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer System Pill */}
      <div className="p-3 border-t border-cyber-800/80 bg-[#060910]">
        {!collapsed ? (
          <div className="flex items-center justify-between text-[11px] font-mono text-cyber-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CLUSTER ONLINE</span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : (
          <div className="flex justify-center" title="Cluster Online">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
}
