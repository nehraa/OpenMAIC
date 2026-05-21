'use client';

import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import Image from 'next/image';

export function FinalCTA() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Molecule GIF Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/80 to-zinc-950 z-10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-[600px] h-[600px] opacity-20 animate-spin-slow"
            style={{ animationDuration: '60s' }}
          >
            <Image
              src="/images/3D_interactive.gif"
              alt=""
              width={600}
              height={600}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[128px] z-10" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-coral-500/20 rounded-full blur-[128px] z-10" />

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
          <Button
            size="lg"
            className="relative shadow-2xl shadow-coral-500/30 hover:shadow-coral-500/50 transition-shadow overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-coral-500/50 to-violet-500/50 blur-lg animate-pulse" />
            <span className="absolute inset-0 bg-gradient-to-r from-coral-500 to-violet-500" />
            <span className="relative flex items-center gap-2 text-white font-semibold">
              Start Learning Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Button>
        </motion.div>
      </div>

      {/* CSS for slow rotation animation */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 60s linear infinite;
        }
      `}</style>
    </section>
  );
}