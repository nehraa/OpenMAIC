'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, ArrowRight } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  teacher_name: string;
  enrolled_at: string;
  batch: string;
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/student/api/student/classes')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch classes');
        return r.json();
      })
      .then(data => {
        setClasses(data.classes || []);
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
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Classes</h1>
              <p className="text-sm text-muted-foreground">View your enrolled classes</p>
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
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">Unable to load classes. Please try again later.</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Classes Yet</h2>
            <p className="text-muted-foreground">
              You haven&apos;t joined any classes. Ask your teacher for a join code.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map(cls => (
              <div
                key={cls.id}
                className="bg-white rounded-xl border p-6 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      {cls.batch && (
                        <span className="text-xs px-2 py-1 bg-muted rounded-full">
                          {cls.batch}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      with {cls.teacher_name}
                    </p>
                    {cls.subject && (
                      <p className="text-sm text-primary/80">
                        Subject: {cls.subject}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/student/classes/${cls.id}`}
                    className="flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                  >
                    View
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                  Enrolled: {new Date(cls.enrolled_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
