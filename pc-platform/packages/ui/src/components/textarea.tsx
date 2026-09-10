import * as React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-cyber-800 bg-cyber-950/80 px-3 py-2 text-sm text-cyber-100 placeholder:text-cyber-500 transition-colors',
            'focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:border-red-400 focus-visible:ring-red-400/50',
            className
          )}
          ref={ref}
          {...props}
        />
        {typeof error === 'string' && (
          <p className="mt-1 text-xs text-red-400 font-mono">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
