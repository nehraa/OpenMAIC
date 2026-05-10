import { randomInt } from 'crypto';
import { getDb } from '../db';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_REQUESTS = 5;
const MAX_ATTEMPTS = 3;

/**
 * Generate a secure 6-digit OTP.
 * @param _phone - Phone number (used for logging in production)
 * @returns 6-digit OTP string
 */
export function generateOtp(_phone: string): string {
  return String(randomInt(100000, 999999));
}

/**
 * Request an OTP for a phone number.
 * Validates E.164 format and enforces rate limiting.
 * @param phone - E.164 formatted phone number
 * @returns Success status or error message
 */
export async function requestOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  // Validate E.164 format
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    return { success: false, error: 'Invalid phone format. Use E.164 format.' };
  }

  const db = getDb();
  const now = new Date();

  // Clean up expired OTPs for this phone first
  await db.query(
    'DELETE FROM otp_codes WHERE phone = $1 AND expires_at < $2',
    [phone, now]
  );

  // Check rate limit
  const rateLimitResult = await db.query(
    'SELECT request_count, reset_at FROM otp_rate_limits WHERE phone = $1',
    [phone]
  );

  if (rateLimitResult.rows.length > 0) {
    const { request_count, reset_at } = rateLimitResult.rows[0];
    if (now < reset_at) {
      if (request_count >= MAX_OTP_REQUESTS) {
        return { success: false, error: 'Too many requests. Try again later.' };
      }
      // Increment request count
      await db.query(
        'UPDATE otp_rate_limits SET request_count = request_count + 1 WHERE phone = $1',
        [phone]
      );
    } else {
      // Reset rate limit window
      await db.query(
        'UPDATE otp_rate_limits SET request_count = 1, reset_at = $1 WHERE phone = $2',
        [new Date(now.getTime() + RATE_LIMIT_WINDOW_MS), phone]
      );
    }
  } else {
    // Create new rate limit entry
    await db.query(
      `INSERT INTO otp_rate_limits (phone, request_count, reset_at)
       VALUES ($1, 1, $2)`,
      [phone, new Date(now.getTime() + RATE_LIMIT_WINDOW_MS)]
    );
  }

  // Generate and store OTP
  const otp = generateOtp(phone);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);

  // Delete any existing OTP for this phone first (ensures fresh OTP)
  await db.query('DELETE FROM otp_codes WHERE phone = $1', [phone]);

  // Insert new OTP
  await db.query(
    `INSERT INTO otp_codes (phone, code, expires_at)
     VALUES ($1, $2, $3)`,
    [phone, otp, expiresAt]
  );

  return { success: true };
}

/**
 * Verify an OTP for a phone number.
 * Tracks failed attempts (max 3) and deletes OTP after successful verification.
 * @param phone - E.164 formatted phone number
 * @param otp - 6-digit OTP code
 * @returns true if OTP is valid, false otherwise
 */
export async function verifyOtp(phone: string, otp: string): Promise<boolean> {
  const db = getDb();
  const now = new Date();

  // Fetch the OTP record
  const result = await db.query(
    `SELECT id, code, expires_at, attempts
     FROM otp_codes
     WHERE phone = $1 AND expires_at > $2`,
    [phone, now]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const record = result.rows[0];

  // Increment attempt counter
  await db.query(
    'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
    [record.id]
  );

  // Check attempt limit
  if (record.attempts >= MAX_ATTEMPTS) {
    // Too many attempts - delete the OTP
    await db.query('DELETE FROM otp_codes WHERE id = $1', [record.id]);
    return false;
  }

  // Verify code matches
  if (record.code !== otp) {
    return false;
  }

  // Success - delete the OTP (one-time use)
  await db.query('DELETE FROM otp_codes WHERE id = $1', [record.id]);
  return true;
}

/**
 * Clean up expired OTP codes from the database.
 * Should be called periodically (e.g., via a cron job or on startup).
 * @returns Number of deleted records
 */
export async function cleanupExpiredOtps(): Promise<number> {
  const db = getDb();
  const result = await db.query('SELECT cleanup_expired_otp_codes()');
  return result.rows[0]?.cleanup_expired_otp_codes ?? 0;
}

/**
 * Clean up expired rate limits from the database.
 * @returns Number of deleted records
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const db = getDb();
  const result = await db.query('SELECT cleanup_expired_otp_rate_limits()');
  return result.rows[0]?.cleanup_expired_otp_rate_limits ?? 0;
}
