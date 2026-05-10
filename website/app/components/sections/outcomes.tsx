'use client';

import { motion } from 'framer-motion';
import { Zap, MessageCircle, Brain, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';
import { outcomesData } from '@/app/lib/demo-data';

const iconMap = {
  Zap,
  MessageCircle,
  Brain,
  GraduationCap,
};

export function Outcomes() {
  return (
    <section className="bg-dark-surface py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            Outcomes
          </p>
          <h2 className="font-display font-semibold text-h1 text-white">
            Learning that becomes measurable.
          </h2>
        </div>

        {/* Outcome Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {outcomesData.map((outcome, index) => {
            const Icon = iconMap[outcome.icon as keyof typeof iconMap];
            return (
              <motion.div
                key={outcome.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full bg-dark-card/50 border-teal/20 hover:border-teal/40 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-teal" />
                    </div>
                    <h3 className="font-display font-semibold text-lg text-white mb-2">
                      {outcome.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {outcome.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
