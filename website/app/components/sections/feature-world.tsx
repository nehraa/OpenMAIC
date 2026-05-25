'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { cn } from '@/app/lib/cn';

const features = [
  {
    title: 'Interactive Whiteboard',
    description: 'Draw, diagram, and visualize concepts in real-time with AI-assisted sketching',
    video: '/video/clips/whiteboard-demo.mp4',
    accent: 'teal',
  },
  {
    title: 'AI Debating Classmates',
    description: 'Four distinct personas — Skeptic, Builder, Creative, Examiner — create authentic classroom dynamics',
    video: '/video/clips/agent-demo.mp4',
    accent: 'violet',
  },
  {
    title: 'Adaptive Quizzes',
    description: 'AI-generated questions that adapt to your level and identify weak areas',
    video: '/video/clips/quiz-demo.mp4',
    accent: 'coral',
  },
  {
    title: 'Full Classroom Simulation',
    description: 'A complete lesson with professor, classmates, and collaborative learning',
    video: '/video/clips/classroom-demo.mp4',
    accent: 'teal',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative group cursor-pointer"
    >
      <GlassCard
        variant="default"
        className={cn(
          'overflow-hidden p-0 border-white/10 transition-all duration-300',
          'hover:border-white/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30'
        )}
      >
        {/* Video Container */}
        <div className="relative aspect-video overflow-hidden bg-zinc-900">
          <video
            ref={videoRef}
            src={feature.video}
            muted
            playsInline
            loop
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              isHovering ? 'scale-110' : 'scale-100'
            )}
          />
          {/* Overlay on hover */}
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          />
          {/* Play indicator */}
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center transition-opacity duration-300',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                feature.accent === 'teal' && 'bg-teal-500',
                feature.accent === 'violet' && 'bg-violet-500',
                feature.accent === 'coral' && 'bg-coral-500'
              )}
            />
            <h3 className="text-xl font-bold text-white">{feature.title}</h3>
          </div>
          <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
        </div>

        {/* Accent glow on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10',
            feature.accent === 'teal' && 'bg-gradient-to-br from-teal-500/10 to-transparent',
            feature.accent === 'violet' && 'bg-gradient-to-br from-violet-500/10 to-transparent',
            feature.accent === 'coral' && 'bg-gradient-to-br from-coral-500/10 to-transparent'
          )}
        />
      </GlassCard>
    </motion.div>
  );
}

export function FeatureWorld() {
  return (
    <section className="py-24 px-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Features That Transform Learning
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Every element designed for maximum engagement and understanding.
          </p>
        </motion.div>

        {/* 2x2 Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}