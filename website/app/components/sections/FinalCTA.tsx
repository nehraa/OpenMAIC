'use client';

import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { ScrollVideo } from '@/app/components/scroll-video/ScrollVideo';

export function FinalCTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Video Background */}
      <ScrollVideo
        src="/video/clips/classroom-demo.mp4"
        screenshots={['/video/screenshots/classroom.jpg']}
        className="absolute inset-0 z-0"
      />

      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/80 to-zinc-950 z-10" />

      {/* Glow effect behind button */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-[128px] z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="font-serif text-4xl md:text-6xl font-bold text-white mb-6"
        >
          Ready to Transform Your Learning?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-zinc-300 text-xl mb-10"
        >
          Join thousands of learners already experiencing the future of education.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Button size="lg" className="relative shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow">
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/50 to-teal-500/50 blur-lg opacity-50 animate-pulse" />
            <span className="relative flex items-center gap-2">
              Start Learning Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}