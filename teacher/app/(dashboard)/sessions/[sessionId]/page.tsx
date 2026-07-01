'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import WaitingRoom from '@/components/session/WaitingRoom'
import { ArrowLeft, Play, Users, Clock, MessageSquare, Pen } from 'lucide-react'

interface SessionData {
  id: string
  class_id: string
  title: string
  status: 'waiting' | 'live' | 'ended'
  max_duration_minutes: number
  created_at: string
  config?: string
}

interface Participant {
  id: string
  name: string
  type: 'student' | 'ai'
  joined_at: string
}

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionData | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/teacher/api/sessions/${sessionId}`)
        if (res.ok) {
          const data = await res.json()
          setSession(data.session)
          setParticipants(data.participants || [])
        }
      } catch (err) {
        console.error('Failed to fetch session:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [sessionId])

  const handleStart = async () => {
    try {
      const res = await fetch(`/teacher/api/sessions/${sessionId}/start`, {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        setSession((prev) => prev ? { ...prev, status: 'live' as const } : prev)
      }
    } catch (err) {
      console.error('Failed to start session:', err)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading session...</div>
  if (!session) return <div className="p-8 text-destructive">Session not found</div>

  const config = session.config ? JSON.parse(session.config) : {}

  return (
    <div className="container py-8 max-w-4xl">
      {/* Back nav */}
      <Link
        href="/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={14} /> Back to Sessions
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{session.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock size={14} /> {session.max_duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} /> {config.maxParticipants || 30} max
            </span>
            {config.enableWhiteboard && (
              <span className="flex items-center gap-1">
                <Pen size={14} /> Whiteboard
              </span>
            )}
            {config.enableChat && (
              <span className="flex items-center gap-1">
                <MessageSquare size={14} /> Chat
              </span>
            )}
          </div>
        </div>
        <Badge
          variant={
            session.status === 'live'
              ? 'default'
              : session.status === 'ended'
                ? 'secondary'
                : 'outline'
          }
          className={
            session.status === 'live'
              ? 'bg-green-600 hover:bg-green-700'
              : session.status === 'ended'
                ? ''
                : 'border-yellow-500 text-yellow-600'
          }
        >
          {session.status.toUpperCase()}
        </Badge>
      </div>

      {/* Main content — two columns on wider screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting room — shown for the pre-live state */}
        {session.status === 'waiting' && (
          <div className="lg:col-span-2">
            <WaitingRoom
              sessionId={session.id}
              participants={participants}
              maxParticipants={config.maxParticipants || 30}
              onStart={handleStart}
            />
          </div>
        )}

        {/* AI config card */}
        {(config.aiTeacherEnabled || config.aiClassmatesCount > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.aiTeacherEnabled && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Teacher</span>
                  <Badge variant="secondary">Enabled</Badge>
                </div>
              )}
              {config.aiClassmatesCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">AI Classmates</span>
                  <Badge variant="outline">{config.aiClassmatesCount} AI students</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Progress card — links to progress page */}
        {session.status === 'live' && (
          <Card>
            <CardHeader>
              <CardTitle>Session Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View real-time participant progress and questions.
              </p>
              <Link href={`/sessions/${sessionId}/progress`}>
                <Button className="w-full">
                  <Play size={14} className="mr-2" /> Open Progress Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Ended state */}
        {session.status === 'ended' && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">This session has ended</p>
              <p className="text-sm text-muted-foreground mt-1">
                Created {new Date(session.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
