'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Link from 'next/link';
import { BookOpen, Clock, CheckCircle, Circle } from 'lucide-react';

interface AssignmentItem {
  homeworkId: string;
  title: string;
  dueDate: string;
  assignedAt: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/student', { credentials: 'include' })
      .then(r => r.json())
      .then(r => {
        if (r.success && r.data.assignedHomework) {
          setAssignments(r.data.assignedHomework);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base">
        <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">← Back</Link>
            <span className="text-white font-display font-bold">My Assignments</span>
            <div />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-coral" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-base">
      <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/student" className="text-slate-400 hover:text-white transition-colors">← Back</Link>
          <span className="text-white font-display font-bold">My Assignments</span>
          <div />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-3">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No assignments yet.</p>
            </CardContent>
          </Card>
        ) : assignments.map(hw => (
          <Link key={hw.homeworkId} href={`/dashboard/student/assignments/${hw.homeworkId}`}>
            <Card className="hover:border-coral/50 cursor-pointer transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hw.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-teal" />
                  ) : hw.status === 'in-progress' ? (
                    <Circle className="w-5 h-5 text-coral" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-slate-500" />
                  )}
                  <span className="text-white font-medium">{hw.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400 hidden sm:block">Due: {hw.dueDate}</span>
                  <Badge variant={hw.status === 'completed' ? 'teal' : hw.status === 'in-progress' ? 'coral' : 'default'}>
                    {hw.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </main>
    </div>
  );
}
