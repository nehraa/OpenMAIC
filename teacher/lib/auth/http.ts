/**
 * Helpers for the auth HTTP routes.
 *
 * `getAllowedOrigin` and `sessionCookieOptions` centralize the two
 * production-environment footguns the auth routes historically carried:
 *
 * - Falling back to `http://localhost:3001` for CORS when the deploy
 *   forgot to set `ACCESS_CONTROL_ALLOW_ORIGIN`. The browser would
 *   happily trust that origin in production, opening a cross-origin
 *   credentialed vector.
 * - Falling back to `domain: 'localhost'` on session cookies when the
 *   deploy forgot to set `SESSION_COOKIE_DOMAIN`. The browser would
 *   refuse to attach the cookie on the real production host, and the
 *   hardcoded `localhost` would silently fail to clear the cookie on
 *   logout.
 *
 * Both helpers now fail closed in production: if the env vars are
 * missing, the CORS helper throws and the cookie helper omits the
 * `domain` attribute (host-only cookie, which matches whichever host
 * served the response). In development, both helpers fall back to a
 * safe local default so contributors don't have to set env vars.
 */

const DEV_ORIGIN_FALLBACK = 'http://localhost:3000';

/**
 * Resolve the allowed origin for the auth routes.
 *
 * - In production: `ACCESS_CONTROL_ALLOW_ORIGIN` MUST be set. Throwing
 *   here is intentional — the OPTIONS preflight and the actual response
 *   will both surface the misconfiguration in logs rather than silently
 *   allowing a localhost origin.
 * - In development: fall back to `DEV_ORIGIN` if set, otherwise the
 *   loopback default above.
 */
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

/**
 * Build the cookie options for the session cookies.
 *
 * `domain` is only included when `SESSION_COOKIE_DOMAIN` is set. This
 * avoids the previous fallback of `domain: 'localhost'`, which prevented
 * the cookie from being attached on the production host and silently
 * failed to clear cookies on logout.
 */
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
