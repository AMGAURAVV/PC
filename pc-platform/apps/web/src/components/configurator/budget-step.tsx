'use client';

import * as React from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  TrendingUp,
  Zap,
  Gauge,
  ShieldCheck,
} from 'lucide-react';
import { Button, Badge, Slider } from '@pc-platform/ui';
import { UseCaseDefinition } from '@pc-platform/types';

interface BudgetStepProps {
  useCase: UseCaseDefinition;
  budget: number;
  onChangeBudget: (budget: number) => void;
  onBack: () => void;
  onNext: () => void;
}

interface BudgetPreset {
  label: string;
  amount: number;
  tierName: string;
  gamingExpectation: string;
  workloadExpectation: string;
}

const BUDGET_PRESETS: BudgetPreset[] = [
  {
    label: 'Entry Champion',
    amount: 55000,
    tierName: 'Budget 1080p',
    gamingExpectation: '1080p 60-120 FPS in esports & competitive titles',
    workloadExpectation: 'Everyday multitasking, coding, 1080p clip editing',
  },
  {
    label: 'Sweet Spot',
    amount: 115000,
    tierName: '1440p High Refresh',
    gamingExpectation: '1440p Ultra 90-140 FPS with DLSS & Ray Tracing',
    workloadExpectation: '4K video exports, streaming, fast 3D previews',
  },
  {
    label: 'High Performance',
    amount: 175000,
    tierName: '1440p Max / Entry 4K',
    gamingExpectation: 'High-refresh 1440p esports + solid 4K 60+ FPS',
    workloadExpectation: 'Heavy video editing, simultaneous VTubing broadcast',
  },
  {
    label: 'Ultimate Enthusiast',
    amount: 265000,
    tierName: 'Native 4K Master',
    gamingExpectation: 'Native 4K 120+ FPS with Full Path Tracing',
    workloadExpectation: '8K timelines, complex Blender cycles, zero waiting',
  },
];

export function BudgetStep({
  useCase,
  budget,
  onChangeBudget,
  onBack,
  onNext,
}: BudgetStepProps) {
  // Find closest preset or match
  const activePreset =
    BUDGET_PRESETS.reduce((prev, curr) =>
      Math.abs(curr.amount - budget) < Math.abs(prev.amount - budget) ? curr : prev
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" /> Step 2 of 4
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          What is your target budget?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          For <strong className="text-primary">{useCase.name}</strong>, select the target investment amount. We will allocate the budget proportionally across the CPU, GPU, and cooling to yield maximum performance.
        </p>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {BUDGET_PRESETS.map((preset) => {
          const isSelected = activePreset.label === preset.label;

          return (
            <div
              key={preset.label}
              onClick={() => onChangeBudget(preset.amount)}
              className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md'
                  : 'border-border/80 bg-card/60 hover:bg-card hover:border-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">
                    {preset.label}
                  </span>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>

                <div className="text-xl font-bold font-mono text-foreground">
                  ₹{preset.amount.toLocaleString('en-IN')}
                </div>
                <div className="text-xs font-semibold text-primary mt-1">
                  {preset.tierName}
                </div>

                <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
                  {preset.gamingExpectation}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40 text-[10px] text-muted-foreground/80">
                {preset.workloadExpectation}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Slider */}
      <div className="p-6 rounded-2xl border border-border/80 bg-card/70 space-y-4 shadow-sm">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Custom Budget Setting
            </span>
            <div className="text-2xl font-extrabold font-mono text-primary mt-0.5">
              ₹{budget.toLocaleString('en-IN')}
            </div>
          </div>

          <Badge variant="outline" className="font-mono text-xs text-foreground">
            Tier: {activePreset.tierName}
          </Badge>
        </div>

        <Slider
          value={[budget]}
          min={35000}
          max={350000}
          step={5000}
          onValueChange={(val) => onChangeBudget(val[0] ?? 115000)}
          className="my-3"
        />

        <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
          <span>₹35,000 (Starter)</span>
          <span>₹1,50,000 (Enthusiast)</span>
          <span>₹3,50,000 (Extreme)</span>
        </div>

        {/* Expectation Callout */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-start gap-3 mt-4">
          <Gauge className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-foreground">
              What to expect at ₹{budget.toLocaleString('en-IN')}:
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              {activePreset.gamingExpectation}. {activePreset.workloadExpectation}.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Use Cases</span>
        </Button>

        <Button
          size="lg"
          onClick={onNext}
          className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <span>View Matching Builds</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
