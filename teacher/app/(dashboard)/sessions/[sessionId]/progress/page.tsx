'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Participant {
  id: string;
  name: string;
  phone_e164: string;
  joined_at: string;
  completion_state: 'pending' | 'completed';
  left_at: string | null;
}

interface Question {
  id: string;
  student_id: string;
  student_name?: string;
  question_text: string;
  created_at: string;
}

interface ProgressData {
  session: {
    id: string;
    title: string;
    status: string;
    started_at: string | null;
    max_duration_minutes: number;
  };
  participants: Participant[];
  completion_stats: {
    total: number;
    completed: number;
    pending: number;
    completion_rate: number;
  };
  questions: Question[];
}

export default function SessionProgressPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/teacher/api/teacher/sessions/${sessionId}/progress`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();

    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchProgress, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Failed to load session progress</div>;

  const { session, participants, completion_stats, questions } = data;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{session.title || 'Session Progress'}</h1>
        <span className={`inline-block px-3 py-1 rounded ${
          session.status === 'live' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
        }`}>
          {session.status.toUpperCase()}
        </span>
      </div>

      {/* Completion Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total Participants</div>
          <div className="text-3xl font-bold">{completion_stats.total}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-3xl font-bold text-green-600">{completion_stats.completed}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{completion_stats.pending}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Completion Rate</div>
          <div className="text-3xl font-bold">{completion_stats.completion_rate.toFixed(0)}%</div>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Participants</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {participants.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4">{p.name || 'Unknown'}</td>
                <td className="px-6 py-4 font-mono text-sm">{p.phone_e164}</td>
                <td className="px-6 py-4 text-sm">{new Date(p.joined_at).toLocaleTimeString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${
                    p.completion_state === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {p.completion_state}
                  </span>
                </td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No participants yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Questions Feed */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
        </div>
        <div className="divide-y">
          {questions.map((q) => (
            <div key={q.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{q.student_name || 'Student'}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(q.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-gray-700">{q.question_text}</p>
            </div>
          ))}
          {questions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No questions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
