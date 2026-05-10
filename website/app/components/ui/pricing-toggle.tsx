'use client';

import { cn } from '@/app/lib/cn';
import { useState } from 'react';

interface PricingToggleProps {
  isAnnual: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export function PricingToggle({ isAnnual, onToggle, className }: PricingToggleProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <span className={cn('text-sm', !isAnnual ? 'text-white' : 'text-slate-500')}>
        Monthly
      </span>
      <button
        role="switch"
        aria-checked={isAnnual}
        onClick={() => onToggle(!isAnnual)}
        className={cn(
          'relative w-14 h-8 rounded-full transition-colors duration-200',
          isAnnual ? 'bg-coral' : 'bg-slate-700'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform duration-200',
            isAnnual && 'translate-x-6'
          )}
        />
      </button>
      <span className={cn('text-sm flex items-center gap-2', isAnnual ? 'text-white' : 'text-slate-500')}>
        Annual
        <span className="text-xs text-teal bg-teal/20 px-2 py-0.5 rounded-full">
          Save 20%
        </span>
      </span>
    </div>
  );
}
