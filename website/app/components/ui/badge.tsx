'use client';

import { cn } from '@/app/lib/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-slate-200',
        coral: 'bg-coral/20 text-coral border border-coral/30',
        teal: 'bg-teal/20 text-teal border border-teal/30',
        violet: 'bg-violet/20 text-violet border border-violet/30',
        success: 'bg-success/20 text-success border border-success/30',
        warning: 'bg-warning/20 text-warning border border-warning/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
