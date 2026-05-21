'use client';

import { useState, useEffect, RefObject } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInView(
  sectionRef: RefObject<HTMLElement>,
  options: UseInViewOptions = {}
): boolean {
  const [isInView, setIsInView] = useState(false);
  const { threshold = 0.3, rootMargin = '0px' } = options;

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold, rootMargin }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [sectionRef, threshold, rootMargin]);

  return isInView;
}