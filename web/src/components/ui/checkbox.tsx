'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { LucideCheck, LucideMinus } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer size-4 shrink-0 rounded-[5px] border border-border-default outline-none transition-all duration-200 ease-apple-spring bg-bg-input/80',
      'hover:border-accent-primary/60 hover:bg-bg-card',
      'apple-focus-ring',
      'disabled:cursor-not-allowed disabled:opacity-45',
      'data-[state=checked]:bg-accent-primary data-[state=checked]:text-white data-[state=checked]:border-accent-primary data-[state=checked]:shadow-[0_1px_4px_rgb(var(--accent-primary)/0.35)]',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current animate-apple-check-pop">
      {props.checked === 'indeterminate' && (
        <LucideMinus className="size-2.5 stroke-[3]" />
      )}
      {props.checked === true && (
        <LucideCheck className="size-2.5 stroke-[3]" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
