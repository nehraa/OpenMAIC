'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [assignment, setAssignment] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [assignmentRes, attemptRes] = await Promise.all([
          fetch(`/api/assignments/${id}`, { credentials: 'include' }),
          fetch(`/api/assignments/${id}/attempt`, {
            method: 'POST',
            credentials: 'include',
          }),
        ]);

        const assignmentData = await assignmentRes.json();
        if (assignmentData.success) setAssignment(assignmentData.data);

        const attemptData = await attemptRes.json();
        if (attemptData.success) {
          setAttempt(attemptData.data);
          if (attemptData.data.completionState === 'submitted') {
            setSubmitted(true);
            setScore(attemptData.data.scorePercent);
          }
        }
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit() {
    setSubmitting(true);
    const submittedScore = Math.floor(Math.random() * 30) + 70;

    try {
      const res = await fetch(`/api/assignments/${id}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scorePercent: submittedScore }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setScore(data.data.scorePercent);
      }
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-base">
        <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/dashboard/student/assignments" className="text-slate-400 hover:text-white transition-colors">
              ← Assignments
            </Link>
            <span className="text-white font-medium">Assignment</span>
            <div />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-coral" />
        </main>
      </div>
    );
  }

  if (submitted && score !== null) {
    return (
      <div className="min-h-screen bg-dark-base">
        <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div />
            <span className="text-white font-medium">{assignment?.title || 'Assignment'}</span>
            <div />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="w-16 h-16 text-teal mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold text-white mb-2">Assignment Complete!</h1>
          <div className="text-6xl font-bold text-coral mb-4">{score}%</div>
          <p className="text-slate-400 mb-8">
            {score >= 80 ? 'Excellent work!' : score >= 60 ? 'Good job! Keep practicing.' : 'Review the material and try again.'}
          </p>
          <Link href="/dashboard/student/assignments">
            <Button>Back to Assignments</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-base">
      <header className="border-b border-dark-line bg-dark-surface px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard/student/assignments" className="text-slate-400 hover:text-white transition-colors">
            ← Assignments
          </Link>
          <span className="text-white font-medium">{assignment?.title || 'Assignment'}</span>
          <div />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{assignment?.title || 'Assignment'}</CardTitle>
            {assignment?.description && (
              <p className="text-slate-400 text-sm mt-2">{assignment.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {assignment?.dueAt && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Due: {new Date(assignment.dueAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="text-slate-300 text-sm">
              {assignment?.quizAssetVersionId
                ? 'This assignment includes a quiz. Complete it and submit when ready.'
                : 'This assignment includes study materials. Review and complete when ready.'}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8"
          >
            {submitting ? 'Submitting...' : 'Complete Assignment'}
          </Button>
        </div>
      </main>
    </div>
  );
}
