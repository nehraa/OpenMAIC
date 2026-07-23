'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function JoinClassPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsJoining(true)

    try {
      const response = await fetch('/student/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: inviteCode, phone, name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join class')
      }

      const data = await response.json()
      const classId = data?.class?.id
      // Root path renders the student dashboard (app/page.tsx). The previous
      // /dashboard?joined=... target 404'd because no /dashboard route exists.
      router.push(`/?joined=${classId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code')
      setIsJoining(false)
    }
  }

  const canSubmit =
    inviteCode.length >= 6 &&
    phone.trim().length > 0 &&
    name.trim().length > 0 &&
    !isJoining

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join a Class</CardTitle>
          <CardDescription>
            Enter the invite code from your teacher to join a class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                className="text-center text-2xl tracking-widest font-mono"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (E.164, e.g. +15551234567)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+15551234567"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!canSubmit}
            >
              {isJoining ? 'Joining...' : 'Join Class'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don't have an invite code?</p>
            <p>Ask your teacher for one.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
