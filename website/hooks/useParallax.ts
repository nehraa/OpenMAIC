'use client';

import { useState, useEffect, RefObject } from 'react';

export function useParallax(
  sectionRef: RefObject<HTMLElement | null>,
  speed: number = 0.5
): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const relativeScroll = -rect.top;
      setOffset(relativeScroll * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRef, speed]);

  return offset;
}