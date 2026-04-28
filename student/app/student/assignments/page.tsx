'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  score_percent: number | null;
  submitted_at: string | null;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/student/assignments')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch assignments');
        return r.json();
      })
      .then(data => {
        setAssignments(data.assignments || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-700',
      icon: Clock,
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-700',
      icon: CheckCircle,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Assignments</h1>
              <p className="text-sm text-muted-foreground">Track your homework and submissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-1/3 mb-4" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Unable to load assignments. Please try again later.</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Assignments Yet</h2>
            <p className="text-muted-foreground">
              You don&apos;t have any assignments assigned to you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map(assignment => {
              const config = statusConfig[assignment.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${config.className}`}>
                          <StatusIcon size={12} />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-2">{assignment.class_name}</p>
                      {assignment.due_at && (
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(assignment.due_at).toLocaleDateString()}
                        </p>
                      )}
                      {assignment.score_percent !== null && (
                        <p className="text-sm text-primary font-medium mt-1">
                          Score: {assignment.score_percent}%
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                    >
                      {assignment.status === 'completed' ? 'Review' : 'Start'}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
