'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Users } from 'lucide-react';

interface AssignmentListItem {
  id: string;
  title: string;
  className: string;
  status: string;
  dueAt: string | null;
  recipientCount: number;
  completedCount: number;
}

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/assignments', { credentials: 'include' })
      .then((r) => r.json())
      .then((r) => {
        if (r.success && r.data) {
          const list: AssignmentListItem[] = r.data.map((a: any) => ({
            id: a.id,
            title: a.title,
            className: a.class?.name || 'Unknown',
            status: a.status,
            dueAt: a.dueAt,
            recipientCount: a.recipients?.length || 0,
            completedCount:
              a.recipients?.filter((r: any) => r.visibilityStatus === 'completed')
                .length || 0,
          }));
          setAssignments(list);
        }
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-dark-base p-8">
        <p className="text-slate-400">Loading assignments...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-dark-base">
      <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard/teacher"
            className="text-slate-400 hover:text-white"
          >
            ← Dashboard
          </Link>
          <span className="text-white font-display font-bold text-lg">
            Assignments
          </span>
          <Link
            href="/dashboard/teacher/assignments/create"
            className="px-4 py-2 bg-coral text-white rounded-lg text-sm font-medium hover:bg-coral/90"
          >
            + New Assignment
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {assignments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-slate-400 mb-4">No assignments yet.</p>
              <Link
                href="/dashboard/teacher/assignments/create"
                className="text-coral hover:underline"
              >
                Create your first assignment
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const rate =
                a.recipientCount > 0
                  ? Math.round((a.completedCount / a.recipientCount) * 100)
                  : 0;
              return (
                <Link key={a.id} href={`/dashboard/teacher/assignments/${a.id}`}>
                  <Card className="hover:border-coral/50 cursor-pointer transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-5 h-5 text-coral" />
                        <div>
                          <h3 className="text-white font-medium">{a.title}</h3>
                          <p className="text-slate-400 text-sm">{a.className}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {a.dueAt && (
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(a.dueAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Users className="w-3 h-3" />
                          <span>{a.recipientCount}</span>
                        </div>
                        <div className="text-sm">
                          <span
                            className={
                              rate >= 100
                                ? 'text-teal'
                                : rate >= 50
                                  ? 'text-coral'
                                  : 'text-slate-400'
                            }
                          >
                            {rate}%
                          </span>
                          <span className="text-slate-500"> done</span>
                        </div>
                        <Badge
                          variant={
                            a.status === 'RELEASED'
                              ? 'teal'
                              : a.status === 'DRAFT'
                                ? 'default'
                                : 'coral'
                          }
                        >
                          {a.status.toLowerCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}