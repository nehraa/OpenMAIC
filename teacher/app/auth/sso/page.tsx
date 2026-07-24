'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Public handoff page. The parent login redirects to
// `/teacher/auth/sso?token=<auth_sessions-id>`; this page validates the token via
// `/api/auth/sso`, plants the same `session_id` and `user` the standalone
// login form would have, then jumps to the library.
//
// Public path — middleware in teacher/middleware.ts allows it through
// without a cookie so the redirect chain can complete.
export default function SsoPage() {
  return (
    <Suspense fallback={<SsoFallback />}>
      <SsoPageInner />
    </Suspense>
  );
}

function SsoFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: '2rem', height: '2rem', border: '3px solid #ddd', borderTopColor: '#722ed1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#666' }}>Signing you in…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

function SsoPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Missing token. Open the teacher app directly to log in.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/teacher/api/auth/sso?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `SSO failed (HTTP ${res.status})`);
        }
        const data = (await res.json()) as {
          session_id: string;
          user: { id: string; role: string; name: string };
        };

        if (cancelled) return;
        localStorage.setItem('session_id', data.session_id);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'SSO failed');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        {error ? (
          <>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Sign-in failed</h1>
            <p style={{ color: '#c00', fontSize: '0.875rem', marginBottom: '1.25rem' }}>{error}</p>
            <a
              href="login/teacher"
              style={{ display: 'inline-block', padding: '0.75rem 1.25rem', background: '#722ed1', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}
            >
              Go to teacher login
            </a>
          </>
        ) : (
          <>
            <div style={{ width: '2rem', height: '2rem', border: '3px solid #ddd', borderTopColor: '#722ed1', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#666' }}>Signing you in…</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </>
        )}
      </div>
    </div>
  );
}
