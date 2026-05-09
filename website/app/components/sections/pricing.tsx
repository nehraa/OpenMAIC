'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { PricingToggle } from '@/app/components/ui/pricing-toggle';
import { pricingPlans, formatPrice, type PlanKey } from '@/app/lib/pricing';

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="bg-slate-50 py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            Pricing
          </p>
          <h2 className="font-display font-semibold text-h1 text-indigo-deep mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Choose the plan that fits your learning goals. All plans include our core AI classroom experience.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {(Object.keys(pricingPlans) as PlanKey[]).map((key, index) => {
            const plan = pricingPlans[key];
            const price = isAnnual ? plan.annualPrice / 12 : plan.monthlyPrice;

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  variant={'recommended' in plan && plan.recommended ? 'glow' : 'card'}
                  className={cn(
                    'relative h-full',
                    'recommended' in plan && plan.recommended && 'ring-2 ring-coral/50'
                  )}
                >
                  {'recommended' in plan && plan.recommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-coral text-white text-xs font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Recommended
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-indigo-deep font-mono">
                        {formatPrice(Math.round(price))}
                      </span>
                      <span className="text-slate-500 text-sm">/month</span>
                      {isAnnual && (
                        <p className="text-xs text-teal mt-1">
                          Billed annually • Save {Math.round((1 - plan.annualPrice / (plan.monthlyPrice * 12)) * 100)}%
                        </p>
                      )}
                    </div>

                    <Button
                      className="w-full mb-6"
                      variant={'recommended' in plan && plan.recommended ? 'primary' : 'secondaryDark'}
                    >
                      {plan.cta}
                    </Button>

                    <div className="space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-slate-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-slate-500 border-t border-slate-200 pt-4">
                    {plan.limitations}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional info */}
        <p className="text-center text-sm text-slate-500 mt-8">
          All prices in INR. Cancel anytime. Questions?{' '}
          <a href="#faq" className="text-coral hover:underline">
            See FAQ
          </a>
        </p>
      </div>
    </section>
  );
}
