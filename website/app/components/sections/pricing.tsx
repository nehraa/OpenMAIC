'use client';

import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/button';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { cn } from '@/app/lib/cn';

const plans = [
  {
    name: 'Individual',
    price: 'Free',
    period: '',
    description: 'For self-paced learning.',
    features: [
      'Unlimited topics',
      'AI professor access',
      'Basic quizzes',
      'Whiteboard drawings',
    ],
    featured: false,
    accent: 'zinc',
  },
  {
    name: 'Student',
    price: '$9',
    period: '/month',
    description: 'For enrolled students who want deeper learning.',
    features: [
      'Everything in Individual',
      'Live classroom sessions',
      'Agentic classmates',
      'Progress tracking',
      'Spaced repetition',
      'Priority support',
    ],
    featured: true,
    accent: 'violet',
  },
  {
    name: 'Teacher',
    price: '$29',
    period: '/month',
    description: 'For educators managing classroom learning.',
    features: [
      'Everything in Student',
      'Class management',
      'Student analytics',
      'Custom content creation',
      'Misconception detection',
      'Parent progress reports',
    ],
    featured: false,
    accent: 'teal',
  },
];

export function Pricing() {
  return (
    <section className="py-24 px-6 bg-zinc-950/50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you need more.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <GlassCard
                variant={plan.featured ? 'featured' : 'default'}
                className={cn(
                  'h-full flex flex-col relative overflow-hidden backdrop-blur-xl',
                  'border border-white/10 transition-all duration-300',
                  plan.featured && 'ring-1 ring-violet-500/50 shadow-xl shadow-violet-500/10 -translate-y-2'
                )}
              >
                {/* Featured badge */}
                {plan.featured && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-violet-500 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl">
                    Most Popular
                  </div>
                )}

                {/* Header */}
                <div className="mb-6">
                  <h3 className={cn(
                    'font-serif text-xl font-bold mb-2',
                    plan.featured ? 'text-violet-300' : 'text-white'
                  )}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      'text-4xl font-bold',
                      plan.featured ? 'text-white' : 'text-white'
                    )}>
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-zinc-500 text-lg">{plan.period}</span>}
                  </div>
                  <p className="text-zinc-400 text-sm mt-2">{plan.description}</p>
                </div>

                {/* Divider */}
                <div className={cn(
                  'h-px bg-gradient-to-r mb-6',
                  plan.featured ? 'from-violet-500/50 via-violet-500/20 to-transparent' : 'from-white/10 via-white/5 to-transparent'
                )} />

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-zinc-300 text-sm">
                      <svg className={cn(
                        'w-5 h-5 flex-shrink-0 mt-0.5',
                        plan.featured ? 'text-violet-400' : 'text-teal-400'
                      )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={plan.featured ? 'primary' : 'secondary'}
                  className={cn(
                    'w-full',
                    plan.featured && 'bg-violet-500 hover:bg-violet-600 shadow-lg shadow-violet-500/20'
                  )}
                >
                  Get Started
                </Button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}