'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already logged in via localStorage session
    const sessionId = localStorage.getItem('session_id');
    if (sessionId) {
      // Validate session with API then redirect to teacher dashboard
      fetch('/teacher/api/auth/me', {
        headers: { 'x-session-id': sessionId }
      }).then(res => {
        if (res.ok) {
          router.push('/teacher');
        } else {
          localStorage.removeItem('session_id');
          localStorage.removeItem('user');
        }
      }).catch(() => {
        localStorage.removeItem('session_id');
        localStorage.removeItem('user');
      });
    }
  }, [router]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/teacher/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store session for client-side auth
      if (data.session_id) {
        localStorage.setItem('session_id', data.session_id);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      router.push('/teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  // Simple login form for testing - in production this would be more polished
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>Teacher Login</h1>

        {error && (
          <div style={{ padding: '0.75rem', background: '#fee', color: '#c00', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          const email = (e.target as any).email.value;
          const password = (e.target as any).password.value;
          handleLogin(email, password);
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem' }}
              placeholder="teacher@example.com"
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem' }}
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#ccc' : '#722ed1',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          Or continue via the{' '}
          <a href="/" style={{ color: '#722ed1', textDecoration: 'underline' }}>main app</a>
        </p>
      </div>
    </div>
  );
}