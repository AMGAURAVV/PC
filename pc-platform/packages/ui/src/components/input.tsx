import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-400 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border border-cyber-800 bg-cyber-950/80 px-3 py-2 text-sm text-cyber-100 placeholder:text-cyber-500 transition-colors',
            'focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            error && 'border-red-500 focus-visible:border-red-400 focus-visible:ring-red-400/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
        {typeof error === 'string' && (
          <p className="mt-1 text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
