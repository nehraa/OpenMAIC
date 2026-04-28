import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload extends JWTPayload {
  userId: string;
  tenantId: string;
  role: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Generate an access token (15 min expiry) containing userId, tenantId (teacherId), and role.
 */
export async function generateAccessToken(
  userId: string,
  tenantId: string,
  role: string
): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ userId, tenantId, role })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secret);
}

/**
 * Generate a refresh token (7 days expiry) containing just the userId.
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secret);
}

/**
 * Verify and decode an access token.
 * Throws if the token is invalid or expired.
 */
export async function verifyAccessToken(
  token: string
): Promise<TokenPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM] });
  return payload as TokenPayload;
}

/**
 * Verify and decode a refresh token.
 * Throws if the token is invalid or expired.
 */
export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string }> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, { algorithms: [ALGORITHM] });
  return { userId: payload.userId as string };
}
