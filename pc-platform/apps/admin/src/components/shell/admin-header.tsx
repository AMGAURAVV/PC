'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Bell,
  Sliders,
  ExternalLink,
  Shield,
  Activity,
} from 'lucide-react';
import { Button, Badge, Input } from '@pc-platform/ui';

export function AdminHeader() {
  const [search, setSearch] = React.useState('');

  return (
    <header className="h-16 bg-[#090d16]/90 backdrop-blur border-b border-cyber-800/80 sticky top-0 z-20 px-6 flex items-center justify-between gap-4">
      {/* Left Area: Environment & Global Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2">
          <Badge variant="tech" className="text-[10px] font-mono px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
            LIVE ENGINE
          </Badge>
          <span className="hidden md:inline-flex text-xs font-mono text-cyber-500">
            api/v1.4.0
          </span>
        </div>

        <div className="relative flex-1 hidden sm:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cyber-500" />
          <input
            type="text"
            placeholder="Search SKU, chipsets, orders, rules... (Ctrl+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-cyber-900/60 border border-cyber-800 rounded-md text-xs font-mono text-white placeholder-cyber-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right Area: Actions & Admin Profile */}
      <div className="flex items-center gap-3">
        <Link href="/compatibility">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 font-mono text-xs hidden lg:flex">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>RULES ENGINE</span>
          </Button>
        </Link>

        <Link href="/products/new">
          <Button variant="gaming" size="sm" className="h-8 gap-1.5 font-mono text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>ADD PART</span>
          </Button>
        </Link>

        {/* Storefront preview link */}
        <a
          href={process.env.NEXT_PUBLIC_STORE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-cyber-400 hover:text-white rounded hover:bg-cyber-800/60 transition-colors hidden sm:inline-flex"
          title="Open Customer Storefront"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        <div className="h-4 w-px bg-cyber-800 hidden sm:block" />

        {/* User Identity */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
            SA
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-mono font-semibold text-white leading-tight">
              Admin Ops
            </div>
            <div className="text-[10px] font-mono text-cyan-400 leading-tight">
              super_admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
