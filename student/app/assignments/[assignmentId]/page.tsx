'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react';

interface AssignmentDetail {
  id: string;
  title: string;
  description: string | null;
  class_name: string;
  due_at: string | null;
  status: string;
  openmaicUrl: string | null;
}

interface SlideSummary {
  slide_id: string;
  title: string;
  viewed: boolean;
}

interface AssignmentResponse {
  assignment: AssignmentDetail;
  slides: SlideSummary[];
  progress: { viewed_count: number; total_slides: number; is_complete: boolean };
  attempt: {
    completion_state: string;
    submitted_at: string | null;
    score_percent: number | null;
  } | null;
}

interface QuizResponse {
  assignmentId: string;
  title: string;
  questions: Array<{ id: string; type: string; question: string; points: number }>;
  timeLimit: number;
  attempt: {
    submitted: boolean;
    score: number | null;
    submittedAt: string | null;
  } | null;
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = (params?.assignmentId as string) ?? '';

  const [data, setData] = useState<AssignmentResponse | null>(null);
  const [quiz, setQuiz] = useState<QuizResponse | null>(null);
  const [accessCode, setAccessCode] = useState<string>('');
  const [accessCodeEnabled, setAccessCodeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const [aRes, qRes, cRes] = await Promise.all([
        fetch(`/student/api/student/assignments/${assignmentId}`, { credentials: 'include' }),
        fetch(`/student/api/student/quizzes/${assignmentId}`, { credentials: 'include' }).catch(() => null),
        fetch('/student/api/student/access-code', { credentials: 'include' }),
      ]);

      if (!aRes.ok) throw new Error(`Failed to load assignment (HTTP ${aRes.status})`);
      const aJson = (await aRes.json()) as AssignmentResponse;
      setData(aJson);

      if (qRes && qRes.ok) {
        const qJson = (await qRes.json()) as QuizResponse;
        setQuiz(qJson);
      } else {
        setQuiz(null);
      }

      if (cRes.ok) {
        const cJson = (await cRes.json()) as { enabled: boolean; code: string };
        setAccessCodeEnabled(Boolean(cJson.enabled));
        setAccessCode(cJson.code || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const copyCode = useCallback(async () => {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [accessCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-6">
        <div className="max-w-md bg-white rounded-xl border p-8 text-center">
          <h1 className="text-lg font-semibold mb-2">Couldn&apos;t open this assignment</h1>
          <p className="text-sm text-muted-foreground mb-4">{error ?? 'Assignment not found'}</p>
          <Link href="/assignments" className="text-primary font-medium hover:underline">
            Back to assignments
          </Link>
        </div>
      </div>
    );
  }

  const { assignment, slides, progress, attempt } = data;
  const hasOpenmaicLink = Boolean(assignment.openmaicUrl);
  const quizAttempted = Boolean(quiz?.attempt?.submitted);
  const quizScore = quiz?.attempt?.score ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/assignments')}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back to assignments"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{assignment.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{assignment.class_name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {assignment.description && (
          <section className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold mb-2">Instructions</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{assignment.description}</p>
          </section>
        )}

        {assignment.due_at && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock size={14} />
            Due: {new Date(assignment.due_at).toLocaleString()}
          </p>
        )}

        {hasOpenmaicLink ? (
          <section className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <h2 className="font-semibold mb-1">Open the slides</h2>
              <p className="text-sm text-muted-foreground">
                Your teacher linked this assignment to a classroom. Open the link below to view the slides.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={assignment.openmaicUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
              >
                <ExternalLink size={16} />
                Open classroom slides
              </a>
              {accessCodeEnabled && (
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-medium hover:bg-muted transition"
                >
                  <ShieldCheck size={16} />
                  Show access code
                </button>
              )}
            </div>
          </section>
        ) : (
          slides.length > 0 && (
            <section className="bg-white rounded-xl border p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Slides</h2>
                <p className="text-xs text-muted-foreground">
                  {progress.viewed_count} / {progress.total_slides} viewed
                </p>
              </div>
              <ol className="space-y-2 text-sm">
                {slides.map((slide, index) => (
                  <li key={slide.slide_id} className="flex items-center gap-2">
                    {slide.viewed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border" />
                    )}
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span className="truncate">{slide.title || 'Untitled slide'}</span>
                  </li>
                ))}
              </ol>
            </section>
          )
        )}

        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-semibold mb-1">Quiz</h2>
              <p className="text-sm text-muted-foreground">
                {quiz
                  ? quizAttempted
                    ? `You attempted this quiz.`
                    : `${quiz.questions.length} questions — ${Math.round(quiz.timeLimit / 60)} min time limit.`
                  : 'No quiz attached to this assignment.'}
              </p>
            </div>
            {quizAttempted && quizScore !== null && (
              <span className="text-sm font-semibold text-green-700">Score: {Math.round(quizScore)}%</span>
            )}
          </div>

          {quiz ? (
            <Link
              href={`/quizzes/${assignmentId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              {quizAttempted ? 'Review your attempt' : 'Start quiz'}
            </Link>
          ) : attempt && attempt.score_percent !== null ? (
            <p className="text-sm text-muted-foreground">
              Quiz score on record: {Math.round(attempt.score_percent)}%
            </p>
          ) : null}
        </section>
      </main>

      {showCodeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="access-code-title"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 id="access-code-title" className="font-semibold">
                Classroom access code
              </h3>
              <button
                type="button"
                onClick={() => setShowCodeModal(false)}
                className="p-1 rounded hover:bg-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste this code into the classroom prompt after the slides open.
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3 font-mono text-lg">
              <span className="flex-1 truncate">{accessCode}</span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-md border bg-white text-sm font-medium hover:bg-muted"
              >
                <Copy size={14} />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
