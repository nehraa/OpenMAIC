'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, ClipboardList, Loader2, Users } from 'lucide-react';

interface ClassDetail {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
  enrolled_at: string;
  batch: string;
  join_code: string | null;
}

interface AssignmentSummary {
  id: string;
  title: string;
  class_name: string;
  due_at: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  score_percent: number | null;
}

export default function StudentClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = (params?.classId as string) ?? '';

  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const [cRes, aRes] = await Promise.all([
        fetch(`/student/api/student/classes/${classId}`, { credentials: 'include' }).catch(() => null),
        fetch('/student/api/student/assignments', { credentials: 'include' }),
      ]);

      if (cRes && cRes.ok) {
        const json = (await cRes.json()) as { class: ClassDetail };
        setCls(json.class);
      } else if (cRes && cRes.status === 404) {
        setError('Class not found');
      }

      if (aRes.ok) {
        const json = (await aRes.json()) as { assignments: AssignmentSummary[] };
        setAssignments((json.assignments || []).filter(a => true));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load class');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !cls) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-6">
        <div className="max-w-md bg-white rounded-xl border p-8 text-center">
          <h1 className="text-lg font-semibold mb-2">{error ?? 'Class not found'}</h1>
          <Link href="/classes" className="text-primary font-medium hover:underline">
            Back to classes
          </Link>
        </div>
      </div>
    );
  }

  const classAssignments = assignments.filter(a => a.class_name === cls.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/classes')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to classes"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{cls.name}</h1>
            <p className="text-sm text-muted-foreground truncate">with {cls.teacher_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white rounded-xl border p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Enrolled {new Date(cls.enrolled_at).toLocaleDateString()}</span>
          </div>
          {cls.subject && (
            <p className="text-sm">
              <span className="font-medium">Subject:</span> {cls.subject}
            </p>
          )}
          {cls.batch && (
            <p className="text-sm">
              <span className="font-medium">Batch:</span> {cls.batch}
            </p>
          )}
          {cls.join_code && (
            <p className="text-sm">
              <span className="font-medium">Join code:</span>{' '}
              <code className="px-2 py-0.5 rounded bg-muted font-mono">{cls.join_code}</code>
            </p>
          )}
        </section>

        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <ClipboardList size={18} />
              Assignments
            </h2>
            <span className="text-xs text-muted-foreground">{classAssignments.length} total</span>
          </div>
          {classAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No assignments released for this class yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {classAssignments.map(a => (
                <li key={a.id}>
                  <Link
                    href={`/assignments/${a.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.title}</p>
                      {a.due_at && (
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(a.due_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.score_percent !== null && (
                        <span className="text-xs font-medium text-green-700">
                          {Math.round(a.score_percent)}%
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">{a.status}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
