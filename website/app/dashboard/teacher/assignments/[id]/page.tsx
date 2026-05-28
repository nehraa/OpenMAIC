'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Avatar } from '@/app/components/ui/avatar';
import Link from 'next/link';
import { CheckCircle, Circle, Clock } from 'lucide-react';

interface StudentProgress {
  studentId: string;
  name: string;
  avatar: string;
  color: 'teal' | 'violet' | 'coral' | 'info' | 'slate';
  status: string;
  score: number | null;
  submittedAt: string | null;
  startedAt: string | null;
}

interface AssignmentInfo {
  id: string;
  title: string;
  class?: { name: string };
}

export default function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Fetch recipients with attempt data
      const res = await fetch(`/api/assignments/${id}/recipients`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }

      // Fetch assignment info
      const assignRes = await fetch(`/api/assignments/${id}`, {
        credentials: 'include',
      });
      const assignData = await assignRes.json();
      if (assignData.success) {
        setAssignment(assignData.data);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-dark-base p-8">
        <p className="text-slate-400">Loading...</p>
      </div>
    );

  const completed = students.filter((s) => s.status === 'COMPLETED').length;
  const total = students.length;

  return (
    <div className="min-h-screen bg-dark-base">
      <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard/teacher/assignments"
            className="text-slate-400 hover:text-white"
          >
            ← Assignments
          </Link>
          <span className="text-white font-medium">
            {assignment?.title || 'Assignment'}
          </span>
          <div className="text-sm text-slate-400">
            {completed}/{total} complete
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold">Completion Progress</h2>
              <p className="text-slate-400 text-sm">
                {assignment?.class?.name || 'Class'}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  completed === total && total > 0 ? 'text-teal' : 'text-coral'
                }`}
              >
                {total > 0 ? Math.round((completed / total) * 100) : 0}%
              </div>
              <p className="text-slate-400 text-sm">
                {completed} of {total} students
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No students assigned to this assignment.
              </p>
            ) : (
              students.map((s) => (
                <div
                  key={s.studentId}
                  className="flex items-center justify-between p-3 bg-dark-surface rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Avatar initials={s.avatar} color={s.color} size="sm" />
                    <span className="text-white">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.startedAt && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          Started {new Date(s.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {s.score !== null && (
                      <span
                        className={`text-sm font-medium ${
                          s.score >= 80 ? 'text-teal' : 'text-coral'
                        }`}
                      >
                        {s.score}%
                      </span>
                    )}
                    <Badge
                      variant={
                        s.status === 'COMPLETED'
                          ? 'teal'
                          : s.status === 'VISIBLE'
                            ? 'coral'
                            : 'default'
                      }
                    >
                      {s.status.toLowerCase()}
                    </Badge>
                    {s.status === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 text-teal" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}