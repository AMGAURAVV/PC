import * as React from 'react';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'cyan' | 'purple' | 'white' | 'muted';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  white: 'text-white',
  muted: 'text-cyber-500',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'cyan',
  className,
  ...props
}) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2
        className={cn('animate-spin', sizeClasses[size], variantClasses[variant])}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100, if omitted, indeterminate
  variant?: 'cyan' | 'purple' | 'emerald';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  variant = 'cyan',
  height = 'md',
  showLabel = false,
  className,
  ...props
}) => {
  const isIndeterminate = value === undefined;

  const barHeight = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[height];

  const colorVariants = {
    cyan: 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]',
    purple: 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
  }[variant];

  return (
    <div className={cn('w-full space-y-1.5', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs font-mono text-cyber-400">
          <span>PROGRESS</span>
          <span>{isIndeterminate ? 'COMPUTING...' : `${Math.round(value)}%`}</span>
        </div>
      )}
      <div className={cn('w-full bg-cyber-900 border border-cyber-800 rounded-full overflow-hidden', barHeight)}>
        {isIndeterminate ? (
          <div className={cn('h-full w-1/3 rounded-full animate-[shimmer_1.5s_infinite]', colorVariants)} />
        ) : (
          <div
            className={cn('h-full rounded-full transition-all duration-300 ease-out', colorVariants)}
            style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
          />
        )}
      </div>
    </div>
  );
};

export interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  text = 'LOADING HARDWARE TELEMETRY...',
  blur = true,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-cyber-950/80',
        blur && 'backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 animate-ping absolute inset-0" />
        <div className="w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center bg-cyber-900/60">
          <Spinner size="lg" variant="cyan" />
        </div>
      </div>
      <p className="text-xs font-mono tracking-widest text-cyan-400 font-medium uppercase animate-pulse">
        {text}
      </p>
    </div>
  );
};
