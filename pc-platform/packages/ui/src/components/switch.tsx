import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
    label?: string;
    description?: string;
  }
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const switchNode = (
    <SwitchPrimitives.Root
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-950',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-cyan-500 data-[state=unchecked]:bg-cyber-800',
        className
      )}
      {...props}
      id={switchId}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  );

  if (!label && !description) {
    return switchNode;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="grid gap-0.5 leading-none">
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-medium text-cyber-200 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-cyber-500">{description}</p>
        )}
      </div>
      {switchNode}
    </div>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;
