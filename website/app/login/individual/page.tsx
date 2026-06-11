'use client';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function IndividualLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('learner@aidu.tech');
  const [password, setPassword] = useState('demo123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userType: 'student' }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || 'Login failed');
        setLoading(false);
        return;
      }

      router.push('/dashboard/student');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-base flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral to-violet flex items-center justify-center">
            <span className="font-display font-bold text-white text-xl">A</span>
          </div>
          <span className="font-display font-bold text-2xl text-white">AIDU</span>
        </Link>

        <div className="bg-dark-card rounded-2xl border border-dark-line p-8">
          <h1 className="text-2xl font-display font-bold text-white mb-2">Welcome back, Learner</h1>
          <p className="text-slate-400 mb-8">Sign in to access your AI classroom</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark-surface border border-dark-line rounded-lg px-4 py-3 text-white placeholder:text-slate-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark-surface border border-dark-line rounded-lg px-4 py-3 text-white"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-line">
            <Button variant="secondary" className="w-full">Continue with Google</Button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Demo: learner@aidu.tech / demo123
          </p>
        </div>
      </div>
    </div>
  );
}