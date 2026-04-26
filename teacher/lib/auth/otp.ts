import { randomInt } from 'crypto';
import { getDb } from '../db';

// In-memory OTP store for MVP (use Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_REQUESTS = 5;

export function generateOtp(phone: string): string {
  // DEV MODE: Always return "123456"
  if (process.env.NODE_ENV === 'development') {
    return '123456';
  }
  // PROD: Generate secure 6-digit OTP using crypto
  return String(randomInt(100000, 999999));
}

export function requestOtp(phone: string): { success: boolean; error?: string } {
  // Validate E.164 format
  if (!/^\+[1-9]\d{1,14}$/.test(phone)) {
    return { success: false, error: 'Invalid phone format. Use E.164 format.' };
  }

  // Check rate limit
  const rateLimit = rateLimitStore.get(phone);
  const now = Date.now();

  if (rateLimit) {
    if (now < rateLimit.resetAt) {
      if (rateLimit.count >= MAX_OTP_REQUESTS) {
        return { success: false, error: 'Too many requests. Try again later.' };
      }
      rateLimit.count++;
    } else {
      rateLimit.count = 1;
      rateLimit.resetAt = now + RATE_LIMIT_WINDOW_MS;
    }
  } else {
    rateLimitStore.set(phone, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  // Generate and store OTP
  const otp = generateOtp(phone);
  otpStore.set(phone, { otp, expiresAt: now + OTP_EXPIRY_MS });

  return { success: true };
}

export function verifyOtp(phone: string, otp: string): boolean {
  const record = otpStore.get(phone);

  if (!record) {
    return false;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }

  if (record.otp !== otp) {
    return false;
  }

  // OTP used - delete it
  otpStore.delete(phone);
  return true;
}
