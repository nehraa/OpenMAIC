'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface ScrollVideoProps {
  src: string;
  screenshots?: string[];
  className?: string;
  children?: ReactNode;
}

export function ScrollVideo({ src, screenshots = [], className = '', children }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(sectionRef);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    video.currentTime = progress * video.duration;
  }, [progress]);

  return (
    <div ref={sectionRef} className={`relative w-full aspect-video overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      {screenshots.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            opacity: Math.abs(progress - i / (screenshots.length - 1)) < 0.15 ? 1 : 0,
          }}
        />
      ))}
      {children}
    </div>
  );
}