'use client';

import * as React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Wrench,
} from 'lucide-react';
import { CompatibilityResult, CompatibilityIssueItem } from '@pc-platform/types';
import { Badge, Button } from '@pc-platform/ui';

interface CompatibilityPanelProps {
  result?: CompatibilityResult | null | undefined;
  isLoading?: boolean | undefined;
  onSelectAlternative?: ((slotId: string) => void) | undefined;
  className?: string | undefined;
}

export function CompatibilityPanel({
  result,
  isLoading = false,
  onSelectAlternative,
  className = '',
}: CompatibilityPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (isLoading) {
    return (
      <div className={`p-4 rounded-xl border border-border/70 bg-card/60 animate-pulse ${className}`}>
        <div className="h-5 w-40 bg-muted rounded mb-2" />
        <div className="h-4 w-60 bg-muted/60 rounded" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className={`p-4 rounded-xl border border-dashed border-border/80 bg-card/40 flex items-center gap-3 ${className}`}>
        <div className="p-2 rounded-lg bg-muted text-muted-foreground">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Compatibility Engine Idle
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Add components (CPU, Motherboard, RAM, etc.) to run real-time hardware checks.
          </p>
        </div>
      </div>
    );
  }

  const { status, compatible, issues = [], warnings = [], summary } = result;

  // Calculate a compatibility health score
  let score = 100;
  if (!compatible || status === 'incompatible') {
    score = Math.max(30, 100 - issues.length * 25);
  } else if (warnings.length > 0) {
    score = Math.max(70, 100 - warnings.length * 10);
  }

  const hasProblems = issues.length > 0 || warnings.length > 0;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
        status === 'incompatible'
          ? 'border-destructive/60 bg-destructive/5'
          : status === 'warning'
          ? 'border-amber-500/50 bg-amber-500/5'
          : 'border-emerald-500/40 bg-emerald-500/5'
      } ${className}`}
    >
      {/* Header Banner */}
      <div className="p-4 flex items-center justify-between gap-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 ${
              status === 'incompatible'
                ? 'bg-destructive/15 text-destructive'
                : status === 'warning'
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {status === 'incompatible' ? (
              <ShieldAlert className="w-5 h-5" />
            ) : status === 'warning' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">
                {status === 'incompatible'
                  ? 'Compatibility Conflicts Detected'
                  : status === 'warning'
                  ? 'Compatibility Warnings'
                  : 'All Parts Compatible'}
              </h4>
              <Badge
                variant={
                  status === 'incompatible'
                    ? 'destructive'
                    : status === 'warning'
                    ? 'warning'
                    : 'success'
                }
                className="text-[10px] font-mono uppercase"
              >
                {score}% Health Score
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {summary ||
                (compatible
                  ? 'Authoritative engine verified socket, form factor, power, and clearances.'
                  : 'Critical hardware mismatch requires component change.')}
            </p>
          </div>
        </div>

        {hasProblems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted-foreground hover:text-foreground shrink-0 gap-1"
          >
            {isExpanded ? (
              <>
                Hide Details <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View ({issues.length + warnings.length}) <ChevronDown className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Expanded Breakdown */}
      {isExpanded && hasProblems && (
        <div className="p-4 space-y-3 bg-card/40 divide-y divide-border/40">
          {/* Critical Issues */}
          {issues.map((issue: CompatibilityIssueItem, idx: number) => (
            <div key={`issue-${idx}`} className="pt-2 first:pt-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-destructive leading-snug">
                      {issue.title}
                    </h5>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Rule: {issue.ruleId || issue.category}
                    </span>
                  </div>
                </div>
                <Badge variant="destructive" className="text-[9px] uppercase tracking-wider font-mono shrink-0">
                  Critical
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                {issue.explanation}
              </p>

              {issue.suggestedResolution && (
                <div className="ml-6 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive-foreground flex items-start gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Suggested Fix:</strong>{' '}
                    <span>{issue.suggestedResolution}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Warnings */}
          {warnings.map((warn: CompatibilityIssueItem, idx: number) => (
            <div key={`warn-${idx}`} className="pt-2 first:pt-0 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-400 leading-snug">
                      {warn.title}
                    </h5>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Rule: {warn.ruleId || warn.category}
                    </span>
                  </div>
                </div>
                <Badge variant="warning" className="text-[9px] uppercase tracking-wider font-mono shrink-0">
                  Notice
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground pl-6 leading-relaxed">
                {warn.explanation}
              </p>

              {warn.suggestedResolution && (
                <div className="ml-6 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Recommendation:</strong>{' '}
                    <span>{warn.suggestedResolution}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success details if 100% compatible */}
      {compatible && issues.length === 0 && warnings.length === 0 && (
        <div className="px-4 py-2.5 bg-emerald-500/10 border-t border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>No physical or electrical incompatibilities detected across active parts.</span>
        </div>
      )}
    </div>
  );
}
