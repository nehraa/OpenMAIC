'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/app/components/ui/GlassCard';

const steps = [
  {
    number: '01',
    title: 'Choose Your Topic',
    description: 'Enter any subject, from quantum physics to creative writing.',
  },
  {
    number: '02',
    title: 'AI Generates Your Lesson',
    description: 'Our multi-agent system creates a personalized classroom experience.',
  },
  {
    number: '03',
    title: 'Learn Interactively',
    description: 'Engage with AI professor, debate with classmates, and practice with quizzes.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-zinc-900/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Three steps to start learning with AI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <GlassCard className="h-full text-center">
                <div className="text-orange-500 font-mono text-5xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="font-serif text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {step.description}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}