'use client';

import { ReactNode } from 'react';
import { useParallax } from '@/hooks/useParallax';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number; // 0.1 = slowest (farthest), 1.0 = fastest (foreground)
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.5, className = '' }: ParallaxLayerProps) {
  const offset = useParallax(null, speed);

  return (
    <div
      className={`will-change-transform ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}