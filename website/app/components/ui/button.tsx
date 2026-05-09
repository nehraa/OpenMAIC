'use client';

import { cn } from '@/app/lib/cn';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-dark-base disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-coral text-white hover:bg-coral-strong shadow-glow-coral hover:shadow-[0_0_50px_var(--coral-glow)] hover:-translate-y-0.5 active:translate-y-0',
        secondary:
          'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/30',
        secondaryDark:
          'bg-dark-card border border-dark-line text-white hover:bg-dark-surface hover:border-white/20',
        ghost:
          'bg-transparent text-slate-300 hover:text-white hover:bg-white/5',
        link:
          'bg-transparent text-coral underline-offset-4 hover:underline hover:text-coral-strong',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-lg',
        md: 'h-10 px-4 text-sm rounded-[10px]',
        lg: 'h-12 px-6 text-base rounded-[10px]',
        icon: 'h-10 w-10 rounded-[10px]',
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
