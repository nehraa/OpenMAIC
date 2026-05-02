'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';

function GlassInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        className="glass-input w-full h-12 px-4 rounded-xl text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

export default function StudentLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3002/student/api/auth/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode, phone, name }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to join classroom' }));
        throw new Error(data.error || 'Failed to join classroom');
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('http://localhost:3002/student');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join classroom');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gradient-mesh p-8">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -right-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -left-24 w-56 h-56 rounded-full bg-primary/4 blur-3xl animate-float" style={{ animationDelay: '0.7s' }} />
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/')}
        className="absolute left-8 top-8 z-20 flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors duration-200 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
        <span>Back</span>
      </button>

      {/* Form card */}
      <div className={`relative z-10 w-full max-w-md ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} transition-all duration-500`}>
        <div className="glass-surface rounded-3xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-xl bg-primary/15 blur-md" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl glass-surface mx-auto">
                <Users size={28} className="text-primary/80" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Join Your Class</h1>
            <p className="text-sm text-muted-foreground/70">
              Enter your join code to access your classroom
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-surface rounded-xl p-4 border-red-500/20 bg-red-500/5 animate-scale-in">
              <p className="text-sm text-red-600/90 text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
              <GlassInput
                id="joinCode"
                label="Join Code"
                type="text"
                value={joinCode}
                onChange={(v) => setJoinCode(v.toUpperCase())}
                placeholder="e.g. ABC123"
                required
                autoFocus
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
              <GlassInput
                id="phone"
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+1234567890"
                required
              />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
              <GlassInput
                id="name"
                label="Your Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !joinCode.trim() || !phone.trim() || !name.trim()}
              className="btn-glow glass-surface relative w-full h-12 rounded-xl bg-primary/90 text-primary-foreground font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                Join Classroom
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
              {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
