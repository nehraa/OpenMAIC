'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { QuizEditor } from '@/lib/components/quiz-editor';
import type { Quiz, QuizVersion, QuizPayload, QuizQuestion } from '@shared/types/quiz';

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

export default function QuizEditPage() {
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [version, setVersion] = useState<QuizVersion | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  async function fetchQuiz() {
    try {
      const res = await fetch(`/teacher/api/teacher/quizzes/${quizId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setQuiz(data.quiz);
        setVersion(data.version);
        setQuestions(data.payload?.questions || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to load quiz');
      }
    } catch (err) {
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    // Refresh quiz data
    fetchQuiz();
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error || !quiz) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">{error || 'Quiz not found'}</div>
        <Link href="/teacher/quizzes" className="text-primary hover:underline">Back to Quizzes</Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/teacher/quizzes" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block">
          ← Back to Quizzes
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-sm text-gray-500">
              Version {version?.version_number || 1} · {version?.status || 'draft'}
              {version?.status === 'published' && ' (read-only)'}
            </p>
          </div>
        </div>
      </div>

      <QuizEditor
        quizId={quizId}
        initialQuestions={questions}
        onSave={handleSave}
      />
    </div>
  );
}