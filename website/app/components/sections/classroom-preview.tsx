'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { classroomDemoData } from '@/app/lib/demo-data';
import { Send, Mic, Paperclip, Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

export function ClassroomPreview() {
  const { topic, grade, participants, whiteboardContent, discussion } = classroomDemoData;

  return (
    <section className="bg-dark-base py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            Live Classroom
          </p>
          <h2 className="font-display font-semibold text-h1 text-white">
            See It in Action
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            A live photosynthesis lesson with AI professor and agentic classmates.
            Click avatars, ask questions, watch quizzes generate.
          </p>
        </div>

        {/* Browser Shell */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-dark-card rounded-2xl border border-dark-line shadow-glass overflow-hidden"
        >
          {/* Browser Top Bar */}
          <div className="px-4 py-3 bg-dark-surface border-b border-dark-line flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-coral/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-teal/80" />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-teal">●</span>
                <span>{topic}</span>
                <span className="text-slate-600">•</span>
                <span>{grade}</span>
                <span className="text-slate-600">•</span>
                <span>45 min</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Mic className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-[200px_1fr_280px] min-h-[500px]">
            {/* Left Rail - Participants */}
            <div className="p-4 border-r border-dark-line bg-dark-surface/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Participants
              </p>
              <div className="space-y-3">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <Avatar
                      initials={p.avatar}
                      color={p.color as 'teal' | 'violet' | 'coral' | 'info'}
                      size="sm"
                      showRing={p.id === 'professor'}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-dark-line">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Lesson Phases
                </p>
                <div className="space-y-2">
                  {['Introduction', 'Core Concept', 'Discussion', 'Quiz', 'Summary'].map(
                    (phase, i) => (
                      <div
                        key={phase}
                        className={cn(
                          'text-xs px-2 py-1.5 rounded-md',
                          i === 2
                            ? 'bg-coral/20 text-coral border border-coral/30'
                            : i < 2
                            ? 'bg-teal/20 text-teal border border-teal/30'
                            : 'text-slate-500'
                        )}
                      >
                        {phase}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Main Canvas - Whiteboard */}
            <div className="p-6 flex flex-col">
              <div className="flex-1 bg-dark-surface rounded-xl border border-dark-line p-6 flex flex-col items-center justify-center">
                <p className="text-sm text-slate-500 mb-4">{whiteboardContent.title}</p>
                <div className="font-mono text-2xl md:text-3xl text-white text-center leading-relaxed">
                  <span className="text-teal">{whiteboardContent.equation.split('→')[0]}</span>
                  <span className="text-slate-500 mx-4">→</span>
                  <span className="text-coral">{whiteboardContent.equation.split('→')[1]}</span>
                </div>

                {/* Diagram placeholder */}
                <div className="mt-8 w-full max-w-md">
                  <div className="relative h-40 bg-dark-card rounded-lg border border-dark-line flex items-center justify-center">
                    <div className="absolute inset-4 border-2 border-dashed border-slate-700 rounded-lg" />
                    <div className="text-center">
                      <svg className="w-12 h-12 text-slate-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <p className="text-sm text-slate-500">Chloroplast structure diagram</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Rail - Discussion */}
            <div className="p-4 border-l border-dark-line bg-dark-surface/50 flex flex-col">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Discussion
              </p>

              <div className="flex-1 space-y-4 overflow-y-auto">
                {discussion.map((d, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          d.speaker === 'Professor'
                            ? 'teal'
                            : d.speaker === 'Priya'
                            ? 'violet'
                            : 'default'
                        }
                      >
                        {d.speaker}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300 bg-dark-card rounded-lg p-3">
                      &ldquo;{d.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

              {/* Quiz Card */}
              <div className="mt-4 pt-4 border-t border-dark-line">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Generated Quiz
                </p>
                <div className="bg-dark-card rounded-lg p-3 border border-coral/30">
                  <p className="text-sm text-white mb-3">
                    {classroomDemoData.quiz.question}
                  </p>
                  <div className="space-y-2">
                    {classroomDemoData.quiz.options.map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          'text-xs px-3 py-2 rounded-md border',
                          i === classroomDemoData.quiz.correct
                            ? 'bg-teal/20 text-teal border-teal/30'
                            : 'bg-dark-surface text-slate-400 border-dark-line'
                        )}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Composer */}
          <div className="p-4 border-t border-dark-line bg-dark-surface">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon">
                <Mic className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1 bg-dark-card rounded-xl border border-dark-line px-4 py-3 text-slate-400 text-sm">
                Ask the class anything...
              </div>
              <Button>
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="secondary">
                <Sparkles className="w-4 h-4" />
                Generate Quiz
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Interactive hints */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal" />
            Click avatars to see persona cards
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-coral" />
            Voice questions get spatial audio
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet" />
            Whiteboard strokes are replayable
          </span>
        </div>
      </div>
    </section>
  );
}
