'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, BookOpen, ClipboardList, MessageSquare, Play } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
}

interface Assignment {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  status: 'pending' | 'completed' | 'in_progress';
}

interface LiveSession {
  id: string;
  assignment_title: string;
  teacher_name: string;
  status: 'live' | 'scheduled';
  started_at: string;
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/student/api/student/classes').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch classes'))),
      fetch('/student/api/student/assignments').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch assignments'))),
      fetch('/student/api/student/live-sessions').then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to fetch live sessions'))),
    ])
      .then(([classesData, assignmentsData, sessionsData]) => {
        setClasses(classesData.classes?.slice(0, 4) || []);
        setAssignments(assignmentsData.assignments?.slice(0, 5) || []);
        setLiveSessions(sessionsData.sessions?.filter((s: LiveSession) => s.status === 'live').slice(0, 3) || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back!</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Live Sessions */}
        {loading && liveSessions.length === 0 ? null : liveSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              Live Sessions
            </h2>
            <div className="grid gap-4">
              {liveSessions.map(session => (
                <Link key={session.id} href={`/student/sessions/${session.id}`} className="bg-white rounded-xl border p-4 flex items-center justify-between hover:border-primary/40 transition-all">
                  <div>
                    <h3 className="font-semibold">{session.assignment_title}</h3>
                    <p className="text-sm text-muted-foreground">with {session.teacher_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play size={20} className="text-primary" />
                    <span className="text-primary font-medium">Join</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* My Classes Preview */}
        {classes.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">My Classes</h2>
              <Link href="/student/classes" className="text-sm text-primary font-medium hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.slice(0, 4).map(cls => (
                <div key={cls.id} className="bg-white rounded-xl border p-4 hover:border-primary/40 transition-all">
                  <h3 className="font-semibold truncate">{cls.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">with {cls.teacher_name}</p>
                  {cls.subject && (
                    <p className="text-xs text-primary/80 mt-1">{cls.subject}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/student/classes" className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">My Classes</h3>
            <p className="text-sm text-muted-foreground">View enrolled classes</p>
          </Link>
          <Link href="/student/lessons" className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all">
            <BookOpen className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">My Lessons</h3>
            <p className="text-sm text-muted-foreground">View assigned lessons</p>
          </Link>
          <Link href="/student/assignments" className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all">
            <ClipboardList className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Assignments</h3>
            <p className="text-sm text-muted-foreground">Track your homework</p>
          </Link>
          <Link href="/student/questions" className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all">
            <MessageSquare className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold mb-1">Ask a Question</h3>
            <p className="text-sm text-muted-foreground">Get help from your teacher</p>
          </Link>
        </div>

        {/* Assignments List */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Upcoming Assignments</h2>
          </div>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-muted transition-colors">
                  <div>
                    <span className="font-medium">{a.title}</span>
                    <span className="text-sm text-muted-foreground ml-2">{a.class_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.due_at && (
                      <span className="text-sm text-muted-foreground">
                        Due: {new Date(a.due_at).toLocaleDateString()}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'completed' ? 'bg-green-100 text-green-700' :
                      a.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{a.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
