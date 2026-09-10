'use client';

import * as React from 'react';
import {
  Gamepad2,
  Video,
  Radio,
  Briefcase,
  Cpu,
  PiggyBank,
  Check,
  Sparkles,
  ArrowRight,
  LucideIcon,
} from 'lucide-react';
import { UseCaseDefinition, ConfiguratorUseCase } from '@pc-platform/types';
import { Badge, Button } from '@pc-platform/ui';

interface UseCaseStepProps {
  useCases: UseCaseDefinition[];
  selectedUseCase: ConfiguratorUseCase;
  onSelectUseCase: (useCase: ConfiguratorUseCase) => void;
  onNext: () => void;
}

const USE_CASE_ICONS: Record<string, LucideIcon> = {
  Gamepad2,
  Video,
  Radio,
  Briefcase,
  Cpu,
  PiggyBank,
};

export function UseCaseStep({
  useCases,
  selectedUseCase,
  onSelectUseCase,
  onNext,
}: UseCaseStepProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
          <Sparkles className="w-3 h-3 mr-1" /> Step 1 of 4
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          What will you use this PC for?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select your primary workload. We will automatically balance the processor, graphics card, and memory architecture to give you maximum value without bottlenecking.
        </p>
      </div>

      {/* Grid of Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {useCases.map((uc) => {
          const Icon = USE_CASE_ICONS[uc.iconName] || Gamepad2;
          const isSelected = selectedUseCase === uc.id;

          return (
            <div
              key={uc.id}
              onClick={() => onSelectUseCase(uc.id)}
              className={`group relative cursor-pointer p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/40'
                  : 'border-border/80 bg-card/60 hover:bg-card hover:border-border hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`p-3 rounded-xl transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/70 text-primary group-hover:bg-primary/20'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/30">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {uc.name}
                </h3>
                <p className="text-xs font-medium text-primary/90 mt-0.5">
                  {uc.tagline}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {uc.description}
                </p>

                {/* Popular software chips */}
                <div className="mt-4 pt-3 border-t border-border/40">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground/80 block mb-1.5">
                    Optimized for:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {uc.popularApps.slice(0, 3).map((app, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-muted/50 text-foreground/80 border border-border/30 font-mono"
                      >
                        {app}
                      </span>
                    ))}
                    {uc.popularApps.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground font-mono">
                        +{uc.popularApps.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recommended Budget Range */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span>Typical Budget:</span>
                <span className="font-mono font-bold text-foreground">
                  ₹{(uc.recommendedBudgetMin / 1000).toFixed(0)}K – ₹{(uc.recommendedBudgetMax / 1000).toFixed(0)}K
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Step CTA */}
      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={onNext}
          className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
        >
          <span>Continue to Budget</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
