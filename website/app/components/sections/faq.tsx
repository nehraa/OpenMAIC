'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/lib/cn';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { X, ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'How does pricing work?',
    answer: 'We offer three tiers: Individual (Free) for self-paced learning, Student ($9/month) for enrolled learners who want deeper classroom experiences with AI classmates, and Teacher ($29/month) for educators managing classroom learning with analytics and student tracking.',
  },
  {
    question: 'What subjects are supported?',
    answer: 'OpenMAIC supports all subjects including Mathematics, Science (Physics, Chemistry, Biology), History, Geography, Languages, and more. The AI adapts explanations to your curriculum level and learning style.',
  },
  {
    question: 'What age groups is it designed for?',
    answer: 'OpenMAIC is designed for learners aged 10 and up, from middle school through adult education. The Teacher tier includes specific features for K-12 and higher education environments.',
  },
  {
    question: 'How does the live classroom work?',
    answer: 'Enter any topic and the AI instantly creates a complete classroom with an AI professor, four agentic classmates (Skeptic, Builder, Creative, Examiner), a collaborative whiteboard, and adaptive quizzes. Ask questions aloud, draw diagrams, and learn at your own pace with real-time feedback.',
  },
];

export function FAQ() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuestionClick = (index: number) => {
    setSelectedIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIndex(null);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <section id="faq" className="py-24 px-6 bg-zinc-950/50">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <p className="text-violet-400 font-semibold tracking-widest uppercase mb-4 text-sm">
              FAQ
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Questions Answered
            </h2>
            <p className="text-zinc-400 text-lg">
              Click any question to learn more
            </p>
          </div>

          {/* FAQ List with click-to-expand modal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            {faqItems.map((item, index) => (
              <GlassCard
                key={index}
                className="cursor-pointer backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300"
                onClick={() => handleQuestionClick(index)}
              >
                <div className="flex items-center justify-between p-2 -m-2">
                  <span className="text-lg font-medium text-white pr-4">{item.question}</span>
                  <ChevronDown className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                </div>
              </GlassCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="backdrop-blur-xl border-white/20 shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white pr-8">
                    {faqItems[selectedIndex].question}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Answer */}
                <div className="text-zinc-300 text-lg leading-relaxed">
                  {faqItems[selectedIndex].answer}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-violet-500/50 via-violet-500/20 to-transparent mt-8 mb-6" />

                {/* Navigation hint */}
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>
                    Question {selectedIndex + 1} of {faqItems.length}
                  </span>
                  <div className="flex gap-2">
                    {selectedIndex > 0 && (
                      <button
                        onClick={() => setSelectedIndex(selectedIndex - 1)}
                        className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                      >
                        Previous
                      </button>
                    )}
                    {selectedIndex < faqItems.length - 1 && (
                      <button
                        onClick={() => setSelectedIndex(selectedIndex + 1)}
                        className="px-3 py-1 rounded-full bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 transition-colors"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}