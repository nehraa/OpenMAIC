'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { Search, Users, MessageCircle } from 'lucide-react';
import { howItWorksSteps } from '@/app/lib/demo-data';

const stepIcons = [Search, Users, MessageCircle];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-slate-50 to-white py-24 md:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            How It Works
          </p>
          <h2 className="font-display font-semibold text-h1 text-indigo-deep">
            Topic to Classroom in 3 Steps
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector Line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-coral via-violet to-teal" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {howItWorksSteps.map((step, index) => {
              const Icon = stepIcons[index];
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className="relative text-center"
                >
                  {/* Step number circle */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-coral text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-indigo-deep" />
                  </div>

                  {/* Content */}
                  <h3 className="font-display font-semibold text-xl text-indigo-deep mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
