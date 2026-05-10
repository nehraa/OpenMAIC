'use client';

import { cn } from '@/app/lib/cn';
import { motion } from 'framer-motion';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { teacherDashboardData } from '@/app/lib/demo-data';
import {
  BarChart3,
  TrendingUp,
  Users,
  AlertTriangle,
  Download,
  Send,
  FileText,
} from 'lucide-react';

export function TeacherCommandCenter() {
  const {
    className,
    totalStudents,
    averageMastery,
    masteryChange,
    studentsNeedingReview,
    misconceptions,
    engagementMetrics,
    suggestedNextLesson,
    recentActivity,
  } = teacherDashboardData;

  return (
    <section className="bg-white py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-kicker font-semibold tracking-widest text-coral uppercase mb-4">
            Teacher Command Center
          </p>
          <h2 className="font-display font-semibold text-h1 text-indigo-deep mb-4">
            See Who Understands, Who Is Stuck
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Real-time analytics and AI-generated interventions help you teach smarter, not harder.
          </p>
        </div>

        {/* Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-lg"
        >
          {/* Dashboard Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-deep flex items-center justify-center">
                <span className="text-white font-semibold">10A</span>
              </div>
              <div>
                <h3 className="font-semibold text-indigo-deep">{className}</h3>
                <p className="text-sm text-slate-500">{totalStudents} students enrolled</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondaryDark" size="sm">
                <FileText className="w-4 h-4" />
                Generate Plan
              </Button>
              <Button variant="secondaryDark" size="sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid lg:grid-cols-[300px_1fr_280px] min-h-[400px]">
            {/* Left - Roster with risk signals */}
            <div className="p-6 border-r border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Roster
              </p>
              <div className="space-y-2 max-h-[340px] overflow-y-auto">
                {[...Array(8)].map((_, i) => {
                  const names = ['Arjun Mehta', 'Sneha Patel', 'Vikram Singh', 'Anaya Sharma', 'Rohan Gupta', 'Ishaan Khan', 'Priya Reddy', 'Aditya Verma'];
                  const scores = [92, 78, 65, 88, 45, 82, 71, 95];
                  const name = names[i];
                  const score = scores[i];
                  const needsReview = score < 70;

                  return (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg text-sm',
                        needsReview ? 'bg-coral/10 border border-coral/30' : 'hover:bg-slate-100'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar initials={name.split(' ').map(n => n[0]).join('')} color="slate" size="sm" />
                        <span className="text-slate-700">{name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {needsReview && <AlertTriangle className="w-4 h-4 text-coral" />}
                        <span className={cn(
                          'font-mono text-sm',
                          needsReview ? 'text-coral font-semibold' : 'text-slate-500'
                        )}>
                          {score}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center - Mastery Graph & Timeline */}
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Class Performance
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-mono font-semibold text-indigo-deep">{averageMastery}%</span>
                  <Badge variant="success">
                    <TrendingUp className="w-3 h-3" />
                    +{masteryChange}%
                  </Badge>
                </div>
              </div>

              {/* Bar chart visualization */}
              <div className="flex items-end justify-between h-40 mb-8 px-4">
                {[65, 72, 68, 78, 75, 82, 80, 85, 88, 78, 76, 82].map((value, i) => (
                  <div key={i} className="w-6 bg-gradient-to-t from-teal to-teal-soft rounded-t-sm" style={{ height: `${value}%` }} />
                ))}
              </div>

              {/* Engagement metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Questions Asked</p>
                  <p className="text-2xl font-bold font-mono text-indigo-deep">{engagementMetrics.questionsAsked}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Speaking Time</p>
                  <p className="text-2xl font-bold font-mono text-indigo-deep">{engagementMetrics.speakingTime}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 mb-1">Quiz Confidence</p>
                  <p className="text-2xl font-bold font-mono text-indigo-deep">{engagementMetrics.quizConfidence}%</p>
                </div>
              </div>
            </div>

            {/* Right - AI Interventions */}
            <div className="p-6 border-l border-slate-200 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                AI Interventions
              </p>

              {/* Misconceptions */}
              <div className="mb-6">
                <p className="text-sm text-slate-700 font-medium mb-2">Misconception Alerts</p>
                <div className="space-y-2">
                  {misconceptions.map((m) => (
                    <div key={m.topic} className="bg-coral/10 border border-coral/30 rounded-lg p-2">
                      <p className="text-sm text-coral font-medium">{m.topic}</p>
                      <p className="text-xs text-slate-500">{m.affected} students affected</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested next lesson */}
              <div className="bg-violet/10 border border-violet/30 rounded-lg p-4">
                <p className="text-xs text-violet font-semibold mb-1">Suggested Next Lesson</p>
                <p className="text-sm text-slate-700 font-medium">{suggestedNextLesson}</p>
                <Button size="sm" variant="secondary" className="mt-2 w-full">
                  <Send className="w-4 h-4" />
                  Assign to Class
                </Button>
              </div>

              {/* Recent activity */}
              <div className="mt-6">
                <p className="text-sm text-slate-700 font-medium mb-2">Recent Activity</p>
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-slate-700">{activity.student}</p>
                      <p className="text-slate-500 text-xs">{activity.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
