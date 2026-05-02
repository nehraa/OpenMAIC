'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft, Loader2 } from 'lucide-react';

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

export default function IndividualLoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Set role cookie and redirect to core app
    document.cookie = `aidutech_role=individual; path=/; domain=localhost; max-age=${60 * 60 * 24 * 30}`;
    document.cookie = `aidutech_name=${encodeURIComponent(name)}; path=/; domain=localhost; max-age=${60 * 60 * 24 * 30}`;

    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('http://localhost:3000/');
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden gradient-mesh p-8">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute bottom-1/3 -right-28 w-60 h-60 rounded-full bg-primary/4 blur-3xl animate-float" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/3 blur-3xl" />
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
                <User size={28} className="text-primary/80" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Start Learning</h1>
            <p className="text-sm text-muted-foreground/70">
              Enter your name to access your personal AI workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
              <GlassInput
                id="name"
                label="Your Name"
                type="text"
                value={name}
                onChange={setName}
                placeholder="Enter your full name"
                required
                autoFocus
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="btn-glow glass-surface relative w-full h-12 rounded-xl bg-primary/90 text-primary-foreground font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed animate-fade-up"
              style={{ animationDelay: '100ms' }}
            >
              <span className={`flex items-center justify-center gap-2 transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                Begin Journey
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
