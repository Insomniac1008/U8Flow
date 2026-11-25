'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { CircleIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentProps<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      ref={ref}
      data-slot="radio-group"
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
});

RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentProps<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      data-slot="radio-group-item"
      className={cn(
        'text-white aspect-square size-4 shrink-0 rounded-full',
        'transition-all duration-200 ease-apple-spring outline-none border border-border-default bg-bg-input/80',
        'hover:border-accent-primary/60 hover:bg-bg-card',
        'apple-focus-ring',
        'data-[state=checked]:border-accent-primary data-[state=checked]:bg-accent-primary data-[state=checked]:shadow-[0_1px_4px_rgb(var(--accent-primary)/0.35)]',
        'aria-[invalid]:border-state-error aria-[invalid]:bg-state-error/5 aria-[invalid]:text-state-error',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center animate-apple-check-pop"
      >
        <CircleIcon className="fill-current absolute top-1/2 left-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});

RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
