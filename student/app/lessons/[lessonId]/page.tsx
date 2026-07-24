'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  class_name: string;
  description: string;
  duration_minutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

export default function StudentLessonDetailPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = (params?.lessonId as string) ?? '';

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    fetch('/student/api/student/lessons', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { lessons?: Lesson[] } | null) => {
        const match = data?.lessons?.find(l => l.id === lessonId) ?? null;
        setLesson(match);
      })
      .catch(() => setLesson(null))
      .finally(() => setLoading(false));
  }, [lessonId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push('/lessons')}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Back to lessons"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Lesson</h1>
            <p className="text-sm text-muted-foreground">View lesson details</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="bg-white rounded-xl border p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/2 mb-3" />
            <div className="h-4 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        ) : lesson ? (
          <article className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">{lesson.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{lesson.class_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lesson.duration_minutes} min
              </span>
            </div>
            {lesson.description && (
              <p className="text-foreground/90 leading-relaxed">{lesson.description}</p>
            )}
            <div className="border-t pt-4">
              <div className="rounded-lg bg-muted/50 border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Lesson content is coming soon. The interactive lesson player will arrive in a future release.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/lessons"
                className="text-sm text-primary font-medium hover:underline"
              >
                ← Back to all lessons
              </Link>
            </div>
          </article>
        ) : (
          <div className="bg-white rounded-xl border p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">Lesson not found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find this lesson. It may have been removed or you may no longer have access.
            </p>
            <Link
              href="/lessons"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              <ArrowLeft size={16} />
              Back to lessons
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
