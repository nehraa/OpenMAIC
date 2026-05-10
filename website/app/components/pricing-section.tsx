'use client';

import { cn } from '@/app/lib/cn';

interface PricingCardProps {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limitations?: string;
  cta: string;
  isAnnual: boolean;
  recommended?: boolean;
  variant?: 'default' | 'glow' | 'teal' | 'violet';
}

export function PricingCard({
  name,
  description,
  monthlyPrice,
  annualPrice,
  features,
  limitations,
  cta,
  isAnnual,
  recommended,
  variant = 'default',
}: PricingCardProps) {
  const price = isAnnual ? annualPrice : monthlyPrice;
  const formattedPrice = `₹${price.toLocaleString('en-IN')}`;
  const period = isAnnual ? '/year' : '/month';

  const borderClass = {
    default: 'border-dark-line',
    glow: 'border-coral/30',
    teal: 'border-teal/30',
    violet: 'border-violet/30',
  }[variant];

  const glowClass = {
    default: '',
    glow: 'shadow-glow-coral',
    teal: 'shadow-glow-teal',
    violet: 'shadow-glow-violet',
  }[variant];

  return (
    <div
      className={cn(
        'relative bg-dark-card border rounded-2xl p-6 lg:p-8 flex flex-col',
        borderClass,
        glowClass
      )}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 text-xs font-semibold bg-coral text-white rounded-full">
            Recommended
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-display font-semibold text-xl text-white mb-1">{name}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="font-display font-bold text-4xl text-white">{formattedPrice}</span>
          <span className="text-slate-400 text-sm">{period}</span>
        </div>
        {isAnnual && (
          <p className="text-xs text-teal mt-1">Save 20% with annual</p>
        )}
      </div>

      <ul className="space-y-3 mb-6 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-teal flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>

      {limitations && (
        <p className="text-xs text-slate-500 mb-4">{limitations}</p>
      )}

      <button
        className={cn(
          'w-full py-3 px-4 text-sm font-medium rounded-[10px] transition-all duration-200',
          recommended
            ? 'bg-coral text-white hover:bg-coral-strong hover:-translate-y-0.5 hover:shadow-glow-coral'
            : 'bg-dark-surface border border-dark-line text-white hover:bg-white/5 hover:border-white/20'
        )}
      >
        {cta}
      </button>
    </div>
  );
}

interface PricingSectionProps {
  isAnnual: boolean;
}

export function Pricing({ isAnnual }: PricingSectionProps) {
  const plans = [
    {
      name: 'Student',
      description: 'Accessible guided learning',
      monthlyPrice: 100,
      annualPrice: 960,
      features: [
        'AI tutor for any topic',
        'Basic quizzes and practice',
        'Progress tracking',
        'Topic history',
        'Mobile access',
      ],
      limitations: 'Up to 5 topics per week',
      cta: 'Start Student',
    },
    {
      name: 'Individual',
      description: 'Full solo classroom experience',
      monthlyPrice: 1000,
      annualPrice: 9600,
      features: [
        'Complete AI classroom',
        'Voice Q&A with AI professor',
        '3D visual simulations',
        'Deep mastery graph',
        'Unlimited topics',
        'Priority support',
      ],
      limitations: '1 user, personal use',
      cta: 'Start Learning',
      variant: 'teal' as const,
    },
    {
      name: 'Teacher',
      description: 'Classroom control, analytics, and exports',
      monthlyPrice: 5000,
      annualPrice: 48000,
      features: [
        'Full classroom management',
        'Student roster and analytics',
        'Assignment creation and tracking',
        'Misconception detection',
        'Intervention plans',
        'PDF/CSV/ZIP exports',
        'LMS integration',
        'Dedicated support',
      ],
      limitations: 'Up to 200 students',
      cta: 'Start Teaching',
      recommended: true,
      variant: 'glow' as const,
    },
  ];

  return (
    <section id="pricing" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="font-display text-h2 font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-body-lg max-w-2xl mx-auto">
            Choose the plan that fits your learning style. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              isAnnual={isAnnual}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
