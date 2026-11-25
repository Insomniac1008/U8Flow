import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-0.5 px-2.5 py-0.5 text-xs font-medium transition-[background-color,border-color,color] duration-200 ease-apple-spring outline-none focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'border-accent-primary/20 bg-accent-primary/12 text-accent-primary hover:bg-accent-primary/18',
        secondary:
          'border-border-button bg-bg-card text-text-secondary rounded-lg',
        success:
          'border-state-success/25 bg-state-success/12 text-state-success rounded-lg',
        destructive:
          'border-state-error/25 bg-state-error/12 text-state-error rounded-lg',
        outline: 'border-border-default text-text-primary bg-bg-component/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
