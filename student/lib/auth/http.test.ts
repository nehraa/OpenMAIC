import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedOrigin, sessionCookieOptions } from './http.ts';

const ORIGINAL_ENV = { ...process.env };

// `NODE_ENV` is typed as readonly in the Node typings. We have to cast
// through `unknown` to write it from the test harness.
const mutableEnv = process.env as unknown as Record<string, string | undefined>;

function resetEnv(): void {
  for (const key of Object.keys(mutableEnv)) {
    if (!(key in ORIGINAL_ENV)) {
      delete mutableEnv[key];
    }
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    mutableEnv[key] = value;
  }
}

test.afterEach(() => {
  resetEnv();
});

test('getAllowedOrigin returns the configured origin verbatim', () => {
  mutableEnv.ACCESS_CONTROL_ALLOW_ORIGIN = 'https://openmaic.devstudios.me';
  mutableEnv.NODE_ENV = 'production';
  assert.equal(getAllowedOrigin(), 'https://openmaic.devstudios.me');
});

test('getAllowedOrigin fails closed in production when unset', () => {
  mutableEnv.NODE_ENV = 'production';
  delete mutableEnv.ACCESS_CONTROL_ALLOW_ORIGIN;
  assert.throws(
    () => getAllowedOrigin(),
    /ACCESS_CONTROL_ALLOW_ORIGIN must be set in production/
  );
});

test('getAllowedOrigin fails closed in production when set to empty string', () => {
  mutableEnv.NODE_ENV = 'production';
  mutableEnv.ACCESS_CONTROL_ALLOW_ORIGIN = '';
  assert.throws(
    () => getAllowedOrigin(),
    /ACCESS_CONTROL_ALLOW_ORIGIN must be set in production/
  );
});

test('getAllowedOrigin does not fall back to http://localhost:3001 in production', () => {
  mutableEnv.NODE_ENV = 'production';
  delete mutableEnv.ACCESS_CONTROL_ALLOW_ORIGIN;
  assert.throws(() => getAllowedOrigin());
});

test('sessionCookieOptions omits the domain attribute when SESSION_COOKIE_DOMAIN is unset', () => {
  mutableEnv.NODE_ENV = 'production';
  delete mutableEnv.SESSION_COOKIE_DOMAIN;
  const options = sessionCookieOptions();
  assert.equal(options.domain, undefined);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
});

test('sessionCookieOptions never falls back to localhost', () => {
  mutableEnv.NODE_ENV = 'production';
  delete mutableEnv.SESSION_COOKIE_DOMAIN;
  assert.notEqual(sessionCookieOptions().domain, 'localhost');
});

test('sessionCookieOptions marks the cookie secure in production', () => {
  mutableEnv.NODE_ENV = 'production';
  delete mutableEnv.SESSION_COOKIE_DOMAIN;
  assert.equal(sessionCookieOptions().secure, true);
});

test('sessionCookieOptions does not mark the cookie secure outside production', () => {
  mutableEnv.NODE_ENV = 'development';
  delete mutableEnv.SESSION_COOKIE_DOMAIN;
  assert.equal(sessionCookieOptions().secure, false);
});

test('sessionCookieOptions uses the configured SESSION_COOKIE_DOMAIN', () => {
  mutableEnv.NODE_ENV = 'production';
  mutableEnv.SESSION_COOKIE_DOMAIN = 'openmaic.devstudios.me';
  assert.equal(sessionCookieOptions().domain, 'openmaic.devstudios.me');
});

test('sessionCookieOptions treats empty SESSION_COOKIE_DOMAIN as unset', () => {
  mutableEnv.NODE_ENV = 'production';
  mutableEnv.SESSION_COOKIE_DOMAIN = '';
  assert.equal(sessionCookieOptions().domain, undefined);
});
