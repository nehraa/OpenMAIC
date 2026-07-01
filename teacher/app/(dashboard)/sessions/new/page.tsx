'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ClassItem {
  id: string
  name: string
  subject?: string
}

interface SessionConfig {
  classId: string
  title: string
  duration: number
  maxParticipants: number
  aiTeacherEnabled: boolean
  aiClassmatesCount: number
  enableWhiteboard: boolean
  enableChat: boolean
}

export default function NewSessionPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [config, setConfig] = useState<SessionConfig>({
    classId: '',
    title: '',
    duration: 45,
    maxParticipants: 30,
    aiTeacherEnabled: true,
    aiClassmatesCount: 3,
    enableWhiteboard: true,
    enableChat: true,
  })
  const [isLaunching, setIsLaunching] = useState(false)

  useEffect(() => {
    fetch('/teacher/api/teacher/classes', { credentials: 'include' })
      .then(res => res.ok ? res.json() : { classes: [] })
      .then(data => setClasses(data.classes || []))
      .catch(() => {})
      .finally(() => setClassesLoading(false))
  }, [])

  const handleLaunch = async () => {
    setIsLaunching(true)
    try {
      const response = await fetch('/teacher/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const { sessionId } = await response.json()
      router.push(`/sessions/${sessionId}`)
    } catch (error) {
      console.error('Failed to launch session:', error)
      setIsLaunching(false)
    }
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Launch Live Session</h1>
        <p className="text-muted-foreground">
          Configure and start a real-time classroom
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select
              value={config.classId}
              onValueChange={(classId) => setConfig({ ...config, classId })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classesLoading ? (
                  <SelectItem value="_loading" disabled>Loading classes...</SelectItem>
                ) : classes.length === 0 ? (
                  <SelectItem value="_none" disabled>No classes found — create one first</SelectItem>
                ) : (
                  classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.subject ? ` — ${c.subject}` : ''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Session Title</Label>
            <Input
              id="title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="e.g., Quadratic Equations - Live Practice"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={String(config.duration)}
                onValueChange={(v) => setConfig({ ...config, duration: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participants">Max Participants</Label>
              <Select
                value={String(config.maxParticipants)}
                onValueChange={(v) => setConfig({ ...config, maxParticipants: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 students</SelectItem>
                  <SelectItem value="20">20 students</SelectItem>
                  <SelectItem value="30">30 students</SelectItem>
                  <SelectItem value="50">50 students</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">AI Configuration</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>AI Teacher</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered teaching assistant
                </p>
              </div>
              <Switch
                checked={config.aiTeacherEnabled}
                onCheckedChange={(aiTeacherEnabled) => setConfig({ ...config, aiTeacherEnabled })}
              />
            </div>

            <div className="mt-4">
              <Label>AI Classmates</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Number of AI students in the session
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 5].map((count) => (
                  <Button
                    key={count}
                    variant={config.aiClassmatesCount === count ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfig({ ...config, aiClassmatesCount: count })}
                  >
                    {count}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Session Features</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Interactive Whiteboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable real-time collaborative drawing
                  </p>
                </div>
                <Switch
                  checked={config.enableWhiteboard}
                  onCheckedChange={(enableWhiteboard) => setConfig({ ...config, enableWhiteboard })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Chat</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable session chat
                  </p>
                </div>
                <Switch
                  checked={config.enableChat}
                  onCheckedChange={(enableChat) => setConfig({ ...config, enableChat })}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleLaunch}
            disabled={!config.classId || !config.title || isLaunching}
          >
            {isLaunching ? 'Launching...' : 'Launch Session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}