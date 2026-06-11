'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ArrowLeft, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  teacherName: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

interface ErrorState {
  code: string;
  message: string;
}

export default function ClassJoinPage() {
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [joinedClass, setJoinedClass] = useState<ClassInfo | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError({ code: 'INVALID_INPUT', message: 'Please enter a valid 6-character invite code.' });
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch('/api/classes/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ joinCode: code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError({
          code: result.error?.code ?? 'SERVER_ERROR',
          message: result.error?.message ?? 'Something went wrong. Please try again.',
        });
        setStatus('error');
        return;
      }

      setJoinedClass({
        id: result.data.id,
        name: result.data.name,
        subject: result.data.subject,
        teacherName: result.data.teacher?.name ?? 'Your Teacher',
      });
      setStatus('success');
    } catch {
      setError({ code: 'NETWORK_ERROR', message: 'Unable to connect. Please check your connection.' });
      setStatus('error');
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'UNAUTHORIZED':
        return 'Please log in to join a class.';
      case 'NOT_FOUND':
        return 'Class not found. Check the invite code and try again.';
      case 'ALREADY_MEMBER':
        return 'You are already enrolled in this class.';
      case 'INVALID_INPUT':
        return 'Please enter a valid 6-character invite code.';
      case 'NETWORK_ERROR':
        return 'Unable to connect. Please check your connection.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div className="min-h-screen bg-dark-base">
      <header className="border-b border-dark-line bg-dark-surface">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard/student"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-12">
        {status === 'success' && joinedClass ? (
          <Card className="border-teal/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-teal/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-teal" />
              </div>
              <CardTitle className="text-2xl mb-2">Joined {joinedClass.name}</CardTitle>
              <CardDescription className="mb-6">
                You are now enrolled in {joinedClass.subject} with {joinedClass.teacherName}.
              </CardDescription>
              <Link href="/dashboard/student">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-coral" />
                <CardTitle>Join a Class</CardTitle>
              </div>
              <CardDescription>Enter the 6-character invite code from your teacher</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="joinCode">
                  Invite Code
                </label>
                <input
                  id="joinCode"
                  type="text"
                  value={joinCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setJoinCode(value);
                    if (status === 'error') {
                      setStatus('idle');
                      setError(null);
                    }
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-dark-base border border-dark-line rounded-lg text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-coral transition-colors"
                />
              </div>

              {status === 'error' && error && (
                <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-warning">{getErrorMessage(error.code)}</p>
                </div>
              )}

              <Button
                onClick={handleJoin}
                disabled={status === 'loading' || joinCode.length === 0}
                className="w-full"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  'Join Class'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}