import * as React from 'react';
import { cn } from '../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean | string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="w-full relative">
        <select
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-cyber-800 bg-cyber-950/80 px-3 py-2 pr-9 text-sm text-cyber-100 placeholder:text-cyber-500 transition-colors',
            'focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:border-red-400 focus-visible:ring-red-400/50',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cyber-400 pointer-events-none" />
        {typeof error === 'string' && (
          <p className="mt-1 text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';
