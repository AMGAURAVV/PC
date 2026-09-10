import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../lib/utils';

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  label?: string;
  formatValue?: (val: number) => string;
}

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, label, formatValue, value, defaultValue, ...props }, ref) => {
  const currentVal = (value ?? defaultValue ?? [0]) as number[];

  return (
    <div className="w-full space-y-2">
      {(label || formatValue) && (
        <div className="flex items-center justify-between text-xs font-mono">
          {label && <span className="text-cyber-300 font-medium uppercase tracking-wider">{label}</span>}
          {formatValue && (
            <span className="text-cyan-400 font-semibold">
              {currentVal.map(formatValue).join(' - ')}
            </span>
          )}
        </div>
      )}
      <SliderPrimitive.Root
        ref={ref}
        {...(value !== undefined ? { value } : {})}
        {...(defaultValue !== undefined ? { defaultValue } : {})}
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-cyber-900 border border-cyber-800">
          <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-cyan-500 to-blue-500" />
        </SliderPrimitive.Track>
        {(value || defaultValue || [0]).map((_, i) => (
          <SliderPrimitive.Thumb
            key={i}
            className={cn(
              'block h-4 w-4 rounded-full border border-cyan-400 bg-cyber-950 shadow-[0_0_8px_rgba(6,182,212,0.6)] ring-offset-background transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50 hover:scale-110 active:scale-95'
            )}
          />
        ))}
      </SliderPrimitive.Root>
    </div>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;
