'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { Mic, Paperclip, Send, Sparkles, BookOpen, Users, BarChart3 } from 'lucide-react';
import Image from 'next/image';

const features = [
  {
    icon: BookOpen,
    title: 'Whiteboard Drawing',
    description: 'Watch concepts come alive with hand-drawn diagrams and dynamic charts',
    color: 'violet',
  },
  {
    icon: Users,
    title: 'Agentic Classmates',
    description: 'AI-powered debate partners who challenge and deepen your understanding',
    color: 'coral',
  },
  {
    icon: Mic,
    title: 'Voice Intelligence',
    description: 'Speak naturally — voice AI understands context and adapts to you',
    color: 'teal',
  },
  {
    icon: BarChart3,
    title: 'Progress Dashboard',
    description: 'Track comprehension across topics and watch mastery grow day by day',
    color: 'violet',
  },
];

export function ClassroomPreview() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#0f0a1a] to-[#1a0f2e]">
      {/* Background bokeh orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-64 h-64 bg-violet-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-40 right-[15%] w-48 h-48 bg-coral-500/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-20 left-[30%] w-56 h-56 bg-teal-500/10 rounded-full blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="text-violet-400 font-semibold tracking-widest uppercase mb-4 text-sm">
            Live Classroom
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
            See It in Action
          </h2>
          <p className="text-slate-300 mt-4 max-w-2xl mx-auto text-lg">
            A live session with AI professor and agentic classmates.
            Click avatars, ask questions, watch quizzes generate.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Main Glass Panel - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 w-full"
          >
            {/* Glass container */}
            <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl border border-white/10 bg-white/5 shadow-2xl">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-coral-500/5 pointer-events-none" />

              {/* Content */}
              <div className="p-8 md:p-12">
                {/* Topic Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Live Session
                      </span>
                      <span className="text-slate-400 text-sm">Photosynthesis • Grade 9 • 45 min</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      How do plants make food?
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors">
                      <Mic className="w-4 h-4" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white/20 transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-500 to-coral-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate Quiz
                    </button>
                  </div>
                </div>

                {/* 2x2 Feature Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                        feature.color === 'violet' && 'bg-violet-500/20 text-violet-400',
                        feature.color === 'coral' && 'bg-coral-500/20 text-coral-400',
                        feature.color === 'teal' && 'bg-teal-500/20 text-teal-400',
                      )}>
                        <feature.icon className="w-6 h-6" />
                      </div>

                      <h4 className="text-lg font-semibold text-white mb-2">
                        {feature.title}
                      </h4>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>

                      {/* Hover glow effect */}
                      <div className={cn(
                        'absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10',
                        feature.color === 'violet' && 'bg-gradient-to-br from-violet-500/10 to-transparent',
                        feature.color === 'coral' && 'bg-gradient-to-br from-coral-500/10 to-transparent',
                        feature.color === 'teal' && 'bg-gradient-to-br from-teal-500/10 to-transparent',
                      )} />
                    </motion.div>
                  ))}
                </div>

                {/* Session Info Bar */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                        P
                      </div>
                      <span className="text-white text-sm">Professor Chen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-coral-500/20 border border-coral-500/30 flex items-center justify-center text-xs font-bold text-coral-300">
                        M
                      </div>
                      <span className="text-white text-sm">Meera</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-teal-300">
                        A
                      </div>
                      <span className="text-white text-sm">Alex</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      Discussion Phase
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Molecule GIF - Right Side (Floating) */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex-shrink-0"
          >
            <div className="relative w-64 h-64 md:w-80 md:h-80 animate-float">
              {/* Glow behind molecule */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-coral-500/30 rounded-full blur-3xl" />
              {/* Molecule GIF */}
              <Image
                src="/images/3D_interactive.gif"
                alt="Interactive 3D molecule"
                width={320}
                height={320}
                className="relative w-full h-full object-contain"
                unoptimized
              />
            </div>
          </motion.div>
        </div>

        {/* Interactive hints */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-12 flex flex-wrap justify-center gap-8 text-sm"
        >
          {[
            { color: 'bg-violet-400', text: 'Click avatars to see persona cards' },
            { color: 'bg-coral-400', text: 'Voice questions get spatial audio' },
            { color: 'bg-teal-400', text: 'Whiteboard strokes are replayable' },
          ].map((hint) => (
            <span key={hint.text} className="flex items-center gap-2 text-slate-400">
              <span className={cn('w-2 h-2 rounded-full', hint.color)} />
              {hint.text}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}