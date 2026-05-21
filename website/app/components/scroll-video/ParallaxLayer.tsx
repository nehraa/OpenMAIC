'use client';

import { useRef, ReactNode } from 'react';
import { useParallax } from '@/hooks/useParallax';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number; // 0.1 = slowest (farthest), 1.0 = fastest (foreground)
  className?: string;
}

export function ParallaxLayer({ children, speed = 0.5, className = '' }: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const offset = useParallax(ref, speed);

  return (
    <div
      ref={ref}
      className={`will-change-transform ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}