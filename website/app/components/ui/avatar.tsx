'use client';

import { cn } from '@/app/lib/cn';

interface AvatarProps {
  initials: string;
  color?: 'teal' | 'violet' | 'coral' | 'info' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showRing?: boolean;
}

const colorClasses = {
  teal: 'bg-teal/20 text-teal border-teal',
  violet: 'bg-violet/20 text-violet border-violet',
  coral: 'bg-coral/20 text-coral border-coral',
  info: 'bg-info/20 text-info border-info',
  slate: 'bg-slate-500/20 text-slate-400 border-slate-400',
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
};

export function Avatar({
  initials,
  color = 'slate',
  size = 'md',
  className,
  showRing = false,
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border-2 font-semibold',
        colorClasses[color],
        sizeClasses[size],
        showRing && 'animate-pulse ring-2 ring-offset-2 ring-offset-dark-base',
        className
      )}
    >
      {initials}
    </div>
  );
}
