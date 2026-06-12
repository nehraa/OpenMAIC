'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}

interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  timeLimit: number // minutes
}

const MOCK_QUIZ: Quiz = {
  id: 'quiz-1',
  title: 'Mathematics Quiz - Quadratic Equations',
  timeLimit: 15,
  questions: [
    {
      id: 'q1',
      question: 'What is the standard form of a quadratic equation?',
      options: ['ax + b = 0', 'ax² + bx + c = 0', 'ax³ + bx² + cx + d = 0', 'a/x = b'],
      correctAnswer: 'ax² + bx + c = 0',
    },
    {
      id: 'q2',
      question: 'What is the discriminant in a quadratic equation?',
      options: ['b² - 4ac', 'b² + 4ac', 'b - 4ac', 'b + 4ac'],
      correctAnswer: 'b² - 4ac',
    },
    {
      id: 'q3',
      question: 'If discriminant > 0, the equation has:',
      options: ['One real root', 'Two real roots', 'No real roots', 'Complex roots'],
      correctAnswer: 'Two real roots',
    },
    {
      id: 'q4',
      question: 'The vertex of a parabola represents:',
      options: ['Axis of symmetry', 'Maximum or minimum point', 'Y-intercept', 'X-intercept'],
      correctAnswer: 'Maximum or minimum point',
    },
    {
      id: 'q5',
      question: 'Formula for quadratic roots is:',
      options: ['x = -b ± √(b²-4ac) / 2a', 'x = -b ± √(b²+4ac) / 2a', 'x = b ± √(b²-4ac) / 2a', 'x = -b ± √(b²-4ac) / a'],
      correctAnswer: 'x = -b ± √(b²-4ac) / 2a',
    },
  ],
}

interface QuizState {
  currentQuestion: number
  answers: Record<string, string>
  timeRemaining: number
  submitted: boolean
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const _quizId = (params.quizId as string) || ''

  const [state, setState] = useState<QuizState>({
    currentQuestion: 0,
    answers: {},
    timeRemaining: MOCK_QUIZ.timeLimit * 60,
    submitted: false,
  })

  const [score, setScore] = useState<{ correct: number; total: number } | null>(null)

  useEffect(() => {
    if (state.submitted || state.timeRemaining <= 0) return

    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeRemaining: prev.timeRemaining - 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [state.submitted, state.timeRemaining])

  const handleAnswer = (questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }))
  }

  const handleNext = () => {
    setState((prev) => ({
      ...prev,
      currentQuestion: Math.min(prev.currentQuestion + 1, MOCK_QUIZ.questions.length - 1),
    }))
  }

  const handlePrev = () => {
    setState((prev) => ({
      ...prev,
      currentQuestion: Math.max(prev.currentQuestion - 1, 0),
    }))
  }

  const handleSubmit = () => {
    if (!confirm('Are you sure you want to submit? You cannot change your answers.')) {
      return
    }

    let correct = 0
    for (const q of MOCK_QUIZ.questions) {
      if (state.answers[q.id] === q.correctAnswer) {
        correct++
      }
    }
    setScore({ correct, total: MOCK_QUIZ.questions.length })
    setState((prev) => ({ ...prev, submitted: true }))
  }

  const currentQ = MOCK_QUIZ.questions[state.currentQuestion]
  const progress = ((state.currentQuestion + 1) / MOCK_QUIZ.questions.length) * 100
  const answeredCount = Object.keys(state.answers).length
  const allAnswered = answeredCount === MOCK_QUIZ.questions.length

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (state.submitted && score) {
    const percentage = Math.round((score.correct / score.total) * 100)

    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl">Quiz Complete!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-6xl font-bold">{percentage}%</p>
                <p className="text-muted-foreground mt-2">
                  {score.correct} out of {score.total} correct
                </p>
                <p className={`text-lg font-semibold mt-2 ${percentage >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                  {percentage >= 70 ? 'Great job!' : 'Keep practicing!'}
                </p>
              </div>

              <div className="space-y-2">
                {MOCK_QUIZ.questions.map((q, i) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border ${
                      state.answers[q.id] === q.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }`}
                  >
                    <p className="text-sm font-medium">Question {i + 1}: {state.answers[q.id] === q.correctAnswer ? 'Correct' : 'Incorrect'}</p>
                    <p className="text-xs text-muted-foreground">Your answer: {state.answers[q.id] || 'Not answered'}</p>
                  </div>
                ))}
              </div>

              <Button className="w-full" onClick={() => router.back()}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
            <div>
              <h1 className="font-semibold">{MOCK_QUIZ.title}</h1>
              <p className="text-sm text-muted-foreground">
                Question {state.currentQuestion + 1} of {MOCK_QUIZ.questions.length}
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-2 ${state.timeRemaining < 60 ? 'text-red-500' : ''}`}>
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
            <RadioGroup
              value={state.answers[currentQ.id] || ''}
              onValueChange={(value) => handleAnswer(currentQ.id, value)}
            >
              <div className="space-y-3">
                {currentQ.options.map((option, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleAnswer(currentQ.id, option)}
                  >
                    <RadioGroupItem value={option} id={`option-${i}`} />
                    <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={state.currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {state.currentQuestion < MOCK_QUIZ.questions.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
            >
              Submit Quiz
            </Button>
          )}
        </div>

        {state.timeRemaining < 60 && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Less than a minute remaining! Submit your answers soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 flex justify-center gap-2">
          {MOCK_QUIZ.questions.map((q, i) => (
            <Button
              key={q.id}
              variant={state.answers[q.id] ? 'default' : 'outline'}
              size="sm"
              onClick={() => setState((prev) => ({ ...prev, currentQuestion: i }))}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}