import { getDb } from '../db';

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const RETRY_AFTER_SECONDS = 900;

export type AuthEndpoint = 'login' | 'signup' | 'verify-otp';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/**
 * Get the client IP address from the request.
 * Handles proxies and load balancers via X-Forwarded-For header.
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback - this shouldn't happen in production behind a proxy
  return '127.0.0.1';
}

/**
 * Check and update rate limit for an auth endpoint.
 * Uses a sliding window approach with max 5 attempts per 15 minutes.
 *
 * @param request - The incoming request
 * @param endpoint - The auth endpoint being accessed
 * @returns RateLimitResult with allowed status and retry info
 */
export async function checkRateLimit(
  request: Request,
  endpoint: AuthEndpoint
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const db = getDb();
  const now = new Date();

  const result = await db.query(
    `SELECT request_count, reset_at FROM auth_rate_limits
     WHERE ip_address = $1 AND endpoint = $2`,
    [ip, endpoint]
  );

  if (result.rows.length > 0) {
    const { request_count, reset_at } = result.rows[0];

    if (now < reset_at) {
      if (request_count >= MAX_ATTEMPTS) {
        const retryAfter = Math.ceil((reset_at.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          retryAfter,
        };
      }
      // Increment request count
      await db.query(
        `UPDATE auth_rate_limits
         SET request_count = request_count + 1, updated_at = NOW()
         WHERE ip_address = $1 AND endpoint = $2`,
        [ip, endpoint]
      );
      return {
        allowed: true,
        remaining: MAX_ATTEMPTS - request_count - 1,
        retryAfter: 0,
      };
    }
    // Window expired, reset
    await db.query(
      `UPDATE auth_rate_limits
       SET request_count = 1, reset_at = $1, updated_at = NOW()
       WHERE ip_address = $2 AND endpoint = $3`,
      [new Date(now.getTime() + RATE_LIMIT_WINDOW_MS), ip, endpoint]
    );
    return {
      allowed: true,
      remaining: MAX_ATTEMPTS - 1,
      retryAfter: 0,
    };
  }

  // Create new rate limit entry
  await db.query(
    `INSERT INTO auth_rate_limits (ip_address, endpoint, request_count, reset_at)
     VALUES ($1, $2, 1, $3)`,
    [ip, endpoint, new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)]
  );
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - 1,
    retryAfter: 0,
  };
}

/**
 * Create a 429 Too Many Requests response.
 */
export function rateLimitExceededResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

export const RATE_LIMIT_MAX_ATTEMPTS = MAX_ATTEMPTS;
export const RATE_LIMIT_WINDOW_SECONDS = RETRY_AFTER_SECONDS;