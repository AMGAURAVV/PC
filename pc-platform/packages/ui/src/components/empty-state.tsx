import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Box, SearchX, ShoppingBag, Cpu, FolderHeart } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: 'box' | 'search' | 'cart' | 'cpu' | 'saved' | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'box',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  children,
  ...props
}) => {
  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;

    const iconClass = 'w-10 h-10 text-cyan-400/80';
    switch (icon) {
      case 'search':
        return <SearchX className={iconClass} />;
      case 'cart':
        return <ShoppingBag className={iconClass} />;
      case 'cpu':
        return <Cpu className={iconClass} />;
      case 'saved':
        return <FolderHeart className={iconClass} />;
      case 'box':
      default:
        return <Box className={iconClass} />;
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-cyber-800 bg-cyber-950/40 relative overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Subtle background radar glow */}
      <div className="absolute w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Icon orb */}
      <div className="relative mb-5 flex items-center justify-center w-20 h-20 rounded-2xl bg-cyber-900/80 border border-cyber-700/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        {renderIcon()}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold tracking-tight text-white mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-cyber-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {/* Custom children or action buttons */}
      {children}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {secondaryActionLabel && (
            <Button variant="secondary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && (
            <Button variant="gaming" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
