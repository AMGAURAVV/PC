import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary/20 text-primary-foreground border border-primary/40',
        primary:
          'bg-primary/20 text-primary-foreground border border-primary/40',
        secondary:
          'bg-secondary text-secondary-foreground border border-border/60',
        success:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
        compatible:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold',
        warning:
          'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]',
        destructive:
          'bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]',
        incompatible:
          'bg-rose-500/15 text-rose-400 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.25)] font-semibold',
        gaming:
          'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,240,255,0.25)]',
        tech:
          'bg-cyber-800 text-slate-300 border border-cyber-600 font-mono text-[11px] rounded-md px-2 py-0.5',
        outline:
          'border border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  className,
  variant,
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-current',
            pulse && 'animate-pulse',
          )}
        />
      )}
      {children}
    </div>
  );
}
