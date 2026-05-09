'use client';

import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';

export function FinalCTA() {
  return (
    <section className="bg-dark-hero py-24 md:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-deep via-indigo-ink to-dark-base" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display font-bold text-display text-white mb-4">
            Start with one topic.
          </h2>
          <p className="text-body-lg text-slate-300 mb-10">
            AIDU will build the classroom around it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="animate-pulse-glow">
              Create My Classroom
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
            <Button variant="secondary" size="lg">
              View Teacher Plan
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
