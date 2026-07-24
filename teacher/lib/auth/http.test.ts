import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAllowedOrigin, sessionCookieOptions } from './http';

describe('getAllowedOrigin', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    // Restore any original keys that may have been removed by stubAllEnvs.
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  it('returns the configured origin verbatim', () => {
    vi.stubEnv('ACCESS_CONTROL_ALLOW_ORIGIN', 'https://openmaic.devstudios.me');
    vi.stubEnv('NODE_ENV', 'production');
    expect(getAllowedOrigin()).toBe('https://openmaic.devstudios.me');
  });

  it('fails closed in production when ACCESS_CONTROL_ALLOW_ORIGIN is not set', () => {
    vi.stubEnv('ACCESS_CONTROL_ALLOW_ORIGIN', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getAllowedOrigin()).toThrow('ACCESS_CONTROL_ALLOW_ORIGIN must be set in production');
  });

  it('fails closed in production when ACCESS_CONTROL_ALLOW_ORIGIN is undefined', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
    expect(() => getAllowedOrigin()).toThrow('ACCESS_CONTROL_ALLOW_ORIGIN must be set in production');
  });

  it('never falls back to http://localhost:3001 in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
    // The helper must throw rather than silently returning a localhost
    // origin; if it ever stops throwing, this assertion will fail and
    // expose the regression.
    expect(() => getAllowedOrigin()).toThrow(/ACCESS_CONTROL_ALLOW_ORIGIN must be set in production/);
  });

  it('falls back to DEV_ORIGIN in development when ACCESS_CONTROL_ALLOW_ORIGIN is not set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
    vi.stubEnv('DEV_ORIGIN', 'http://localhost:3002');
    expect(getAllowedOrigin()).toBe('http://localhost:3002');
  });

  it('falls back to a loopback default in development when DEV_ORIGIN is also unset', () => {
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.ACCESS_CONTROL_ALLOW_ORIGIN;
    delete process.env.DEV_ORIGIN;
    const origin = getAllowedOrigin();
    expect(origin.startsWith('http://localhost')).toBe(true);
    expect(origin.endsWith(':3001')).toBe(false);
  });
});

describe('sessionCookieOptions', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      process.env[key] = value;
    }
  });

  it('omits the domain attribute when SESSION_COOKIE_DOMAIN is unset', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.SESSION_COOKIE_DOMAIN;
    const options = sessionCookieOptions();
    expect(options.domain).toBeUndefined();
    expect(options.httpOnly).toBe(true);
    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
  });

  it('omits the domain attribute when SESSION_COOKIE_DOMAIN is the empty string', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_COOKIE_DOMAIN', '');
    const options = sessionCookieOptions();
    expect(options.domain).toBeUndefined();
  });

  it('never falls back to localhost for the domain attribute', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.SESSION_COOKIE_DOMAIN;
    expect(sessionCookieOptions().domain).not.toBe('localhost');
  });

  it('uses the configured SESSION_COOKIE_DOMAIN when set', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_COOKIE_DOMAIN', 'openmaic.devstudios.me');
    expect(sessionCookieOptions().domain).toBe('openmaic.devstudios.me');
  });

  it('marks the cookie secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(sessionCookieOptions().secure).toBe(true);
  });

  it('does not mark the cookie secure outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(sessionCookieOptions().secure).toBe(false);
  });
});
