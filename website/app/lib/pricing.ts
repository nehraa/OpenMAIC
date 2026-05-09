export const pricingPlans = {
  student: {
    name: 'Student',
    monthlyPrice: 100,
    annualPrice: 960,
    description: 'Accessible guided learning',
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
  individual: {
    name: 'Individual',
    monthlyPrice: 1000,
    annualPrice: 9600,
    description: 'Full solo classroom experience',
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
  },
  teacher: {
    name: 'Teacher',
    monthlyPrice: 5000,
    annualPrice: 48000,
    description: 'Classroom control, analytics, and exports',
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
  },
} as const;

export type PlanKey = keyof typeof pricingPlans;

export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}
