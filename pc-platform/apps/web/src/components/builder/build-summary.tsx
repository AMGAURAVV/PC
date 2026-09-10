'use client';

import * as React from 'react';
import {
  ShoppingCart,
  Save,
  Share2,
  Copy,
  Trash2,
  Scale,
  Gauge,
  Sparkles,
  TrendingUp,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { BuildCalculations, Product } from '@pc-platform/types';
import { BuilderSelections, BUILDER_CATEGORIES, BuilderSlotId } from './types';
import { PowerEstimate } from './power-estimate';
import { CompatibilityPanel } from './compatibility-panel';
import { BuildProgress } from './build-progress';
import { Button, Price, Badge } from '@pc-platform/ui';

interface BuildSummaryProps {
  selections: BuilderSelections;
  calculations?: BuildCalculations | null | undefined;
  isLoadingEvaluation?: boolean | undefined;
  onAddToCart: () => void;
  onSaveBuild: () => void;
  onShareBuild: () => void;
  onDuplicateBuild: () => void;
  onClearBuild: () => void;
  onCompareBuild: () => void;
  className?: string | undefined;
}

export function BuildSummary({
  selections,
  calculations,
  isLoadingEvaluation = false,
  onAddToCart,
  onSaveBuild,
  onShareBuild,
  onDuplicateBuild,
  onClearBuild,
  onCompareBuild,
  className = '',
}: BuildSummaryProps) {
  const selectedItems = Object.entries(selections).filter(
    ([, val]) => val !== undefined && val !== null
  ) as [BuilderSlotId, { product: Product; quantity: number }][];

  // Calculate subtotal from selections or calculations
  const subtotal = React.useMemo(() => {
    if (calculations?.totalPrice) return calculations.totalPrice;
    return selectedItems.reduce(
      (acc, [, item]) => acc + item.product.price * item.quantity,
      0
    );
  }, [calculations?.totalPrice, selectedItems]);

  const gstAmount = Math.round(subtotal * 0.18);
  const netAmount = subtotal - gstAmount;

  // Selected PSU wattage if any
  const selectedPsu = selections.psu?.product;
  const psuWattage = selectedPsu?.specifications?.wattage
    ? Number(selectedPsu.specifications.wattage)
    : undefined;

  const estimatedPower = calculations?.estimatedPowerW || 0;
  const recommendedPsu = calculations?.recommendedPsuW || 650;
  const performanceScore = calculations?.performanceScore || 0;
  const valueScore = calculations?.valueScore || 0;

  const isBuildable = selectedItems.length > 0;
  const hasIncompatibleIssues =
    calculations?.compatibilityResult?.status === 'incompatible';

  return (
    <div
      className={`flex flex-col bg-card border border-border/80 rounded-xl shadow-lg shadow-black/20 overflow-hidden ${className}`}
      aria-label="PC Build Summary Panel"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration Report
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {selectedItems.length} Parts
          </Badge>
        </div>
        <h2 className="text-lg font-bold text-foreground mt-1">Build Summary</h2>
      </div>

      <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto">
        {/* Total Price Section */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Total Estimated
            </span>
            <Price amount={subtotal} size="xl" className="font-extrabold text-foreground" />
          </div>

          <div className="text-[11px] text-muted-foreground flex justify-between pt-2 border-t border-border/40">
            <span>GST (18% inclusive)</span>
            <span className="font-mono">₹{gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-[11px] text-muted-foreground flex justify-between">
            <span>Base Cost</span>
            <span className="font-mono">₹{netAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Build Completeness */}
        <BuildProgress selections={selections} />

        {/* Performance & Value Benchmarks */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-card border border-border/70">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              <span>Performance</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-foreground">
                {performanceScore > 0 ? performanceScore : '--'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">/100</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80 mt-0.5">Gaming Tier</div>
          </div>

          <div className="p-3 rounded-lg bg-card border border-border/70">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Value Index</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-foreground">
                {valueScore > 0 ? valueScore : '--'}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">/100</span>
            </div>
            <div className="text-[10px] text-muted-foreground/80 mt-0.5">Price / FPS</div>
          </div>
        </div>

        {/* Power Estimate Visualizer */}
        <PowerEstimate
          estimatedPowerW={estimatedPower}
          recommendedPsuW={recommendedPsu}
          selectedPsuWattage={psuWattage}
        />

        {/* Authoritative Compatibility Engine Status */}
        <CompatibilityPanel
          result={calculations?.compatibilityResult ?? null}
          isLoading={isLoadingEvaluation}
        />

        {/* Primary Action Button */}
        <div className="pt-2 space-y-2.5">
          <Button
            size="lg"
            disabled={!isBuildable || hasIncompatibleIssues}
            onClick={onAddToCart}
            className="w-full gap-2 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-11"
          >
            <ShoppingCart className="w-4 h-4" /> Add Entire Build to Cart
          </Button>

          {hasIncompatibleIssues && (
            <p className="text-[11px] text-destructive text-center font-medium flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Resolve compatibility conflicts to order this build.
            </p>
          )}

          {/* Secondary Actions Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              disabled={!isBuildable}
              onClick={onSaveBuild}
              className="gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" /> Save Build
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isBuildable}
              onClick={onShareBuild}
              className="gap-1.5 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Build
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isBuildable}
              onClick={onDuplicateBuild}
              className="gap-1.5 text-xs"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={!isBuildable}
              onClick={onCompareBuild}
              className="gap-1.5 text-xs"
            >
              <Scale className="w-3.5 h-3.5" /> Compare
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!isBuildable}
            onClick={onClearBuild}
            className="w-full text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear All Selections
          </Button>
        </div>
      </div>
    </div>
  );
}
