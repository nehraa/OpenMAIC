'use client';

import { cn } from '@/app/lib/cn';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      time += 0.01;

      const gradient = ctx.createRadialGradient(
        canvas.width * mousePosition.x,
        canvas.height * mousePosition.y,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      );

      // Create aurora effect
      const hue1 = (time * 20) % 360;
      const hue2 = (time * 20 + 120) % 360;
      const hue3 = (time * 20 + 240) % 360;

      gradient.addColorStop(0, `hsla(${hue1}, 80%, 60%, 0.3)`);
      gradient.addColorStop(0.3, `hsla(${hue2}, 70%, 50%, 0.15)`);
      gradient.addColorStop(0.6, `hsla(${hue3}, 70%, 50%, 0.1)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [mousePosition]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePosition({
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dark-hero"
      onMouseMove={handleMouseMove}
    >
      {/* Shader Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* Static gradient fallback for reduced motion */}
      <div
        className="absolute inset-0 bg-gradient-hero"
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {/* Hero Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-kicker font-semibold tracking-widest text-coral uppercase mb-6"
        >
          Live Multi-Agent AI Classroom
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display font-bold text-display leading-tight mb-6"
        >
          Learn Beyond Limits
        </motion.h1>

        {/* Support Copy */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-body-lg text-slate-300 max-w-2xl mx-auto mb-10"
        >
          Turn any topic into a live lesson with an AI professor, debating
          classmates, whiteboard drawings, voice Q&A, and adaptive practice.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Button size="lg" className="w-full sm:w-auto animate-pulse-glow">
            Start Learning
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Watch Classroom Demo
          </Button>
        </motion.div>

        {/* Trust Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-sm text-slate-500"
        >
          No setup. Start with one topic.
        </motion.p>

        {/* Floating Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 flex flex-wrap justify-center gap-4"
        >
          {[
            { text: 'AI Professor online', color: 'bg-teal/20 text-teal border-teal/30' },
            { text: 'Agentic Classmates', color: 'bg-violet/20 text-violet border-violet/30' },
            { text: 'Live Whiteboard', color: 'bg-coral/20 text-coral border-coral/30' },
          ].map((badge) => (
            <span
              key={badge.text}
              className={cn(
                'px-4 py-2 rounded-full text-sm border backdrop-blur-sm',
                badge.color
              )}
            >
              {badge.text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-dark-base" />
    </section>
  );
}
