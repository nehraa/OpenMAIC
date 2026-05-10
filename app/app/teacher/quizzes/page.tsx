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

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const res = await fetch('/api/teacher/quizzes', {
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

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quizzes</h1>
        <Link
          href="/teacher/quizzes/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Create Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No quizzes yet</p>
          <Link href="/teacher/quizzes/new" className="text-primary hover:underline">
            Create your first quiz
          </Link>
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
