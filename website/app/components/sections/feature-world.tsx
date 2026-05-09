'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Brain, Users, PenTool, Mic, Box, TrendingUp, ChevronDown } from 'lucide-react';
import { featureCards } from '@/app/lib/demo-data';
import { Card, CardContent } from '@/app/components/ui/card';

const iconMap = {
  Brain,
  Users,
  PenTool,
  Mic,
  Box,
  TrendingUp,
};

const colorMap = {
  teal: 'bg-teal/20 text-teal border-teal/30',
  violet: 'bg-violet/20 text-violet border-violet/30',
  coral: 'bg-coral/20 text-coral border-coral/30',
};

export function FeatureWorld() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id="features" className="bg-dark-surface py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            Feature World
          </p>
          <h2 className="font-display font-semibold text-h1 text-white">
            Everything That Makes It Alive
          </h2>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            const isExpanded = expandedId === feature.id;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  variant={isExpanded ? 'glow' : undefined}
                  className={cn(
                    'h-full cursor-pointer transition-all duration-300 hover:scale-[1.02]',
                    isExpanded ? 'ring-1 ring-coral/50' : ''
                  )}
                >
                  <CardContent className="p-6">
                    <button
                      className="w-full text-left"
                      onClick={() => setExpandedId(isExpanded ? null : feature.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={cn(
                            'w-12 h-12 rounded-xl border flex items-center justify-center',
                            colorMap[feature.color as keyof typeof colorMap]
                          )}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <ChevronDown
                          className={cn(
                            'w-5 h-5 text-slate-400 transition-transform duration-300',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                      <h3 className="font-display font-semibold text-lg text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-400">{feature.tagline}</p>

                      {/* Expanded content */}
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-300',
                          isExpanded ? 'max-h-96 mt-4' : 'max-h-0'
                        )}
                      >
                        <p className="text-slate-300 text-sm leading-relaxed pb-4">
                          {feature.description}
                        </p>
                        <a
                          href="#"
                          className="text-coral text-sm hover:underline inline-flex items-center gap-1"
                        >
                          See example
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      </div>
                    </button>
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
