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
      'peer size-3.5 shrink-0 rounded-[4px] border border-border-default outline-none bg-bg-component/70',
      'apple-pressable apple-focus-ring',
      'hover:border-accent-primary/65 hover:bg-accent-primary/8',
      'disabled:cursor-not-allowed disabled:opacity-45',
      'data-[state=checked]:bg-accent-primary data-[state=checked]:text-white data-[state=checked]:border-accent-primary data-[state=checked]:shadow-[0_1px_4px_rgb(var(--accent-primary)/0.45),inset_0_1px_0_rgba(255,255,255,0.3)]',
      'data-[state=indeterminate]:bg-accent-primary data-[state=indeterminate]:text-white data-[state=indeterminate]:border-accent-primary',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current animate-apple-pop">
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
