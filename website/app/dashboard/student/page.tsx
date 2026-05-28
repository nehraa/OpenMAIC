'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { BookOpen, Clock, Brain, AlertTriangle, Lightbulb, Sparkles, GraduationCap, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

interface StudentInfo {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: 'teal' | 'violet' | 'coral' | 'info' | 'slate';
  class: string;
  section: string;
  rollNumber: number;
  learningStyle: null;
}

interface CurrentLesson {
  lessonId: string;
  lessonName: string;
  completedPercentage: number;
  timeSpent: string;
}

interface Homework {
  homeworkId: string;
  title: string;
  dueDate: string;
  estimatedTime: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface Quiz {
  quizId: string;
  quizName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback: string;
  date: string;
}

interface Misconception {
  id: string;
  topic: string;
  description: string;
  questionsWrong: number;
  firstNoticed: string;
}

interface TeachingGuidance {
  recommendedApproach: string;
  preferredContentTypes: string[];
  engagementStrategies: string[];
  pacingRecommendations: string;
}

interface DashboardData {
  student: StudentInfo | null;
  currentLesson: CurrentLesson | null;
  assignedHomework: Homework[];
  recentQuizzes: Quiz[];
  overallMastery: number;
  streakDays: number;
  masteryLevels: Array<{ topicId: string; topicName: string; masteryPercentage: number }>;
  misconceptions: Misconception[];
  teachingGuidance: TeachingGuidance | null;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-coral"></div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <AlertTriangle className="w-12 h-12 text-warning mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">Unable to load dashboard</h2>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <GraduationCap className="w-12 h-12 text-slate-500 mb-4" />
      <h2 className="text-xl font-semibold text-white mb-2">No Class Enrollment</h2>
      <p className="text-slate-400">You are not enrolled in any class yet. Please contact your teacher.</p>
    </div>
  );
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard/student', {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your dashboard.');
          } else if (response.status === 404) {
            setError('Dashboard not found.');
          } else {
            setError('Failed to load dashboard. Please try again.');
          }
          return;
        }

        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error?.code || 'Failed to load dashboard.');
        }
      } catch {
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base">
        <header className="border-b border-dark-line bg-dark-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-violet flex items-center justify-center">
                <span className="font-display font-bold text-white">A</span>
              </div>
              <span className="font-display font-bold text-xl text-white">AIDU</span>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <LoadingSpinner />
        </main>
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="min-h-screen bg-dark-base">
        <header className="border-b border-dark-line bg-dark-surface">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-violet flex items-center justify-center">
                <span className="font-display font-bold text-white">A</span>
              </div>
              <span className="font-display font-bold text-xl text-white">AIDU</span>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <EmptyState />
        </main>
      </div>
    );
  }

  const { student, currentLesson, assignedHomework, recentQuizzes, overallMastery, streakDays, masteryLevels, misconceptions, teachingGuidance } = data;

  return (
    <div className="min-h-screen bg-dark-base">
      {/* Header */}
      <header className="border-b border-dark-line bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-violet flex items-center justify-center">
                <span className="font-display font-bold text-white">A</span>
              </div>
              <span className="font-display font-bold text-xl text-white">AIDU</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Avatar initials={student.avatar} color={student.color} size="md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-white">Welcome back, {student.name.split(' ')[0]}</h1>
          </div>
          <p className="text-slate-400">{student.class} {student.section} | Roll #{student.rollNumber}</p>
        </div>

        {/* Current Lesson */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-xl bg-coral/20">
                  <BookOpen className="w-6 h-6 text-coral" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current Lesson</p>
                  <h3 className="font-semibold text-white">{currentLesson?.lessonName || 'No active lesson'}</h3>
                </div>
              </div>
              {currentLesson && (
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">{currentLesson.completedPercentage}% complete</span>
                    <span className="text-slate-400">{currentLesson.timeSpent}</span>
                  </div>
                  <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                    <div className="h-full bg-coral rounded-full" style={{ width: `${currentLesson.completedPercentage}%` }} />
                  </div>
                </div>
              )}
              <Button>Continue Lesson</Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Overall Mastery</span>
                  <span className="text-xl font-bold text-teal">{overallMastery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Streak</span>
                  <span className="text-xl font-bold text-coral">{streakDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Questions Asked</span>
                  <span className="text-xl font-bold text-violet">{misconceptions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teaching Guidance */}
        {teachingGuidance && (
          <Card className="mb-8 border-violet/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet" />
                <CardTitle>AI Teaching Guidance</CardTitle>
              </div>
              <CardDescription>Personalized recommendations based on your learning profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Recommended Approach</h4>
                <p className="text-white text-sm">{teachingGuidance.recommendedApproach}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Preferred Content Types</h4>
                <div className="flex flex-wrap gap-2">
                  {teachingGuidance.preferredContentTypes.map((type, i) => (
                    <Badge key={i} variant="violet">{type}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Engagement Strategies</h4>
                <ul className="space-y-1">
                  {teachingGuidance.engagementStrategies.map((strategy, i) => (
                    <li key={i} className="text-sm text-white flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 text-violet mt-0.5 shrink-0" />
                      {strategy}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Pacing Recommendations</h4>
                <p className="text-sm text-white">{teachingGuidance.pacingRecommendations}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mastery Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {masteryLevels.length > 0 ? (
                masteryLevels.map((level) => (
                  <div key={level.topicId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">{level.topicName}</span>
                      <span className={level.masteryPercentage >= 80 ? 'text-teal' : level.masteryPercentage >= 60 ? 'text-coral' : 'text-warning'}>
                        {level.masteryPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${level.masteryPercentage >= 80 ? 'bg-teal' : level.masteryPercentage >= 60 ? 'bg-coral' : 'bg-warning'}`}
                        style={{ width: `${level.masteryPercentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No mastery data available yet. Complete some quizzes to see your progress!</p>
              )}
            </CardContent>
          </Card>

          {/* Misconceptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <CardTitle>Areas to Improve</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {misconceptions.length > 0 ? (
                misconceptions.map((m) => (
                  <div key={m.id} className="p-4 bg-dark-surface rounded-xl">
                    <h4 className="font-medium text-white mb-1">{m.topic}</h4>
                    <p className="text-sm text-slate-400 mb-2">{m.description}</p>
                    <Badge variant="warning">{m.questionsWrong} questions wrong</Badge>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No misconceptions recorded yet. Keep learning!</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Quizzes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuizzes.length > 0 ? (
                recentQuizzes.map((quiz) => (
                  <div key={quiz.quizId} className="flex items-center justify-between p-4 bg-dark-surface rounded-xl">
                    <div>
                      <h4 className="font-medium text-white">{quiz.quizName}</h4>
                      <p className="text-sm text-slate-400">{quiz.feedback}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${quiz.percentage >= 80 ? 'text-teal' : 'text-coral'}`}>
                        {quiz.score}/{quiz.totalQuestions}
                      </div>
                      <div className="text-xs text-slate-400">{quiz.date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No quizzes completed yet. Start a lesson to see your quiz history!</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Homework */}
        <Card>
          <CardHeader>
            <CardTitle>Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignedHomework.length > 0 ? (
                assignedHomework.map((hw) => (
                  <div key={hw.homeworkId} className="flex items-center gap-4 p-4 bg-dark-surface rounded-xl">
                    {hw.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-teal" />
                    ) : hw.status === 'in-progress' ? (
                      <Circle className="w-5 h-5 text-coral" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{hw.title}</h4>
                      <p className="text-sm text-slate-400">Due: {hw.dueDate} - {hw.estimatedTime}</p>
                    </div>
                    <Badge variant={hw.status === 'completed' ? 'teal' : hw.status === 'in-progress' ? 'coral' : 'default'}>
                      {hw.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm">No homework assigned yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}