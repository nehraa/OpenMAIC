'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { ScrollVideo } from '@/app/components/scroll-video/ScrollVideo';
import { useParallax } from '@/hooks/useParallax';
import { cn } from '@/app/lib/cn';

const floatingBadges = [
  { label: 'AI Professor', icon: '🎓', color: 'teal' },
  { label: 'Agentic Classmates', icon: '🤖', color: 'violet' },
  { label: 'Live Whiteboard', icon: '🎨', color: 'coral' },
];

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const parallaxOffset = useParallax(sectionRef, 0.3);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Video Background */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}>
        <ScrollVideo
          src="/video/clips/hero-demo.mp4"
          screenshots={['/video/screenshots/hero.jpg']}
          className="w-full h-full"
        />
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/50 to-zinc-950 z-10" />

      {/* Floating Badges */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 z-30 flex gap-3 flex-wrap justify-center px-6">
        {floatingBadges.map((badge) => (
          <motion.div
            key={badge.label}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 backdrop-blur-md border border-white/10"
          >
            <span className="text-lg">{badge.icon}</span>
            <span className="text-sm font-medium text-zinc-200">{badge.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Center Glass Card with Headline */}
      <motion.div style={{ y, opacity }} className="relative z-20 max-w-5xl mx-auto px-6 pt-20">
        <GlassCard className="p-8 md:p-12 backdrop-blur-xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-orange-500 font-semibold tracking-widest uppercase mb-6 text-sm"
          >
            Live Multi-Agent AI Classroom
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight"
          >
            AI-Powered Live Classroom — Your Professor, Debate Partners, and Tutor in One Session
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Enter any topic and experience a complete learning session with an AI professor who teaches,
            agentic classmates who debate, a collaborative whiteboard, and adaptive quizzes — all in real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-shadow relative overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-teal-500/30 blur-md animate-pulse" />
              <span className="relative flex items-center gap-2">
                Start Learning Free
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto hover:bg-zinc-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Watch Demo
            </Button>
          </motion.div>
        </GlassCard>
      </motion.div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent z-10" />

      {/* Decorative elements */}
      <div className="absolute bottom-20 left-10 z-20 hidden lg:block" style={{ transform: `translateY(${parallaxOffset}px)` }}>
        <GlassCard className="p-4 opacity-80">
          <p className="text-xs text-zinc-400 mb-1">Current Session</p>
          <p className="text-white font-semibold">Photosynthesis — Grade 10</p>
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <div className="w-2 h-2 rounded-full bg-teal-500" />
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          </div>
        </GlassCard>
      </div>

      <div className="absolute top-1/3 right-10 z-20 hidden lg:block" style={{ transform: `translateY(${parallaxOffset * 0.7}px)` }}>
        <GlassCard className="p-4 opacity-80">
          <p className="text-xs text-zinc-400 mb-1">AI Professor</p>
          <p className="text-white font-semibold">Dr. Amit Singh</p>
          <p className="text-xs text-teal-400 mt-1">Explaining now</p>
        </GlassCard>
      </div>
    </section>
  );
}