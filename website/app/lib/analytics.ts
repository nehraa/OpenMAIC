export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    console.log(`[Analytics] ${eventName}`, properties);
  }
}

export const analyticsEvents = {
  heroCTAClicked: () => trackEvent('hero_cta_clicked'),
  demoPlayClicked: () => trackEvent('demo_play_clicked'),
  topicExampleClicked: (topic: string) => trackEvent('topic_example_clicked', { topic }),
  featureCardExpanded: (featureId: string) => trackEvent('feature_card_expanded', { featureId }),
  pricingToggleChanged: (isAnnual: boolean) => trackEvent('pricing_toggle_changed', { isAnnual }),
  pricingCTAClicked: (plan: string) => trackEvent('pricing_cta_clicked', { plan }),
  teacherDemoClicked: () => trackEvent('teacher_demo_clicked'),
  faqOpened: (questionIndex: number) => trackEvent('faq_opened', { questionIndex }),
  leadFormSubmitted: () => trackEvent('lead_form_submitted'),
} as const;
