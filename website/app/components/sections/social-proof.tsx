'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { mockMetrics } from '@/app/lib/demo-data';

const metrics = [
  { value: mockMetrics.lessonCompletion, label: 'lesson completion' },
  { value: mockMetrics.engagementIncrease, label: 'more questions asked' },
  { value: mockMetrics.languagesSupported, label: 'languages supported' },
  { value: mockMetrics.responseTime, label: 'realtime interactions' },
];

export function SocialProof() {
  return (
    <section className="bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust line */}
        <p className="text-center text-slate-500 text-sm mb-8">
          Trusted by ambitious learners, teachers, and schools building better study systems.
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-bold text-indigo-deep font-mono">
                {metric.value}
              </p>
              <p className="text-slate-500 text-sm mt-1">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-12 h-px bg-slate-200" />

        {/* Institution placeholders */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-40">
          {['Delhi Public School', 'IIT Coaching', 'St. Xavier\'s', 'National Public School', 'Ryan International'].map(
            (name) => (
              <div
                key={name}
                className="h-8 w-32 bg-slate-300 rounded"
                aria-label={name}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}
