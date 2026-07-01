'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardList, ArrowRight, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Assignment {
  id: string
  title: string
  class_name: string
  due_at: string | null
  status: 'pending' | 'in_progress' | 'completed'
  score_percent: number | null
  submitted_at: string | null
}

function formatDueDate(dueAt: string | null): string {
  if (!dueAt) return 'No due date'
  const due = new Date(dueAt)
  return `Due ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" />
        Completed
      </span>
    )
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Clock className="w-3 h-3" />
        In Progress
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <Clock className="w-3 h-3" />
      Not started
    </span>
  )
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/student/api/student/assignments', {
          credentials: 'include',
        })
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setAssignments(Array.isArray(data.assignments) ? data.assignments : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load assignments')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">My Assignments</h1>
            <p className="text-sm text-muted-foreground">
              Work released by your teacher
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading assignments...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-8 text-center text-destructive">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try refreshing the page.
              </p>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">No assignments yet</h2>
              <p className="text-muted-foreground">
                No assignments yet — join a class with a code from your teacher.
              </p>
              <Link
                href="/join"
                className="inline-flex items-center justify-center mt-6 h-10 px-4 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
              >
                Join a class
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/assignments/${assignment.id}`}
                className="block"
              >
                <Card className="hover:border-primary/40 hover:shadow-md transition-all">
                  <CardContent className="py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg truncate">
                            {assignment.title}
                          </h3>
                          <StatusBadge status={assignment.status} />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {assignment.class_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span>{formatDueDate(assignment.due_at)}</span>
                          {assignment.score_percent !== null && (
                            <span className="text-primary font-medium">
                              Score: {assignment.score_percent}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary font-medium shrink-0 mt-1">
                        <span className="text-sm">
                          {assignment.status === 'completed' ? 'Review' : 'Open'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
