'use client';

import * as React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { BUILDER_CATEGORIES, BuilderSlotId, BuilderSelections } from './types';

interface BuildProgressProps {
  selections: BuilderSelections;
  className?: string;
}

export function BuildProgress({ selections, className = '' }: BuildProgressProps) {
  const requiredCategories = BUILDER_CATEGORIES.filter((c) => c.required);
  const totalRequired = requiredCategories.length;
  const configuredRequired = requiredCategories.filter((c) => Boolean(selections[c.id])).length;

  const totalAll = BUILDER_CATEGORIES.length;
  const configuredAll = Object.keys(selections).filter(
    (k) => Boolean(selections[k as BuilderSlotId])
  ).length;

  // Percentage weighted heavily on required components
  const requiredPercent = Math.round((configuredRequired / totalRequired) * 100);

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Build Completeness
          </span>
          <p className="text-[11px] text-muted-foreground">
            {configuredRequired} of {totalRequired} core hardware parts chosen
          </p>
        </div>
        <span className="text-sm font-mono font-bold text-primary">
          {requiredPercent}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted/80 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 via-primary to-emerald-400 transition-all duration-500 rounded-full"
          style={{ width: `${requiredPercent}%` }}
        />
      </div>

      {/* Missing Core Alert or All Set */}
      {configuredRequired < totalRequired ? (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Missing: {requiredCategories.filter((c) => !selections[c.id]).map((c) => c.name.split(' ')[0]).join(', ')}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <Check className="w-3.5 h-3.5 shrink-0" />
          <span>All critical components selected. Ready to build or assemble!</span>
        </div>
      )}
    </div>
  );
}
