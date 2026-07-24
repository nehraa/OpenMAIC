'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ClipboardList, Clock, CheckCircle2, Circle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  visibility_status: string;
  submitted_at: string | null;
  score_percent: number | null;
}

const statusStyles: Record<Assignment['status'], string> = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels: Record<Assignment['status'], string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

function StatusIcon({ status }: { status: Assignment['status'] }) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-green-600" />;
  if (status === 'in_progress') return <Clock className="h-5 w-5 text-blue-600" />;
  return <Circle className="h-5 w-5 text-amber-600" />;
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/student/api/student/assignments', { credentials: 'include' })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return response.json();
      })
      .then(data => setAssignments(data.assignments || []))
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch assignments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Assignments</h1>
              <p className="text-sm text-muted-foreground">Track homework and submissions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(item => (
              <div key={item} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-3" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700">Unable to load assignments. Please try again later.</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Assignments Yet</h2>
            <p className="text-muted-foreground">Your teacher has not released any assignments yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {assignments.map(assignment => (
              <Link
                key={assignment.id}
                href={`/assignments/${assignment.id}`}
                className="block bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <StatusIcon status={assignment.status} />
                    <div className="min-w-0">
                      <h2 className="font-semibold text-lg break-words">{assignment.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.class_name}</p>
                      {assignment.due_at && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Due: {new Date(assignment.due_at).toLocaleString()}
                        </p>
                      )}
                      {assignment.score_percent !== null && (
                        <p className="text-sm font-medium text-green-700 mt-2">
                          Score: {Math.round(assignment.score_percent)}%
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyles[assignment.status]}`}>
                      {statusLabels[assignment.status]}
                    </span>
                    <ArrowRight size={16} className="text-primary" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
