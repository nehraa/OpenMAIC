'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Clock, Users } from 'lucide-react'

interface SessionRow {
  id: string
  class_id: string
  title: string
  status: 'waiting' | 'live' | 'ended'
  max_duration_minutes: number
  created_at: string
  config?: string
}

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-600 hover:bg-green-700'
      case 'waiting': return 'border-yellow-500 text-yellow-600'
      case 'ended': return 'bg-gray-200 text-gray-600'
      default: return ''
    }
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Live Sessions</h1>
          <p className="text-muted-foreground">Manage your classroom sessions</p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus size={16} className="mr-2" /> New Session
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No sessions yet</p>
            <Link href="/sessions/new">
              <Button>
                <Plus size={16} className="mr-2" /> Create your first session
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const config = s.config ? JSON.parse(s.config) : {}
            return (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="block"
              >
                <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold truncate">{s.title}</h3>
                        <Badge
                          variant={s.status === 'waiting' ? 'outline' : 'default'}
                          className={statusColor(s.status)}
                        >
                          {s.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {s.max_duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {config.maxParticipants || 30}
                        </span>
                        <span>
                          {new Date(s.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {s.status === 'waiting' && (
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.preventDefault()
                        window.location.href = `/sessions/${s.id}`
                      }}>
                        <Play size={14} className="mr-1" /> Launch
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
