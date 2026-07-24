'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Public cross-domain handoff from openmaic.devstudios.me. The API validates
// the shared auth_sessions row, plants a student-domain JWT cookie, then this
// page moves to the student dashboard.
export default function StudentSsoPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Missing token. Return to OpenMAIC and join your classroom again.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/student/api/auth/sso?token=${encodeURIComponent(token)}`);
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `SSO failed (HTTP ${response.status})`);
        }
        const data = (await response.json()) as {
          session_id: string;
          user: { id: string; role: string; name: string };
        };
        if (cancelled) return;
        localStorage.setItem('session_id', data.session_id);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.replace('/');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'SSO failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
        {error ? (
          <>
            <h1 className="text-xl font-bold mb-3">Sign-in failed</h1>
            <p className="text-sm text-red-600 mb-5">{error}</p>
            <a
              href="https://openmaic.devstudios.me/login/student"
              className="inline-block rounded-lg bg-primary px-5 py-3 text-white font-semibold"
            >
              Return to student login
            </a>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            <p className="text-gray-600">Signing you in…</p>
          </>
        )}
      </div>
    </div>
  );
}
