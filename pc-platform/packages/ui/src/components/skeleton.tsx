import * as React from 'react';
import { cn } from '../lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  shimmer = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-md bg-cyber-900/80 border border-cyber-800/40 relative overflow-hidden',
        shimmer && 'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/5 after:to-transparent',
        className
      )}
      {...props}
    />
  );
};

export const ProductCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-cyber-800/80 bg-cyber-950/60 p-4 space-y-4 relative overflow-hidden',
        className
      )}
    >
      {/* Image placeholder */}
      <Skeleton className="h-44 w-full rounded-lg" />
      
      {/* Category & Badge */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Specs row */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-20 rounded" />
        <Skeleton className="h-5 w-14 rounded" />
      </div>

      {/* Price & Action */}
      <div className="pt-3 border-t border-cyber-800/60 flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
};

export const SpecsTableSkeleton: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={cn('rounded-lg border border-cyber-800 bg-cyber-950/40 overflow-hidden', className)}>
      <div className="grid grid-cols-2 p-3 bg-cyber-900/60 border-b border-cyber-800">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="divide-y divide-cyber-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 p-3 items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
};
