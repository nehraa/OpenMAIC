import Link from 'next/link';
import { Zap, Brain, Users, PenTool, Mic, Box, TrendingUp } from 'lucide-react';

const features = [
  { id: 'socratic', title: 'Socratic Engine', icon: Brain },
  { id: 'classmates', title: 'Agentic Classmates', icon: Users },
  { id: 'whiteboard', title: 'Generative Whiteboard', icon: PenTool },
  { id: 'voice', title: 'Spatial Voice Q&A', icon: Mic },
  { id: 'simulations', title: '3D Simulations', icon: Box },
  { id: 'progression', title: 'Shine Progression', icon: TrendingUp },
];

const expandedContent: Record<string, { tagline: string; description: string }> = {
  socratic: {
    tagline: 'Probes assumptions, challenges weak reasoning',
    description: 'The AI professor asks follow-up questions that expose gaps in understanding. It adapts difficulty in real-time, ensuring every learner is challenged at their edge.',
  },
  classmates: {
    tagline: 'Four persona agents debate around any concept',
    description: 'Skeptic questions claims. Builder constructs understanding. Creative offers analogies. Examiner tests readiness. Together they create authentic classroom dynamics.',
  },
  whiteboard: {
    tagline: 'Ink blooms into diagrams and equations',
    description: 'WebGL-powered drawing that transforms rough sketches into polished diagrams. Equations render beautifully. Every stroke is replayable and exportable.',
  },
  voice: {
    tagline: 'Audio rings pan between avatars naturally',
    description: 'Web Audio positioning creates spatial presence. Ask questions aloud and hear responses from the appropriate voice in the classroom.',
  },
  simulations: {
    tagline: 'Isometric scenes generated per topic',
    description: 'Biology cells, math graphs, physics fields, chemistry molecules — all interactive and generated contextual to your lesson.',
  },
  progression: {
    tagline: 'Mastery grows, streaks build, knowledge compounds',
    description: 'A skill graph that tracks understanding over time. Spaced repetition schedules review. Targeted practice closes gaps before exams.',
  },
};

export function FeatureWorld() {
  return (
    <section id="product" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-coral text-sm font-semibold uppercase tracking-wider mb-3">Features</p>
          <h2 className="font-display text-h2 font-bold text-white">Everything you need to master any topic</h2>
          <p className="text-slate-400 text-body-lg mt-4 max-w-2xl mx-auto">
            Six interconnected engines work together to create the most complete AI learning experience available.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            const content = expandedContent[feature.id];
            return (
              <div
                key={feature.id}
                className="group relative bg-dark-card border border-dark-line rounded-2xl p-6 hover:border-coral/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-coral flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-coral transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">{content.tagline}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-dark-line">
                  <p className="text-sm text-slate-300 leading-relaxed">{content.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
