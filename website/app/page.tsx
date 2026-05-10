'use client';

import { Navbar } from '@/app/components/sections/navbar';
import { Hero } from '@/app/components/sections/hero';
import { SocialProof } from '@/app/components/sections/social-proof';
import { HowItWorks } from '@/app/components/sections/how-it-works';
import { FeatureWorld } from '@/app/components/sections/feature-world';
import { ClassroomPreview } from '@/app/components/sections/classroom-preview';
import { Pricing } from '@/app/components/sections/pricing';
import { TeacherCommandCenter } from '@/app/components/sections/teacher-command-center';
import { Outcomes } from '@/app/components/sections/outcomes';
import { FAQ } from '@/app/components/sections/faq';
import { FinalCTA } from '@/app/components/sections/final-cta';
import { Footer } from '@/app/components/sections/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-dark-base">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <FeatureWorld />
      <ClassroomPreview />
      <Pricing />
      <TeacherCommandCenter />
      <Outcomes />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}