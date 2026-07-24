/**
 * Helpers for the auth HTTP routes.
 *
 * Session cookies previously had two gaps in the student app:
 *
 * - The `Secure` flag was never set, so production cookies would be
 *   sent over plain HTTP if the browser ever saw the site without TLS.
 * - The `Domain` attribute was always omitted, which is fine for a
 *   host-only cookie in production but made the logout path
 *   environment-dependent. Centralizing the logic here keeps the
 *   login and join routes in lockstep.
 *
 * `domain` is only included when `SESSION_COOKIE_DOMAIN` is set. This
 * avoids the previous fallback of `domain: 'localhost'`, which prevented
 * the cookie from being attached on the production host and silently
 * failed to clear cookies on logout.
 *
 * `getAllowedOrigin` mirrors the same fail-closed CORS pattern used in
 * the parent app: in production, `ACCESS_CONTROL_ALLOW_ORIGIN` MUST be
 * set; otherwise the helper throws rather than silently allowing a
 * localhost origin in the response.
 */

const DEV_ORIGIN_FALLBACK = 'http://localhost:3000';

export function getAllowedOrigin(): string {
  const allowedOrigin = process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
  if (!allowedOrigin) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ACCESS_CONTROL_ALLOW_ORIGIN must be set in production');
    }
    return process.env.DEV_ORIGIN || DEV_ORIGIN_FALLBACK;
  }
  return allowedOrigin;
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  domain?: string;
}

export function sessionCookieOptions(): SessionCookieOptions {
  const cookieDomain = process.env.SESSION_COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  };
}

