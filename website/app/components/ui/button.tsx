'use client';

import { cn } from '@/app/lib/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40',
        secondary:
          'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700',
        secondaryDark:
          'bg-dark-card border border-dark-line text-white hover:bg-dark-surface hover:border-white/20',
        ghost:
          'bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-white/5',
        link:
          'bg-transparent text-orange-500 underline-offset-4 hover:underline hover:text-orange-600',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-xl',
        md: 'h-11 px-6 text-base rounded-xl',
        lg: 'h-14 px-8 text-lg rounded-xl',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };