import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import { cn } from '../lib/utils';

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2.5', className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    label?: string;
    description?: string;
  }
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId();
  const itemId = id || generatedId;

  const itemNode = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={itemId}
      className={cn(
        'aspect-square h-4 w-4 rounded-full border border-cyber-700 bg-cyber-950 text-cyan-400 ring-offset-background transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:border-cyan-400 data-[state=checked]:shadow-[0_0_8px_rgba(6,182,212,0.5)]',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2 w-2 fill-cyan-400 text-cyan-400" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (!label && !description) {
    return itemNode;
  }

  return (
    <div className="flex items-start space-x-2.5">
      {itemNode}
      <div className="grid gap-0.5 leading-none">
        {label && (
          <label
            htmlFor={itemId}
            className="text-sm font-medium text-cyber-200 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-cyber-500">{description}</p>
        )}
      </div>
    </div>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
