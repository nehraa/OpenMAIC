'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function StudentLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  // If the student is already logged in, skip the login form.
  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const res = await fetch('/student/api/auth/me', { credentials: 'include' })
        if (cancelled) return
        if (res.ok) {
          router.replace('/')
        }
      } catch {
        // Ignore — unauthenticated is the expected state on this page.
      } finally {
        if (!cancelled) setIsCheckingSession(false)
      }
    }

    checkSession()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const payload =
        mode === 'phone' ? { phone } : { email, password }

      const response = await fetch('/student/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        setError(mode === 'phone' ? 'No student found for that phone' : 'Invalid email or password')
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Login failed')
      }

      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    isSubmitting ||
    (mode === 'phone' ? phone.trim().length > 0 : email.trim().length > 0 && password.length > 0)

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to view your assignments and quizzes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCheckingSession ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'phone' ? (
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
                  <p className="text-xs text-muted-foreground">
                    Use the phone number you used when joining your class.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </>
              )}

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
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError('')
                    setMode(mode === 'phone' ? 'email' : 'phone')
                  }}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {mode === 'phone' ? 'Sign in with email + password' : 'Sign in with phone only'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Don&apos;t have an account?</p>
            <p>
              Ask your teacher for a class join code, then{' '}
              <Link href="/join" className="text-primary hover:underline font-medium">
                join a class
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
