'use client';

import * as React from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
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
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  LucideIcon,
} from 'lucide-react';
import {
  ConfiguratorBaseBuild,
  ConfiguratorSlot,
  ConfiguratorUpgradeOption,
} from '@pc-platform/types';
import { Button, Badge, Price, Skeleton } from '@pc-platform/ui';

interface CustomizerStepProps {
  baseBuild: ConfiguratorBaseBuild;
  optionsBySlot: Record<ConfiguratorSlot, ConfiguratorUpgradeOption[]>;
  isLoading: boolean;
  selectedOptions: Record<ConfiguratorSlot, ConfiguratorUpgradeOption>;
  onSelectOption: (slot: ConfiguratorSlot, option: ConfiguratorUpgradeOption) => void;
  onBack: () => void;
  onNext: () => void;
}

const SLOT_CONFIG: { id: ConfiguratorSlot; name: string; icon: LucideIcon }[] = [
  { id: 'cpu', name: 'Processor (CPU)', icon: Cpu },
  { id: 'gpu', name: 'Graphics Card (GPU)', icon: HardDrive },
  { id: 'ram', name: 'Memory (RAM)', icon: Layers },
  { id: 'storage', name: 'Primary Storage (SSD)', icon: Database },
  { id: 'cooling', name: 'CPU Cooling', icon: Fan },
  { id: 'case', name: 'Chassis / Case', icon: Box },
  { id: 'psu', name: 'Power Supply (PSU)', icon: Zap },
  { id: 'os', name: 'Operating System', icon: Disc },
  { id: 'accessories', name: 'Accessories & Bundles', icon: Headphones },
  { id: 'warranty', name: 'Warranty & Support Care', icon: ShieldCheck },
];

export function CustomizerStep({
  baseBuild,
  optionsBySlot,
  isLoading,
  selectedOptions,
  onSelectOption,
  onBack,
  onNext,
}: CustomizerStepProps) {
  // Track open accordion slot for progressive disclosure
  const [activeSlot, setActiveSlot] = React.useState<ConfiguratorSlot>('cpu');

  // Compute live subtotal
  const totalPrice = React.useMemo(() => {
    let total = baseBuild.basePrice;
    for (const [, opt] of Object.entries(selectedOptions)) {
      if (opt && opt.deltaPrice) {
        total += opt.deltaPrice;
      }
    }
    return total;
  }, [baseBuild.basePrice, selectedOptions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" /> Step 4 of 4
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Customize Your Build
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          All options below have been verified 100% plug-and-play compatible with the <strong className="text-foreground">{baseBuild.name}</strong>. Choose the upgrades that best fit your goals.
        </p>
      </div>

      {/* Sticky Price & Progress Banner */}
      <div className="p-4 rounded-xl border border-border/80 bg-card/90 backdrop-blur-md sticky top-16 z-30 shadow-lg flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary hidden sm:block">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase text-primary">
                {baseBuild.name}
              </span>
              <Badge variant="success" className="text-[10px] font-mono gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" /> All Upgrades Compatible
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Backend verified architecture • Progressive Disclosure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
              Estimated Total (Incl. GST)
            </span>
            <Price amount={totalPrice} size="xl" className="font-extrabold text-foreground" />
          </div>

          <Button
            size="sm"
            onClick={onNext}
            className="font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
          >
            <span>Review Build</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progressive Disclosure Slots List */}
      <div className="space-y-4">
        {SLOT_CONFIG.map((slotMeta) => {
          const Icon = slotMeta.icon;
          const isExpanded = activeSlot === slotMeta.id;
          const currentOption = selectedOptions[slotMeta.id];
          const availableOptions = optionsBySlot[slotMeta.id] || [];

          return (
            <div
              key={slotMeta.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card ${
                isExpanded
                  ? 'border-primary/60 ring-1 ring-primary/30 shadow-md'
                  : 'border-border/80 hover:border-border'
              }`}
            >
              {/* Accordion Slot Header */}
              <button
                type="button"
                onClick={() => setActiveSlot(isExpanded ? ('' as any) : slotMeta.id)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isExpanded
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-mono text-muted-foreground uppercase">
                      {slotMeta.name}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-foreground truncate">
                      {currentOption ? currentOption.name : baseBuild.baselineSpecs[slotMeta.id]}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {currentOption && currentOption.deltaPrice > 0 ? (
                    <span className="text-xs font-mono font-bold text-primary">
                      +₹{currentOption.deltaPrice.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      Included
                    </Badge>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Accordion Options Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-border/40 bg-muted/10 space-y-3">
                  <p className="text-xs text-muted-foreground pt-3">
                    Select an option for your <strong className="text-foreground">{slotMeta.name}</strong>. The backend compatibility engine ensures every choice fits physically and electrically.
                  </p>

                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {availableOptions.map((opt) => {
                      const isSelected = currentOption?.id === opt.id;
                      const resultingTotal =
                        totalPrice - (currentOption?.deltaPrice || 0) + opt.deltaPrice;

                      return (
                        <div
                          key={opt.id}
                          onClick={() => onSelectOption(slotMeta.id, opt)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                            isSelected
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/40 shadow-sm'
                              : 'border-border/70 bg-card hover:border-primary/40 hover:bg-card/80'
                          }`}
                        >
                          {/* Option Title & Price Row */}
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-muted-foreground/40'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5" />}
                              </div>

                              <span className="text-sm font-bold text-foreground">
                                {opt.name}
                              </span>

                              <Badge
                                variant="success"
                                className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              >
                                100% Compatible
                              </Badge>
                            </div>

                            <div className="text-right ml-auto">
                              <div className="flex items-baseline gap-1.5 justify-end">
                                <span
                                  className={`text-xs font-mono font-bold ${
                                    opt.deltaPrice > 0 ? 'text-primary' : 'text-emerald-400'
                                  }`}
                                >
                                  {opt.deltaPrice === 0
                                    ? 'Included in Base'
                                    : `+₹${opt.deltaPrice.toLocaleString('en-IN')}`}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Final Total: ₹{resultingTotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* "WHY THIS UPGRADE MATTERS" Educational Card */}
                          <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider block font-mono">
                                Why this upgrade matters:
                              </span>
                              <p className="text-muted-foreground leading-relaxed">
                                {opt.whyItMatters}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Base Builds</span>
        </Button>

        <Button
          size="lg"
          onClick={onNext}
          className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <span>View Configuration Summary</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
