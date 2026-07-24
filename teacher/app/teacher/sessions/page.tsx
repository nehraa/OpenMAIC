'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Play, Plus, Clock, Users } from 'lucide-react';

interface LiveSession {
  id: string;
  assignment_id: string;
  status: 'waiting' | 'live' | 'ended';
  started_at: string;
  ended_at: string | null;
  state_snapshot_json: string | null;
  assignment_title?: string;
}

export default function TeacherSessionsPage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/teacher/api/teacher/live-sessions', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = (await res.json()) as { sessions: LiveSession[] };
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Live Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Run real-time classroom sessions for any assigned deck.
          </p>
        </div>
        <Link
          href="/teacher/assignments"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:bg-primary/90"
        >
          <Plus size={16} /> Start from assignment
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">No live sessions yet</h2>
          <p className="text-sm text-muted-foreground">
            Open an assignment and start a live session to bring students into a shared room.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/teacher/sessions/${session.id}`}
                className="flex items-center justify-between bg-white border rounded-xl p-5 hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">
                    {session.assignment_title || session.assignment_id}
                  </h3>
                  <p className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {new Date(session.started_at).toLocaleString()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        session.status === 'live'
                          ? 'bg-green-100 text-green-700'
                          : session.status === 'waiting'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {session.status}
                    </span>
                  </p>
                </div>
                <Play className="h-5 w-5 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
