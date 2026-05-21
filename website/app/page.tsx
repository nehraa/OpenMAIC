import { Hero } from './components/sections/Hero';
import { Features } from './components/sections/Features';
import { HowItWorks } from './components/sections/HowItWorks';
import { Pricing } from './components/sections/Pricing';
import { FinalCTA } from './components/sections/FinalCTA';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
    </main>
  );
}