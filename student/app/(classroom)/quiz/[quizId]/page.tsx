'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react'

// The /api/student/quizzes/[id] GET response. Kept loose on the client because
// the API zod-validates before responding; we trust the shape but type it
// for editor support.
interface ClientQuestion {
  id: string
  type: 'mcq' | 'short_answer' | 'multiple_choice' | 'true_false'
  question: string
  options?: string[]
  points: number
}

interface QuizResponse {
  assignmentId: string
  title: string
  questions: ClientQuestion[]
  timeLimit: number
  attempt: {
    submitted: boolean
    score: number | null
    submittedAt: string | null
  } | null
}

interface GradedQuestion {
  id: string
  type: ClientQuestion['type']
  pointsEarned: number
  totalPoints: number
  isCorrect: boolean
  openEnded: boolean
}

interface SubmitResponse {
  attemptId: string
  scorePercent: number
  pointsEarned: number
  totalPoints: number
  results: GradedQuestion[]
}

type AnswerValue = string | number | boolean | null
type AnswersMap = Record<string, AnswerValue>

interface QuizState {
  currentQuestion: number
  answers: AnswersMap
  timeRemaining: number
  submitted: boolean
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = (params.quizId as string) || ''

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    timeRemaining: 0,
    submitted: false,
  })

  const [result, setResult] = useState<SubmitResponse | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ---- Fetch the quiz definition on mount ----------------------------------
  useEffect(() => {
    let cancelled = false
    if (!quizId) {
      setLoadError('Missing quiz id')
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    fetch(`/student/api/student/quizzes/${quizId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed (${res.status})`)
        }
        return res.json() as Promise<QuizResponse>
      })
      .then((data) => {
        if (cancelled) return
        setQuiz(data)
        setState((prev) => ({
          ...prev,
          timeRemaining: data.timeLimit,
        }))
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load quiz')
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [quizId])

  // ---- Submit helper (used by timer auto-submit and the manual button) ----
  const handleSubmit = useCallback(async () => {
    if (!quiz || state.submitted || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`/student/api/student/quizzes/${quizId}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: state.answers }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Submit failed (${res.status})`)
      }
      const data = (await res.json()) as SubmitResponse
      setResult(data)
      setState((prev) => ({ ...prev, submitted: true }))
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }, [quiz, quizId, state.answers, state.submitted, isSubmitting])

  // ---- Countdown timer -----------------------------------------------------
  useEffect(() => {
    if (!quiz) return
    if (state.submitted) return
    if (state.timeRemaining <= 0) {
      void handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setState((prev) =>
        prev.submitted ? prev : { ...prev, timeRemaining: prev.timeRemaining - 1 }
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [quiz, state.submitted, state.timeRemaining, handleSubmit])

  // ---- Render: loading / error --------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Loading quiz…</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button className="mt-4" variant="outline" onClick={() => router.push('/assignments')}>
            Back to Assignments
          </Button>
        </div>
      </div>
    )
  }

  if (!quiz) return null

  // ---- Render: submitted results ------------------------------------------
  if (state.submitted && result) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-6xl font-bold">{result.scorePercent}%</p>
                <p className="text-muted-foreground mt-2">
                  {result.pointsEarned} out of {result.totalPoints} points
                </p>
                <p
                  className={`text-lg font-semibold mt-2 ${
                    result.scorePercent >= 70 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {result.scorePercent >= 70 ? 'Great job!' : 'Keep practicing!'}
                </p>
              </div>

              <div className="space-y-2">
                {quiz.questions.map((q, i) => {
                  const r = result.results.find((x) => x.id === q.id)
                  const isCorrect = r?.isCorrect ?? false
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border ${
                        isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <p className="text-sm font-medium">
                        Question {i + 1}: {isCorrect ? 'Correct' : 'Incorrect'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your answer:{' '}
                        {state.answers[q.id] !== undefined && state.answers[q.id] !== null
                          ? String(state.answers[q.id])
                          : 'Not answered'}
                        {r ? ` (${r.pointsEarned}/${r.totalPoints} pts)` : ''}
                      </p>
                    </div>
                  )
                })}
              </div>

              <Button className="w-full" onClick={() => router.push('/assignments')}>
                Back to Assignments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ---- Render: in-progress quiz -------------------------------------------
  const currentQ = quiz.questions[state.currentQuestion]
  const total = quiz.questions.length
  const progress = ((state.currentQuestion + 1) / total) * 100
  const answeredCount = Object.keys(state.answers).length
  const allAnswered = answeredCount === total

  const setAnswer = (questionId: string, value: AnswerValue) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/assignments')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h1 className="font-semibold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {state.currentQuestion + 1} of {total}
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 ${
              state.timeRemaining < 60 ? 'text-red-500' : ''
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(state.timeRemaining)}</span>
          </div>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQ.type === 'short_answer' ? (
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={(state.answers[currentQ.id] as string) ?? ''}
                onChange={(e) => setAnswer(currentQ.id, e.target.value)}
                placeholder="Type your answer…"
              />
            ) : currentQ.type === 'true_false' ? (
              <RadioGroup
                value={
                  state.answers[currentQ.id] === undefined
                    ? ''
                    : String(state.answers[currentQ.id])
                }
                onValueChange={(value) =>
                  setAnswer(currentQ.id, value === 'true')
                }
              >
                <div className="space-y-3">
                  {['True', 'False'].map((label, i) => {
                    const boolValue = i === 0
                    return (
                      <div
                        key={label}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                        onClick={() => setAnswer(currentQ.id, boolValue)}
                      >
                        <RadioGroupItem value={String(boolValue)} id={`option-${i}`} />
                        <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                          {label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </RadioGroup>
            ) : (
              <RadioGroup
                value={
                  state.answers[currentQ.id] === undefined
                    ? ''
                    : String(state.answers[currentQ.id])
                }
                onValueChange={(value) => {
                  // The server accepts either an option text or an index string.
                  // Send the option text so the API can match against correct
                  // option text for backward-compat with AI format payloads.
                  setAnswer(currentQ.id, value)
                }}
              >
                <div className="space-y-3">
                  {(currentQ.options ?? []).map((option, i) => (
                    <div
                      key={`${currentQ.id}-${i}`}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => setAnswer(currentQ.id, option)}
                    >
                      <RadioGroupItem value={option} id={`option-${i}`} />
                      <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() =>
              setState((prev) => ({
                ...prev,
                currentQuestion: Math.max(prev.currentQuestion - 1, 0),
              }))
            }
            disabled={state.currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {state.currentQuestion < total - 1 ? (
            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  currentQuestion: Math.min(prev.currentQuestion + 1, total - 1),
                }))
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => void handleSubmit()}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Submit Quiz'}
            </Button>
          )}
        </div>

        {submitError && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {state.timeRemaining < 60 && state.timeRemaining > 0 && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Less than a minute remaining! Submit your answers soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {quiz.questions.map((q, i) => (
            <Button
              key={q.id}
              variant={state.answers[q.id] !== undefined ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setState((prev) => ({ ...prev, currentQuestion: i }))
              }
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
