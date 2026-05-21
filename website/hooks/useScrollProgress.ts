'use client';

import { useState, useEffect, RefObject } from 'react';

export function useScrollProgress(sectionRef: RefObject<HTMLElement>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = rect.height;

      // progress from 0 (section top at bottom of viewport) to 1 (section bottom at top of viewport)
      const p = Math.max(0, Math.min(1, (windowHeight - rect.top) / (sectionHeight + windowHeight)));
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRef]);

  return progress;
}