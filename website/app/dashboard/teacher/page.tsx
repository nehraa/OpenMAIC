'use client';

import { useState, useEffect } from 'react';
import { Avatar } from '@/app/components/ui/avatar';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightbulb, Eye, Ear, Book, Hand, Sparkles, AlertTriangle } from 'lucide-react';

function LearningStyleIcon({ style }: { style: string }) {
  switch (style) {
    case 'visual':
      return <Eye className="w-3 h-3" />;
    case 'auditory':
      return <Ear className="w-3 h-3" />;
    case 'reading':
      return <Book className="w-3 h-3" />;
    case 'kinesthetic':
      return <Hand className="w-3 h-3" />;
    default:
      return null;
  }
}

function LearningStyleBadge({ style }: { style: string }) {
  const colors = {
    visual: 'bg-violet/20 text-violet',
    auditory: 'bg-coral/20 text-coral',
    reading: 'bg-teal/20 text-teal',
    kinesthetic: 'bg-warning/20 text-warning',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${colors[style as keyof typeof colors]}`}>
      <LearningStyleIcon style={style} />
      <span className="capitalize">{style}</span>
    </span>
  );
}

function AtRiskTeachingTips({
  student,
  riskLevel,
}: {
  student: { id: string; name: string; avatar: string; color: 'teal' | 'violet' | 'coral' | 'info' | 'slate' };
  riskLevel: 'high' | 'medium' | 'low';
}) {
  return (
    <div className="p-4 rounded-xl bg-dark-surface border border-dark-line mb-4">
      <div className="flex items-center gap-3 mb-3">
        <Avatar initials={student.avatar} color={student.color} size="sm" />
        <div className="flex-1">
          <p className="font-medium text-white text-sm">{student.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={riskLevel === 'high' ? 'warning' : riskLevel === 'medium' ? 'coral' : 'teal'}>
              {riskLevel} risk
            </Badge>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Suggested Intervention</p>
          <p className="text-sm text-slate-300">Schedule one-on-one session</p>
        </div>
      </div>
    </div>
  );
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard/teacher', icon: 'grid' },
  { label: 'Assignments', href: '/dashboard/teacher/assignments', icon: 'clipboard' },
  { label: 'Join Class', href: '/dashboard/student/class-join', icon: 'users' },
];

interface TeacherDashboardData {
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  classOverview: {
    totalStudents: number;
    activeToday: number;
    averageMastery: number;
    masteryChange: number;
  };
  students: Array<{
    id: string;
    name: string;
    email: string;
    avatar: string;
    color: 'teal' | 'violet' | 'coral' | 'info' | 'slate';
    class: string;
    section: string;
    rollNumber: number;
    mastery: number;
  }>;
  atRiskStudents: Array<{
    student: { id: string; name: string; avatar: string; color: 'teal' | 'violet' | 'coral' | 'info' | 'slate' };
    riskLevel: 'high' | 'medium' | 'low';
    reasons: string[];
    suggestedIntervention: string;
  }>;
  misconceptionClusters: Array<{
    topic: string;
    affectedStudents: number;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
}

export default function TeacherDashboard() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch('/api/dashboard/teacher', {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error?.code || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-dark-base flex items-center justify-center">
        <div className="text-coral">Error: {error || 'Failed to load dashboard'}</div>
      </div>
    );
  }

  const teacherName = data.teacher.name.split(' ')[0] || 'Teacher';
  const highRiskCount = data.atRiskStudents.filter(s => s.riskLevel === 'high').length;

  return (
    <div className="min-h-screen bg-dark-base flex">
      {/* Sidebar */}
      <aside className={`bg-dark-card border-r border-dark-line p-4 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-violet flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-white">A</span>
            </div>
            {sidebarOpen && <span className="font-display font-bold text-xl text-white">AIDU</span>}
          </Link>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-coral/20 text-coral border border-coral/30'
                    : 'text-slate-400 hover:text-white hover:bg-dark-surface'
                }`}
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
          <Link
            href="/dashboard/teacher/assignments/create"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-coral/20 text-coral border border-coral/30"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {sidebarOpen && <span className="font-medium">New Lesson</span>}
          </Link>
        </nav>

        <div className="mt-auto pt-8">
          <Button variant="ghost" className="w-full justify-start text-slate-400">
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {sidebarOpen && 'Settings'}
          </Button>
          <div className="mt-4 pt-4 border-t border-dark-line">
            <div className="flex items-center gap-3 px-4">
              <Avatar initials={data.teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)} color="coral" size="sm" />
              {sidebarOpen && (
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{data.teacher.name}</p>
                  <p className="text-xs text-slate-500">{data.teacher.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Good morning, {teacherName}</h1>
            <p className="text-slate-400">{data.students[0]?.class || 'Class'} {data.students[0]?.section || ''} | Science</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/teacher/assignments/create">
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Assignment
              </Button>
            </Link>
            <Button size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notifications
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-dark-card rounded-xl border border-dark-line p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Total Students</span>
              <div className="w-10 h-10 rounded-lg bg-teal/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-white">{data.classOverview.totalStudents}</div>
            <p className="text-sm text-teal mt-1">{data.classOverview.activeToday} active now</p>
          </div>

          <div className="bg-dark-card rounded-xl border border-dark-line p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Average Mastery</span>
              <div className="w-10 h-10 rounded-lg bg-violet/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-white">{data.classOverview.averageMastery}%</div>
            <p className="text-sm text-teal mt-1">+{data.classOverview.masteryChange}% from last week</p>
          </div>

          <div className="bg-dark-card rounded-xl border border-dark-line p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Need Review</span>
              <div className="w-10 h-10 rounded-lg bg-coral/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-display font-bold text-white">{data.atRiskStudents.length}</div>
            <p className="text-sm text-coral mt-1">{highRiskCount} critical attention needed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Student Roster Table */}
          <div className="lg:col-span-2 bg-dark-card rounded-xl border border-dark-line overflow-hidden">
            <div className="p-6 border-b border-dark-line">
              <h2 className="text-lg font-display font-semibold text-white">Student Roster</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-surface">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Learning Style</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Mastery</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-line">
                  {data.students.map((student) => {
                    const mastery = student.mastery;
                    const status = mastery >= 80 ? 'on-track' : mastery >= 60 ? 'at-risk' : 'critical';
                    return (
                      <tr key={student.id} className="hover:bg-dark-surface transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              initials={student.avatar}
                              color={student.color}
                              size="sm"
                            />
                            <div>
                              <span className="text-white font-medium block">{student.name}</span>
                              <span className="text-xs text-slate-500">Roll #{student.rollNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-500 text-sm">Not assessed</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-dark-surface rounded-full overflow-hidden max-w-[100px]">
                              <div
                                className={`h-full rounded-full ${
                                  mastery >= 80 ? 'bg-teal' : mastery >= 60 ? 'bg-warning' : 'bg-coral'
                                }`}
                                style={{ width: `${mastery}%` }}
                              />
                            </div>
                            <span className="text-white font-medium">{mastery}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={status === 'on-track' ? 'teal' : status === 'at-risk' ? 'warning' : 'coral'}>
                            {status === 'on-track' ? 'On Track' : status === 'at-risk' ? 'At Risk' : 'Critical'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Personalized Teaching Tips */}
          <div className="bg-dark-card rounded-xl border border-dark-line overflow-hidden">
            <div className="p-6 border-b border-dark-line">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet" />
                <h2 className="text-lg font-display font-semibold text-white">Personalized Teaching Tips</h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">AI-generated tips based on student learning styles</p>
            </div>
            <div className="p-4 overflow-auto max-h-[600px]">
              {data.atRiskStudents.map((atRisk) => (
                <AtRiskTeachingTips
                  key={atRisk.student.id}
                  student={atRisk.student}
                  riskLevel={atRisk.riskLevel}
                />
              ))}
              {data.atRiskStudents.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">No at-risk students identified</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar - Misconception Alerts */}
      <aside className="w-80 bg-dark-card border-l border-dark-line p-6 overflow-auto">
        <h3 className="text-lg font-display font-semibold text-white mb-6">Misconception Alerts</h3>
        <div className="space-y-4">
          {data.misconceptionClusters.slice(0, 4).map((cluster, index) => (
            <div key={index} className="bg-dark-surface rounded-lg p-4 border border-dark-line">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-coral/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-coral" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{cluster.topic}</p>
                  <p className="text-xs text-violet mb-1">{cluster.affectedStudents} students affected</p>
                  <p className="text-slate-400 text-sm">{cluster.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-3 text-coral">
                Schedule Review
              </Button>
            </div>
          ))}
          {data.misconceptionClusters.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No misconceptions detected</p>
          )}
        </div>
      </aside>
    </div>
  );
}
