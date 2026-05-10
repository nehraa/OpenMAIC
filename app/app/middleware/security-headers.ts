import { NextResponse } from 'next/server';

/**
 * Security headers to apply to all API responses
 */
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
} as const;

/**
 * Adds security headers to a NextResponse object.
 * Use this to wrap all API responses with security headers.
 *
 * @example
 * const response = NextResponse.json({ data: 'value' });
 * return addSecurityHeaders(response);
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Creates a NextResponse with security headers already applied.
 * Useful for one-liner responses.
 *
 * @example
 * return securityJson({ data: 'value' }, 200);
 */
export function securityJson(
  data: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(data, init);
  return addSecurityHeaders(response);
}
