'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthError {
  message: string;
}

function GlassInput({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
  autoFocus,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  autoFocus?: boolean;
  minLength?: number;
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
        minLength={minLength}
        className="glass-input w-full h-12 px-4 rounded-xl text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  );
}

export default function TeacherLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
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
      const endpoint = isSignup
        ? 'http://localhost:3002/teacher/api/auth/signup'
        : 'http://localhost:3002/teacher/api/auth/login';
      const body = isSignup
        ? { name, email, phone, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Authentication failed' }));
        throw new Error(data.error || 'Authentication failed');
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('http://localhost:3002/teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gradient-mesh p-8">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 -right-24 w-56 h-56 rounded-full bg-primary/4 blur-3xl animate-float" style={{ animationDelay: '0.5s' }} />
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
                <GraduationCap size={28} className="text-primary/80" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-muted-foreground/70">
              {isSignup
                ? 'Set up your teacher account to get started'
                : 'Sign in to access your dashboard'}
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
            {isSignup && (
              <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
                <GlassInput
                  id="name"
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Enter your full name"
                  required
                  autoFocus
                />
              </div>
            )}

            <div className="animate-fade-up" style={{ animationDelay: isSignup ? '100ms' : '50ms' }}>
              <GlassInput
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                required
                autoFocus={!isSignup}
              />
            </div>

            {isSignup && (
              <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
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
            )}

            <div className="animate-fade-up" style={{ animationDelay: isSignup ? '200ms' : '100ms' }}>
              <GlassInput
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder={isSignup ? 'Minimum 8 characters' : 'Enter your password'}
                required
                minLength={8}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim() || (isSignup && (!name.trim() || !phone.trim()))}
              className="btn-glow glass-surface relative w-full h-12 rounded-xl bg-primary/90 text-primary-foreground font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up"
              style={{ animationDelay: '250ms' }}
            >
              <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                {isSignup ? 'Create Account' : 'Sign In'}
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

          {/* Toggle mode */}
          <p className="text-center text-sm text-muted-foreground/60 animate-fade-up" style={{ animationDelay: '300ms' }}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary/70 hover:text-primary font-medium transition-colors duration-200"
            >
              {isSignup ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
