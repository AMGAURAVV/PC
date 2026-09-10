'use client';

import * as React from 'react';
import { Zap, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@pc-platform/ui';

interface PowerEstimateProps {
  estimatedPowerW: number;
  recommendedPsuW: number;
  selectedPsuWattage?: number | undefined;
  className?: string | undefined;
}

export function PowerEstimate({
  estimatedPowerW,
  recommendedPsuW,
  selectedPsuWattage,
  className = '',
}: PowerEstimateProps) {
  // Calculate percentage of recommended PSU consumed
  const baselineTarget = selectedPsuWattage || recommendedPsuW || 650;
  const powerPercent = Math.min(
    Math.round(((estimatedPowerW || 0) / (baselineTarget || 650)) * 100),
    100
  );

  const isUnderpowered = selectedPsuWattage ? selectedPsuWattage < recommendedPsuW : false;
  const isHealthy = selectedPsuWattage ? selectedPsuWattage >= recommendedPsuW : true;

  return (
    <div className={`p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Power Consumption
            </h4>
            <p className="text-[11px] text-muted-foreground">Estimated System TDP & Load</p>
          </div>
        </div>

        {selectedPsuWattage ? (
          isUnderpowered ? (
            <Badge variant="destructive" className="text-[10px] font-mono gap-1">
              <AlertTriangle className="w-3 h-3" /> Underpowered
            </Badge>
          ) : (
            <Badge variant="success" className="text-[10px] font-mono gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3 h-3" /> Sufficient
            </Badge>
          )
        ) : (
          <Badge variant="outline" className="text-[10px] font-mono">
            {estimatedPowerW > 0 ? 'Calculated' : 'Idle'}
          </Badge>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Estimated Draw</span>
          <div className="text-lg font-mono font-bold text-foreground">
            {estimatedPowerW} <span className="text-xs font-normal text-muted-foreground">W</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Recommended PSU</span>
          <div className="text-lg font-mono font-bold text-primary">
            {recommendedPsuW}{' '}
            <span className="text-xs font-normal text-muted-foreground">W+</span>
          </div>
        </div>
      </div>

      {/* Gauge Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>0W</span>
          <span>Load: {powerPercent}% of {baselineTarget}W</span>
          <span>{baselineTarget}W</span>
        </div>
        <div className="w-full h-2 bg-muted/80 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              powerPercent > 85
                ? 'bg-destructive'
                : powerPercent > 65
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.max(powerPercent, 4)}%` }}
          />
        </div>
      </div>

      {/* Guidance Note */}
      {selectedPsuWattage && isUnderpowered ? (
        <p className="text-[11px] text-destructive flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Your selected PSU ({selectedPsuWattage}W) is lower than the recommended {recommendedPsuW}W. Upgrade to prevent unexpected shutdowns during gaming peaks.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          Includes a 25-30% safe headroom for transient spikes and peripheral expansion.
        </p>
      )}
    </div>
  );
}
