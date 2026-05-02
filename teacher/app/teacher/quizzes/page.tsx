'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/lib/components/status-badge';
import type { Quiz, QuizVersion } from '@shared/types/quiz';

interface QuizWithDetails extends Quiz {
  version: QuizVersion;
  questionCount: number;
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const res = await fetch('/teacher/api/teacher/quizzes', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createQuiz() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/teacher/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
        body: JSON.stringify({ title: newTitle.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = `/teacher/quizzes/${data.quiz.id}/edit`;
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Create Quiz
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Quiz</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Quiz Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter quiz title"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowCreate(false); setNewTitle(''); }} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={createQuiz} disabled={creating || !newTitle.trim()} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No quizzes yet</p>
          <button onClick={() => setShowCreate(true)} className="text-primary hover:underline">
            Create your first quiz
          </button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Questions</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/teacher/quizzes/${quiz.id}/edit`} className="text-primary hover:underline font-medium">
                      {quiz.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={quiz.version.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{quiz.questionCount}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/teacher/quizzes/${quiz.id}/edit`} className="text-sm text-primary hover:underline">
                        Edit
                      </Link>
                      {quiz.version.status === 'published' && (
                        <Link href={`/teacher/quizzes/${quiz.id}/edit`} className="text-sm text-gray-500 hover:underline">
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}