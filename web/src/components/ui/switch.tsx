'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const switchId = React.useId();

  return (
    <SwitchPrimitives.Root
      className={cn(
        'group/switch inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent overflow-hidden transition-[background-color,box-shadow] duration-300 ease-apple-spring apple-focus-ring',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.16)]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        'data-[state=checked]:bg-accent-primary data-[state=checked]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.12),0_0_10px_-2px_rgb(var(--accent-primary)/0.45)] data-[state=unchecked]:bg-text-sub-title/55',
        className,
      )}
      {...props}
      // Own the switch id, like `SelectWithSearch` does. Radix's Slot lets
      // child props win, so this keeps shadcn's `FormControl` from putting the
      // form item id here — otherwise a `FormLabel` (`<label htmlFor>`) would
      // forward its clicks to this switch, making the whole label row toggle it.
      id={switchId}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className="
        pointer-events-none block w-3 h-3 rounded-full bg-white ring-0
        shadow-[0_1.5px_4px_rgba(0,0,0,0.28),0_0.5px_1px_rgba(0,0,0,0.16)]
        transition-all duration-300 ease-apple-bounce
        group-hover/switch:w-3.5 group-active/switch:w-4 group-focus-visible/switch:w-3.5
        data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0
        group-hover/switch:data-[state=checked]:translate-x-2.5 group-active/switch:data-[state=checked]:translate-x-2 group-focus-visible/switch:data-[state=checked]:translate-x-2.5
      "
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
