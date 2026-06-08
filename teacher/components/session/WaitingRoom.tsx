'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

interface Participant {
  id: string
  name: string
  avatar?: string
  type: 'student' | 'ai'
  joinedAt?: string
}

interface WaitingRoomProps {
  sessionId: string
  participants: Participant[]
  maxParticipants: number
  onStart: () => void
}

export default function WaitingRoom({
  sessionId,
  participants,
  maxParticipants,
  onStart,
}: WaitingRoomProps) {
  const spotsRemaining = maxParticipants - participants.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Waiting Room</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining • {participants.length}/{maxParticipants}
            </p>
          </div>
          <div className="text-sm font-mono text-muted-foreground">
            {sessionId.slice(0, 16)}...
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {participants.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {participants.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border",
                  p.type === 'ai' && "bg-purple-50 border-purple-200"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                  p.type === 'ai' ? "bg-purple-100 text-purple-700" : "bg-primary/10 text-primary"
                )}>
                  {p.name[0]?.toUpperCase() || <User size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    p.type === 'ai' ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
                  )}>
                    {p.type === 'ai' ? 'AI' : 'Student'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No participants yet. Share the session link with your class.</p>
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={onStart}
          disabled={participants.length === 0}
        >
          Start Session
        </Button>
      </CardContent>
    </Card>
  )
}
