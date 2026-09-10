'use client';

import * as React from 'react';
import {
  Sparkles,
  ArrowLeft,
  ShoppingCart,
  Save,
  Share2,
  CheckCircle2,
  Gauge,
  Cpu,
  HardDrive,
  Layers,
  Database,
  Fan,
  Box,
  Zap,
  Disc,
  Headphones,
  ShieldCheck,
  TrendingUp,
  Wrench,
  Check,
  Copy,
  LucideIcon,
} from 'lucide-react';
import {
  ConfiguratorBaseBuild,
  ConfiguratorSlot,
  ConfiguratorUpgradeOption,
  UseCaseDefinition,
} from '@pc-platform/types';
import { Button, Badge, Price } from '@pc-platform/ui';

interface FinalSummaryStepProps {
  useCase: UseCaseDefinition;
  baseBuild: ConfiguratorBaseBuild;
  selectedOptions: Record<ConfiguratorSlot, ConfiguratorUpgradeOption>;
  totalPrice: number;
  onAddToCart: () => void;
  onSaveConfiguration: () => void;
  onShareConfiguration: () => void;
  onBack: () => void;
  onSwitchToAdvanced: () => void;
}

const SLOT_META: Record<ConfiguratorSlot, { name: string; icon: LucideIcon }> = {
  cpu: { name: 'Processor (CPU)', icon: Cpu },
  gpu: { name: 'Graphics Card (GPU)', icon: HardDrive },
  ram: { name: 'Memory (RAM)', icon: Layers },
  storage: { name: 'Primary Storage', icon: Database },
  cooling: { name: 'Cooling Solution', icon: Fan },
  case: { name: 'Chassis / Case', icon: Box },
  psu: { name: 'Power Supply (PSU)', icon: Zap },
  os: { name: 'Operating System', icon: Disc },
  accessories: { name: 'Accessories', icon: Headphones },
  warranty: { name: 'Warranty Protection', icon: ShieldCheck },
};

export function FinalSummaryStep({
  useCase,
  baseBuild,
  selectedOptions,
  totalPrice,
  onAddToCart,
  onSaveConfiguration,
  onShareConfiguration,
  onBack,
  onSwitchToAdvanced,
}: FinalSummaryStepProps) {
  const gstAmount = Math.round(totalPrice * 0.18);
  const netAmount = totalPrice - gstAmount;

  // Derive estimated performance index based on build tier and price
  const fps1080p = Math.min(240, Math.round(100 + (totalPrice / 250000) * 140));
  const fps1440p = Math.min(165, Math.round(60 + (totalPrice / 250000) * 105));
  const fps4k = Math.min(120, Math.round(30 + (totalPrice / 250000) * 90));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="success" className="text-xs font-mono gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Plug-and-Play Verified
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Configuration Summary & Performance
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review your finalized <strong className="text-foreground">{baseBuild.name}</strong> configuration. Every component is in stock and certified for safe assembly by our master hardware builders.
        </p>
      </div>

      {/* Main Grid: Left Specs & Right Performance/Pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Itemized Hardware List (Col span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div>
                <span className="text-xs font-mono uppercase text-muted-foreground">
                  Baseline Architecture
                </span>
                <h3 className="text-lg font-bold text-foreground">{baseBuild.name}</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-primary">
                {useCase.name} Optimized
              </Badge>
            </div>

            {/* Selected Hardware Items */}
            <div className="divide-y divide-border/40 space-y-2.5">
              {(Object.keys(SLOT_META) as ConfiguratorSlot[]).map((slotKey) => {
                const meta = SLOT_META[slotKey];
                const Icon = meta.icon;
                const opt = selectedOptions[slotKey];

                return (
                  <div key={slotKey} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-muted text-primary shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                          {meta.name}
                        </span>
                        <div className="font-semibold text-foreground truncate">
                          {opt ? opt.name : baseBuild.baselineSpecs[slotKey]}
                        </div>
                        {opt && opt.whyItMatters && (
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1">
                            {opt.whyItMatters}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {opt && opt.deltaPrice > 0 ? (
                        <span className="font-mono font-bold text-primary">
                          +₹{opt.deltaPrice.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground font-mono">
                          Included
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Customizer Switch Trigger */}
          <div className="p-4 rounded-xl border border-dashed border-border/80 bg-muted/20 flex items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-semibold text-foreground">Want granular component control?</h4>
              <p className="text-muted-foreground mt-0.5">
                Switch to the Advanced PC Builder to pick individual motherboard models, fan counts, and RAM latencies.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToAdvanced}
              className="gap-1.5 shrink-0 text-xs font-semibold"
            >
              <Wrench className="w-3.5 h-3.5" /> Advanced Builder
            </Button>
          </div>
        </div>

        {/* Right Column: Performance Meters & Financials (Col span 5) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Estimated Gaming Performance Box */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">
                  Performance Overview
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Target frame rates in modern titles
                </p>
              </div>
            </div>

            {/* FPS Bars */}
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-muted-foreground">1080p Ultra Gaming:</span>
                  <span className="font-bold text-emerald-400">~{fps1080p} FPS</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (fps1080p / 240) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-muted-foreground">1440p High Refresh:</span>
                  <span className="font-bold text-primary">~{fps1440p} FPS</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (fps1440p / 165) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-muted-foreground">4K UHD Ray-Tracing:</span>
                  <span className="font-bold text-foreground">~{fps4k} FPS</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (fps4k / 120) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">Professional Workload Capability:</span>
              <p>
                Handles 4K timeline scrubbing with zero proxy drops, instantaneous code builds, and high-bitrate AV1 livestreaming without frame loss.
              </p>
            </div>
          </div>

          {/* Pricing & Checkout Actions */}
          <div className="p-5 rounded-2xl border border-border/80 bg-card space-y-4 shadow-sm">
            <div>
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Final Estimated Investment
              </span>
              <Price amount={totalPrice} size="xl" className="font-extrabold text-foreground" />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border/40 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Base Hardware Cost:</span>
                <span className="font-mono">₹{netAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18% inclusive):</span>
                <span className="font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Professional Rig Assembly:</span>
                <span>FREE (Included)</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Insured Wooden Crating Delivery:</span>
                <span>FREE (Included)</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button
              size="lg"
              onClick={onAddToCart}
              className="w-full gap-2 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-12"
            >
              <ShoppingCart className="w-4 h-4" /> Add Entire Build to Cart
            </Button>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onSaveConfiguration}
                className="gap-1.5 text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" /> Save Build
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onShareConfiguration}
                className="gap-1.5 text-xs font-semibold"
              >
                <Share2 className="w-3.5 h-3.5" /> Share Build
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Component Customizer</span>
        </Button>
      </div>
    </div>
  );
}
