'use client';

import { motion } from 'framer-motion';
import { Accordion } from '@/app/components/ui/accordion';
import { faqData } from '@/app/lib/demo-data';

export function FAQ() {
  return (
    <section id="faq" className="bg-white py-24 md:py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            FAQ
          </p>
          <h2 className="font-display font-semibold text-h1 text-indigo-deep mb-4">
            Questions Answered
          </h2>
        </div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Accordion items={faqData} />
        </motion.div>
      </div>
    </section>
  );
}
