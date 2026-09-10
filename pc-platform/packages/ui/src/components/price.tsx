import * as React from 'react';
import { cn } from '../lib/utils';
import { Badge } from './badge';

export interface PriceProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number;
  compareAt?: number | null | undefined;
  currency?: string | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined;
  showDiscount?: boolean | undefined;
  taxInclusive?: boolean | undefined;
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function Price({
  amount,
  compareAt,
  currency = 'INR',
  size = 'md',
  showDiscount = true,
  taxInclusive = true,
  className,
  ...props
}: PriceProps) {
  const discountPercent =
    compareAt && compareAt > amount
      ? Math.round(((compareAt - amount) / compareAt) * 100)
      : null;

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-3xl font-extrabold tracking-tight',
  }[size];

  return (
    <div className={cn('inline-flex flex-wrap items-baseline gap-2', className)} {...props}>
      <span className={cn('text-foreground font-mono', sizeClasses)}>
        {formatINR(amount)}
      </span>

      {compareAt && compareAt > amount && (
        <span className="text-muted-foreground line-through text-xs font-mono">
          {formatINR(compareAt)}
        </span>
      )}

      {showDiscount && discountPercent && discountPercent > 0 && (
        <Badge variant="gaming" className="px-1.5 py-0 text-[10px] font-bold">
          -{discountPercent}%
        </Badge>
      )}

      {taxInclusive && (
        <span className="text-[10px] text-muted-foreground block w-full mt-0.5">
          Incl. of all taxes
        </span>
      )}
    </div>
  );
}
