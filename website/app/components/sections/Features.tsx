'use client';

import { motion } from 'framer-motion';
import { ScrollVideo } from '@/app/components/scroll-video/ScrollVideo';
import { GlassCard } from '@/app/components/ui/GlassCard';

const features = [
  {
    title: 'Interactive Whiteboard',
    description: 'Draw, diagram, and visualize concepts in real-time with AI-assisted sketching.',
    video: '/video/clips/whiteboard-demo.mp4',
    screenshot: '/video/screenshots/whiteboard.jpg',
    align: 'left',
  },
  {
    title: 'AI Debating Classmates',
    description: 'Learn through Socratic dialogue with AI agents who challenge your assumptions.',
    video: '/video/clips/agent-demo.mp4',
    screenshot: '/video/screenshots/agents.jpg',
    align: 'right',
  },
  {
    title: 'Adaptive Quizzes',
    description: 'Test your understanding with AI-generated questions that adapt to your level.',
    video: '/video/clips/quiz-demo.mp4',
    screenshot: '/video/screenshots/quiz.jpg',
    align: 'left',
  },
  {
    title: 'Full Classroom Simulation',
    description: 'Experience a complete lesson with professor, classmates, and collaborative learning.',
    video: '/video/clips/classroom-demo.mp4',
    screenshot: '/video/screenshots/classroom.jpg',
    align: 'right',
  },
];

export function Features() {
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
            Features That Transform Learning
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Every element designed for maximum engagement and understanding.
          </p>
        </motion.div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col ${feature.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}
            >
              <div className="flex-1">
                <ScrollVideo
                  src={feature.video}
                  screenshots={[feature.screenshot]}
                  className="rounded-2xl overflow-hidden shadow-2xl"
                />
              </div>
              <div className="flex-1">
                <GlassCard className="h-full flex flex-col justify-center">
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-lg leading-relaxed">
                    {feature.description}
                  </p>
                </GlassCard>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}