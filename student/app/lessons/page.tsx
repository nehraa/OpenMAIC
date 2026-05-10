'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  class_name: string;
  description: string;
  duration_minutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

export default function StudentLessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/student/api/student/lessons')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch lessons');
        return r.json();
      })
      .then(data => {
        setLessons(data.lessons || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status: Lesson['status']) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Completed</span>;
      case 'in_progress':
        return <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">In Progress</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Not Started</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Lessons</h1>
              <p className="text-sm text-muted-foreground">View your assigned lessons</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Unable to load lessons. Please try again later.</p>
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Lessons Yet</h2>
            <p className="text-muted-foreground">
              You don&apos;t have any lessons assigned. Your teacher will assign lessons when ready.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {lessons.map(lesson => (
              <div
                key={lesson.id}
                className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{lesson.title}</h3>
                      {getStatusBadge(lesson.status)}
                    </div>
                    <p className="text-muted-foreground mb-2">{lesson.class_name}</p>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground mb-3">{lesson.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                  >
                    {lesson.status === 'completed' ? 'Review' : 'Start'}
                    <ArrowRight size={16} />
                  </Link>
                </div>
                {lesson.completed_at && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    Completed: {new Date(lesson.completed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}