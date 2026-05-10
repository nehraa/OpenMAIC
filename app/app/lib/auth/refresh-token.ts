import { createHash, timingSafeEqual } from 'crypto';

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyRefreshTokenHash(token: string, hash: string): boolean {
  const tokenHash = hashRefreshToken(token);
  const tokenBuffer = Buffer.from(tokenHash, 'hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  if (tokenBuffer.length !== hashBuffer.length) {
    return false;
  }
  return timingSafeEqual(tokenBuffer, hashBuffer);
}
