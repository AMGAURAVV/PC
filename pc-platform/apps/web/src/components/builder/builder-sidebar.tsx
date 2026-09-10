'use client';

import * as React from 'react';
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
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { BUILDER_CATEGORIES, BuilderSlotId, BuilderSelections } from './types';
import { Badge } from '@pc-platform/ui';

interface BuilderSidebarProps {
  activeSlotId: BuilderSlotId;
  onSelectSlot: (slotId: BuilderSlotId) => void;
  selections: BuilderSelections;
  className?: string | undefined;
}

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

export function BuilderSidebar({
  activeSlotId,
  onSelectSlot,
  selections,
  className = '',
}: BuilderSidebarProps) {
  const totalCount = BUILDER_CATEGORIES.length;
  const configuredCount = Object.keys(selections).filter((k) => !!selections[k as BuilderSlotId]).length;

  return (
    <aside
      className={`flex flex-col bg-card border border-border/80 rounded-xl shadow-lg shadow-black/20 overflow-hidden ${className}`}
      aria-label="PC Builder Category Navigation"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration Flow
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {configuredCount} / {totalCount} Done
          </Badge>
        </div>
        <h2 className="mt-1 text-base font-bold tracking-tight text-foreground">
          System Components
        </h2>
      </div>

      {/* Category List */}
      <nav className="flex-1 overflow-y-auto divide-y divide-border/30 p-2 space-y-1">
        {BUILDER_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Box;
          const isSelected = activeSlotId === cat.id;
          const selection = selections[cat.id];
          const isConfigured = Boolean(selection);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectSlot(cat.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all duration-200 group ${
                isSelected
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-1.5 rounded-md transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-muted text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-foreground font-bold' : ''
                      }`}
                    >
                      {cat.name}
                    </span>
                    {cat.required && !isConfigured && (
                      <span className="text-[10px] text-amber-500 font-mono">*</span>
                    )}
                  </div>
                  {selection ? (
                    <p className="text-[11px] text-emerald-400 font-mono truncate">
                      ₹{((selection.product.price * selection.quantity)).toLocaleString('en-IN')}
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground/70 truncate">
                      {cat.required ? 'Required' : 'Optional'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                {isConfigured ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : cat.required ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500/70" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 bg-muted/10 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Configured
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span> Required
        </span>
      </div>
    </aside>
  );
}
