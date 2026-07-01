'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  ExternalLink,
  FileQuestion,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AssignmentInfo {
  id: string
  title: string
  description: string | null
  class_name: string
  due_at: string | null
  status: string
  openmaicUrl: string | null
}

interface Slide {
  slide_id: string
  title: string
  content: string
  index: number
  viewed: boolean
  viewed_at: string | null
}

interface Progress {
  viewed_count: number
  total_slides: number
  is_complete: boolean
}

interface Attempt {
  completion_state: string
  submitted_at: string | null
  score_percent: number | null
}

interface AssignmentDetailResponse {
  assignment: AssignmentInfo
  slides: Slide[]
  progress: Progress
  attempt: Attempt | null
}

function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return 'No due date'
  const due = new Date(dueAt)
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export default function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = use(params)
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/student/assignments/${assignmentId}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `Request failed with status ${res.status}`)
        }
        const data = (await res.json()) as AssignmentDetailResponse
        if (cancelled) return
        setAssignment(data.assignment)
        setSlides(Array.isArray(data.slides) ? data.slides : [])
        setProgress(data.progress)
        setAttempt(data.attempt)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assignment')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [assignmentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading assignment...</span>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">
              {error ?? 'Assignment not found'}
            </p>
            <Link
              href="/assignments"
              className="text-primary hover:underline font-medium"
            >
              Back to Assignments
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasQuiz = Boolean(progress) || Boolean(attempt)
  const attemptState = attempt?.completion_state
  const isSubmitted = attemptState === 'submitted' || attemptState === 'graded'
  const hasOpenmaicUrl = Boolean(assignment.openmaicUrl)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-12">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/assignments"
                className="text-muted-foreground hover:text-foreground transition shrink-0"
                aria-label="Back to assignments"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-bold truncate">{assignment.title}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  {assignment.class_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Clock className="w-4 h-4" />
              <span>{formatDueDate(assignment.due_at)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {assignment.description && (
          <Card>
            <CardContent className="py-5">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {assignment.description}
              </p>
            </CardContent>
          </Card>
        )}

        {hasOpenmaicUrl ? (
          <Card>
            <CardContent className="py-5">
              <a
                href={assignment.openmaicUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 h-12 px-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Open in OpenMAIC
              </a>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This assignment opens in the OpenMAIC classroom.
              </p>
            </CardContent>
          </Card>
        ) : slides.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Slides</h2>
              {progress?.is_complete && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  Slides completed
                </span>
              )}
            </div>

            {slides.map((slide, index) => (
              <Card key={slide.slide_id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Slide {index + 1} of {slides.length}
                      </p>
                      <h3 className="text-lg font-semibold mt-0.5">
                        {slide.title || `Slide ${index + 1}`}
                      </h3>
                    </div>
                    {slide.viewed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 shrink-0">
                        <CheckCircle className="w-4 h-4" />
                        Viewed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600 shrink-0">
                        <Circle className="w-4 h-4" />
                        Not viewed
                      </span>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-foreground">
                      {slide.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {hasQuiz && (
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <FileQuestion className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold">
                      {isSubmitted ? 'Quiz submitted' : 'Take the quiz'}
                    </h2>
                    {isSubmitted && attempt?.score_percent !== null && attempt?.score_percent !== undefined ? (
                      <p className="text-sm text-muted-foreground">
                        Score: {attempt.score_percent}%
                        {attempt.submitted_at && (
                          <>
                            {' '}
                            &middot; submitted{' '}
                            {new Date(attempt.submitted_at).toLocaleDateString()}
                          </>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Test what you learned from the slides.
                      </p>
                    )}
                  </div>
                </div>
                <Link
                  href={`/quiz/${assignment.id}`}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors"
                >
                  {isSubmitted ? 'Retake Quiz' : 'Take Quiz'}
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/assignments"
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            &larr; Back to Assignments
          </Link>
        </div>
      </main>
    </div>
  )
}
