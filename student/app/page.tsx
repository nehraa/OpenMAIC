'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, BookOpen, ClipboardList, MessageSquare, Play } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  status: 'pending' | 'completed' | 'overdue';
}

interface LiveSession {
  id: string;
  assignment_title: string;
  teacher_name: string;
  status: 'live' | 'scheduled';
  started_at: string;
}

interface Quiz {
  id: string;
  title: string;
  status: string;
}

export default function StudentDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/student/assignments').then(r => r.json()).catch(() => ({ assignments: [] })),
      fetch('/api/student/live-sessions').then(r => r.json()).catch(() => ({ sessions: [] })),
    ]).then(([assignmentsData, sessionsData]) => {
      setAssignments(assignmentsData.assignments?.slice(0, 5) || []);
      setLiveSessions(sessionsData.sessions?.filter((s: LiveSession) => s.status === 'live').slice(0, 3) || []);
    }).finally(() => setLoading(false));
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
        {liveSessions.length > 0 && (
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

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
                      a.status === 'overdue' ? 'bg-red-100 text-red-700' :
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
