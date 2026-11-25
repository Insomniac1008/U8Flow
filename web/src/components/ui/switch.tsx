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
        'group/switch inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5',
        'border-0.5 border-black/5 dark:border-white/10 overflow-hidden transition-all duration-300 ease-apple-spring',
        'apple-focus-ring',
        'disabled:cursor-not-allowed disabled:opacity-45',
        'data-[state=checked]:bg-state-success data-[state=unchecked]:bg-text-sub-title/35',
        'shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]',
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
        pointer-events-none block h-4 w-4 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.22),0_0.5px_1px_rgba(0,0,0,0.12)] ring-0 transition-all duration-300 ease-apple-bounce
        group-active/switch:w-5
        data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0
        group-active/switch:data-[state=checked]:translate-x-3
      "
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
