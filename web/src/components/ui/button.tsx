import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { LucideLoader2, Plus } from 'lucide-react';
import { Link, LinkProps } from 'react-router';

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none select-none',
    'apple-pressable apple-focus-ring',
    'disabled:pointer-events-none disabled:opacity-45 border-0.5 border-transparent',
    '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 shrink-0 [&_svg]:shrink-0',
  ),
  {
    variants: {
      variant: {
        // Solid variant series:
        // Button has its own background color, may have borders
        default:
          'bg-text-primary text-bg-base shadow-apple-sm hover:bg-text-primary/90 hover:shadow-apple-md focus-visible:bg-text-primary/90',

        secondary: `
          bg-bg-card backdrop-blur-md border-border-button/60
          hover:text-text-primary hover:bg-border-button
          focus-visible:text-text-primary focus-visible:bg-border-button
        `,

        highlighted: `
          bg-text-primary text-bg-base border-b-2 border-b-accent-primary shadow-apple-sm
          hover:bg-text-primary/90 hover:shadow-apple-md focus-visible:bg-text-primary/90
        `,

        accent: `
          bg-accent-primary text-white shadow-[0_2px_10px_-2px_rgb(var(--accent-primary)/0.45),inset_0_1px_0_0_rgba(255,255,255,0.28)]
          hover:bg-accent-primary/90 hover:shadow-[0_4px_16px_-2px_rgb(var(--accent-primary)/0.55),inset_0_1px_0_0_rgba(255,255,255,0.35)]
          focus-visible:bg-accent-primary/90
        `,

        destructive: `
          bg-state-error text-white shadow-[0_2px_10px_-2px_rgb(var(--state-error)/0.4),inset_0_1px_0_0_rgba(255,255,255,0.24)]
          hover:bg-state-error/90 focus-visible:ring-state-error/20 dark:focus-visible:ring-state-error/40
        `,

        // Outline variant series
        // Button has transparent or greyish background, may have borders
        outline: `
          text-text-secondary bg-bg-input/80 backdrop-blur-md border-0.5 border-border-button shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
          hover:text-text-primary hover:bg-border-button hover:border-border-default
          focus-visible:text-text-primary focus-visible:bg-border-button focus-visible:border-border-button
        `, // light: bg=transparent, dark: bg-input

        dashed: `
          text-text-secondary border-border-button border-dashed
          hover:text-text-primary hover:bg-border-button hover:border-border-default
          focus-visible:text-text-primary focus-visible:bg-border-button focus-visible:border-border-button
        `,

        icon: 'bg-transparent text-foreground hover:bg-bg-card/80',

        transparent: `
          text-text-secondary bg-transparent border-0.5 border-border-button
          hover:text-text-primary hover:bg-border-button
          focus-visible:text-text-primary focus-visible:bg-border-button focus-visible:border-border-button
        `,

        danger: `
          bg-transparent border border-state-error/70 text-state-error
          hover:bg-state-error/10 focus-visible:bg-state-error/10
        `,

        'danger-hover': `
          bg-bg-input border-border-button
          hover:bg-state-error/10 focus-visible:bg-state-error/10
          hover:text-state-error focus-visible:text-state-error
          hover:border-state-error/70 focus-visible:border-state-error/70
        `,

        // Ghost variant series
        // Button has transparent background, without borders
        ghost: `
          text-text-secondary
          hover:bg-bg-card focus-visible:bg-bg-card
          hover:text-text-primary focus-visible:text-text-primary
        `,

        delete: `
          text-text-secondary
          hover:bg-state-error-5 hover:text-state-error
          focus-visible:text-state-error focus-visible:bg-state-error-5
        `,

        metallic: `
          text-white shadow-[0_2px_12px_-2px_rgb(var(--accent-primary)/0.45),inset_0_1px_0_0_rgba(255,255,255,0.3)]
          bg-accent-primary
          hover:bg-accent-primary/90 hover:shadow-[0_6px_20px_-4px_rgb(var(--accent-primary)/0.55),inset_0_1px_0_0_rgba(255,255,255,0.38)]
          focus-visible:bg-accent-primary/90
        `,
        link: 'text-accent-primary underline-offset-4 hover:underline',

        // Static
        // Button has no interaction transitions
        static:
          'text-text-secondary hover:text-text-primary focus-visible:text-text-primary active:scale-100',
      },
      size: {
        auto: '',

        xl: 'h-12 rounded-2xl px-5 gap-3',
        lg: 'h-10 rounded-xl px-4',
        default: 'h-8 rounded-lg px-3',
        sm: 'h-7 rounded-md px-2.5 gap-1',
        xs: 'h-6 rounded-sm px-1.5 gap-0.5',

        'icon-xl': 'size-12 rounded-2xl',
        'icon-lg': 'size-10 rounded-xl',
        icon: 'size-8 rounded-lg',
        'icon-sm': 'size-7 rounded-md',
        'icon-xs': 'size-6 rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps<IsAnchor extends boolean = false> = {
  asChild?: boolean;
  asLink?: boolean;
  loading?: boolean;
  block?: boolean;
  disabled?: boolean;
  dot?: boolean;
} & ButtonVariants &
  (IsAnchor extends true
    ? LinkProps
    : React.ButtonHTMLAttributes<HTMLButtonElement>);

const Button = React.forwardRef(function Button<
  IsAnchor extends boolean = false,
>(
  {
    children,
    className,
    variant,
    size,
    dot = false,
    asChild = false,
    asLink = false,
    loading = false,
    disabled = false,
    block = false,
    ...props
  }: ButtonProps<IsAnchor>,
  ref: React.ForwardedRef<
    IsAnchor extends true ? HTMLAnchorElement : HTMLButtonElement
  >,
) {
  const Comp = asChild ? Slot : asLink ? Link : 'button';

  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size, className }),
        { 'w-full': block },
        { relative: dot },
      )}
      // @ts-ignore
      ref={ref as React.RefObject<HTMLButtonElement | HTMLAnchorElement>}
      disabled={loading || disabled}
      {...props}
    >
      <>
        {dot && (
          <span className="absolute size-[6px] rounded-full -right-[3px] -top-[3px] bg-state-error animate" />
        )}
        {loading && <LucideLoader2 className="animate-spin" />}
        {children}
      </>
    </Comp>
  );
});

Button.displayName = 'Button';

export const ButtonLoading = Button;

ButtonLoading.displayName = 'ButtonLoading';

export { Button, buttonVariants };

export const BlockButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function BlockButton({ children, className, ...props }, ref) {
    return (
      <Button
        variant={'outline'}
        ref={ref}
        className={cn('w-full border-dashed border-input-border', className)}
        {...props}
      >
        <Plus /> {children}
      </Button>
    );
  },
);
