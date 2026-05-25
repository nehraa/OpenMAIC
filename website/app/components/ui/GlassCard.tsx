import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'featured';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl p-6 backdrop-blur-xl border border-white/10 transition-all duration-300',
          'bg-gradient-to-b from-white/5 to-transparent',
          'hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/20',
          variant === 'featured' && 'ring-1 ring-orange-500/50 shadow-xl shadow-orange-500/10',
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = 'GlassCard';