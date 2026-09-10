import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'card' | 'banner' | 'fullscreen';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'TELEMETRY FAILURE',
  message = 'An unexpected anomaly occurred while fetching hardware specifications.',
  errorCode,
  onRetry,
  retryLabel = 'RETRY OPERATION',
  variant = 'card',
  className,
  children,
  ...props
}) => {
  if (variant === 'banner') {
    return (
      <div
        role="alert"
        className={cn(
          'flex items-center justify-between gap-4 p-4 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">{title}: </span>
            <span>{message}</span>
            {errorCode && (
              <span className="font-mono text-xs opacity-75 ml-2">[{errorCode}]</span>
            )}
          </div>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="text-red-300 hover:text-white hover:bg-red-900/40 shrink-0 h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-10 rounded-2xl border border-red-900/40 bg-cyber-950/70 relative overflow-hidden',
        variant === 'fullscreen' && 'min-h-[60vh]',
        className
      )}
      {...props}
    >
      {/* Red ambient warning pulse */}
      <div className="absolute w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Warning icon container */}
      <div className="relative mb-4 flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/60 border border-red-700/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
        <ShieldAlert className="w-8 h-8 text-red-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold tracking-tight text-white mb-1">
        {title}
      </h3>

      {/* Error Code */}
      {errorCode && (
        <span className="inline-block font-mono text-xs text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60 mb-3">
          STATUS: {errorCode}
        </span>
      )}

      {/* Message */}
      <p className="text-sm text-cyber-400 max-w-md mb-6 leading-relaxed">
        {message}
      </p>

      {children}

      {/* Retry Button */}
      {onRetry && (
        <Button variant="danger" onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
