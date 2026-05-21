'use client';

import { motion } from 'framer-motion';
import { Button } from '@/app/components/ui/Button';
import { GlassCard } from '@/app/components/ui/GlassCard';

const plans = [
  {
    name: 'Individual',
    price: 'Free',
    description: 'For self-paced learning.',
    features: ['Unlimited topics', 'AI professor access', 'Basic quizzes'],
    featured: false,
  },
  {
    name: 'Student',
    price: '$9',
    period: '/month',
    description: 'For enrolled students.',
    features: ['Everything in Individual', 'Classroom sessions', 'Progress tracking', 'Priority support'],
    featured: true,
  },
  {
    name: 'Teacher',
    price: '$29',
    period: '/month',
    description: 'For educators.',
    features: ['Everything in Student', 'Class management', 'Custom content', 'Analytics dashboard'],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 px-6 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            Simple Pricing
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Start free, upgrade when you need more.
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
              <GlassCard variant={plan.featured ? 'featured' : 'default'} className="h-full flex flex-col">
                {plan.featured && (
                  <span className="inline-block px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-full mb-4 w-fit">
                    Most Popular
                  </span>
                )}
                <h3 className="font-serif text-xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-zinc-500">{plan.period}</span>}
                </div>
                <p className="text-zinc-400 text-sm mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-zinc-300">
                      <svg className="w-5 h-5 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={plan.featured ? 'primary' : 'secondary'} className="w-full">
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