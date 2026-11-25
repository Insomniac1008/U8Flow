'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border-button shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent-primary" />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb
      className="
      block h-3.5 w-3.5 rounded-full border-0.5 border-black/10 bg-white
      shadow-[0_2px_6px_rgba(0,0,0,0.22),0_0.5px_1px_rgba(0,0,0,0.14)]
      transition-[transform,box-shadow] duration-200 ease-apple-bounce
      hover:scale-[1.15] active:scale-125 apple-focus-ring
      disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

type SliderProps = Omit<
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
  'onChange' | 'value'
> & { onChange: (value: number) => void; value: number };

const FormSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function FormSlider({ onChange, value, ...props }, ref) {
  return (
    <Slider
      ref={ref}
      {...props}
      value={[value]}
      onValueChange={(vals) => {
        onChange(vals[0]);
      }}
    />
  );
});

Slider.displayName = SliderPrimitive.Root.displayName;

export { FormSlider, Slider };
