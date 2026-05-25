'use client';

import { motion } from 'framer-motion';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { howItWorksSteps } from '@/app/lib/demo-data';

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
          {howItWorksSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <GlassCard className="h-full text-center group hover:border-teal-500/30">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-teal-500/20 text-orange-500 mb-6 group-hover:scale-110 transition-transform">
                  <span className="font-mono text-3xl font-bold">{String(step.number).padStart(2, '0')}</span>
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