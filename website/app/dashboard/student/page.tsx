'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { studentDashboards, students, type StudentDashboard } from '@/app/lib/mock-data';
import { BookOpen, Clock, Brain, Target, AlertTriangle, TrendingUp, CheckCircle, Circle, Lightbulb, Eye, Ear, Book, Hand, Sparkles, GraduationCap, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

function LearningStyleIcon({ style }: { style: string }) {
  switch (style) {
    case 'visual':
      return <Eye className="w-4 h-4" />;
    case 'auditory':
      return <Ear className="w-4 h-4" />;
    case 'reading':
      return <Book className="w-4 h-4" />;
    case 'kinesthetic':
      return <Hand className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
}

function LearningStyleBadge({ style }: { style: string }) {
  const labels = {
    visual: 'Visual',
    auditory: 'Auditory',
    reading: 'Reading',
    kinesthetic: 'Kinesthetic',
  };
  const colors = {
    visual: 'bg-violet/20 text-violet',
    auditory: 'bg-coral/20 text-coral',
    reading: 'bg-teal/20 text-teal',
    kinesthetic: 'bg-warning/20 text-warning',
  };
  return (
    <Badge className={colors[style as keyof typeof colors]}>
      <LearningStyleIcon style={style} />
      <span className="ml-1">{labels[style as keyof typeof labels]}</span>
    </Badge>
  );
}

export default function StudentDashboard() {
  const [activeStudentId, setActiveStudentId] = useState('student-001');
  const dashboard = studentDashboards[activeStudentId];
  const student = dashboard;

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
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const ids = Object.keys(studentDashboards);
                  const currentIdx = ids.indexOf(activeStudentId);
                  const prevIdx = (currentIdx - 1 + ids.length) % ids.length;
                  setActiveStudentId(ids[prevIdx]);
                }}
                className="p-2 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
              </button>
              <span className="text-sm text-slate-400">Student {Object.keys(studentDashboards).indexOf(activeStudentId) + 1}/10</span>
              <button
                onClick={() => {
                  const ids = Object.keys(studentDashboards);
                  const currentIdx = ids.indexOf(activeStudentId);
                  const nextIdx = (currentIdx + 1) % ids.length;
                  setActiveStudentId(ids[nextIdx]);
                }}
                className="p-2 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Avatar initials={student.student.avatar} color={student.student.color} size="md" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-display font-bold text-white">Welcome back, {student.student.name.split(' ')[0]}</h1>
            {student.student.learningStyle && (
              <LearningStyleBadge style={student.student.learningStyle.learningStyle} />
            )}
          </div>
          <p className="text-slate-400">{student.student.class} {student.student.section} | Roll #{student.student.rollNumber}</p>
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
                  <h3 className="font-semibold text-white">{student.currentLesson.lessonName}</h3>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{student.currentLesson.completedPercentage}% complete</span>
                  <span className="text-slate-400">{student.currentLesson.timeSpent}</span>
                </div>
                <div className="h-2 bg-dark-surface rounded-full overflow-hidden">
                  <div className="h-full bg-coral rounded-full" style={{ width: `${student.currentLesson.completedPercentage}%` }} />
                </div>
              </div>
              <Button>Continue Lesson</Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Overall Mastery</span>
                  <span className="text-xl font-bold text-teal">{student.overallMastery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Streak</span>
                  <span className="text-xl font-bold text-coral">{student.streakDays} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Questions Asked</span>
                  <span className="text-xl font-bold text-violet">{student.engagement.questionsAsked}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Style & Teaching Guidance */}
        {student.student.learningStyle && (
          <Card className="mb-8 border-violet/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet" />
                <CardTitle>Your Learning Style</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-dark-surface text-center">
                  <LearningStyleIcon style={student.student.learningStyle.learningStyle} />
                  <p className="text-sm text-slate-400 mt-1">Style</p>
                  <p className="text-white font-medium capitalize">{student.student.learningStyle.learningStyle}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-surface text-center">
                  <GraduationCap className="w-4 h-4 mx-auto text-teal" />
                  <p className="text-sm text-slate-400 mt-1">Explanation</p>
                  <p className="text-white font-medium capitalize">{student.student.learningStyle.preferredExplanationStyle}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-surface text-center">
                  <Clock className="w-4 h-4 mx-auto text-coral" />
                  <p className="text-sm text-slate-400 mt-1">Attention</p>
                  <p className="text-white font-medium capitalize">{student.student.learningStyle.attentionSpan}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-surface text-center">
                  <Sparkles className="w-4 h-4 mx-auto text-violet" />
                  <p className="text-sm text-slate-400 mt-1">Motivation</p>
                  <p className="text-white font-medium capitalize">{student.student.learningStyle.motivationStyle}</p>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Personality Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {student.student.learningStyle.personalityTraits.map((trait, i) => (
                    <Badge key={i} variant="default">{trait}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teaching Guidance */}
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
              <p className="text-white text-sm">{student.teachingGuidance.recommendedApproach}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2">Preferred Content Types</h4>
              <div className="flex flex-wrap gap-2">
                {student.teachingGuidance.preferredContentTypes.map((type, i) => (
                  <Badge key={i} variant="violet">{type}</Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">Engagement Strategies</h4>
              <ul className="space-y-1">
                {student.teachingGuidance.engagementStrategies.map((strategy, i) => (
                  <li key={i} className="text-sm text-white flex items-start gap-2">
                    <Lightbulb className="w-3 h-3 text-violet mt-0.5 shrink-0" />
                    {strategy}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-1">Pacing Recommendations</h4>
              <p className="text-sm text-white">{student.teachingGuidance.pacingRecommendations}</p>
            </div>
          </CardContent>
        </Card>

        {/* Mastery Levels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.masteryLevels.map((level) => (
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
              ))}
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
              {student.misconceptions.map((m) => (
                <div key={m.id} className="p-4 bg-dark-surface rounded-xl">
                  <h4 className="font-medium text-white mb-1">{m.topic}</h4>
                  <p className="text-sm text-slate-400 mb-2">{m.description}</p>
                  <Badge variant="warning">{m.questionsWrong} questions wrong</Badge>
                </div>
              ))}
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
              {student.recentQuizzes.map((quiz) => (
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
              ))}
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
              {student.assignedHomework.map((hw) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
