'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, ClipboardList, BarChart3, Library, Users } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  student_count: number;
}

interface Assignment {
  id: string;
  title: string;
  status: string;
}

interface Quiz {
  id: string;
  title: string;
  status: string;
}

interface LiveSession {
  id: string;
  assignment_title: string;
  status: 'live' | 'ended';
  started_at: string;
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    Promise.all([
      fetch('/api/teacher/classes').then(r => r.json()).catch(() => ({ classes: [] })),
      fetch('/api/teacher/assignments').then(r => r.json()).catch(() => ({ assignments: [] })),
      fetch('/api/teacher/live-sessions').then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([classesData, assignmentsData, sessionsData]) => {
      setClasses(classesData.classes?.slice(0, 3) || []);
      setRecentAssignments(assignmentsData.assignments?.slice(0, 5) || []);
      setLiveSessions(sessionsData.sessions?.filter((s: LiveSession) => s.status === 'live').slice(0, 3) || []);
    }).finally(() => setLoading(false));
  }, []);

  const navItems = [
    { href: '/teacher/assignments', label: 'Assignments', icon: ClipboardList, desc: 'Create and manage assignments' },
    { href: '/teacher/quizzes', label: 'Quizzes', icon: BookOpen, desc: 'Build AI-powered quizzes' },
    { href: '/teacher/library', label: 'Library', icon: Library, desc: 'Content assets and resources' },
    { href: '/teacher/progress', label: 'Progress', icon: BarChart3, desc: 'Student progress analytics' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Teacher Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your classroom</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Live Sessions Alert */}
        {liveSessions.length > 0 && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-semibold text-green-800">{liveSessions.length} Live Session{liveSessions.length > 1 ? 's' : ''} Active</span>
            </div>
            <div className="flex gap-4">
              {liveSessions.map(session => (
                <Link key={session.id} href={`/teacher/sessions/${session.id}`} className="text-green-700 hover:underline text-sm">
                  {session.assignment_title}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Nav Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="group bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all">
              <item.icon className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </Link>
          ))}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} /> Your Classes
              </h2>
              <Link href="/teacher/classes" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No classes yet</p>
                <Link href="/teacher/classes" className="text-primary hover:underline text-sm">Create your first class</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {classes.map(c => (
                  <Link key={c.id} href={`/teacher/classes/${c.id}`} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted transition-colors">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-sm text-muted-foreground">{c.student_count} students</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Assignments */}
          <div className="bg-white rounded-xl border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList size={20} /> Recent Assignments
              </h2>
              <Link href="/teacher/assignments" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : recentAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No assignments yet</p>
                <Link href="/teacher/assignments" className="text-primary hover:underline text-sm">Create your first assignment</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssignments.map(a => (
                  <Link key={a.id} href={`/teacher/assignments/${a.id}`} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted transition-colors">
                    <span className="font-medium">{a.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'released' ? 'bg-green-100 text-green-700' :
                      a.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{a.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
