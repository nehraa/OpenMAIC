// Test setup file for mocking better-sqlite3
// This file is loaded before any test runs

import { vi } from 'vitest';

// Needed by tests that call into core's auth-protected routes. Production
// code mints an HMAC token from this at request time; the placeholder is
// fine for unit tests that don't actually verify the token contents.
process.env.ACCESS_CODE = process.env.ACCESS_CODE || 'test-access-code';
process.env.CORE_INTERNAL_URL = process.env.CORE_INTERNAL_URL || 'http://core.test';

// Mock the entire better-sqlite3 module
vi.mock('better-sqlite3', () => {
  const createMockStatement = () => {
    return {
      run: vi.fn().mockReturnValue({ lastInsertRowid: 'mock-id', changes: 1 }),
      get: vi.fn().mockReturnValue(undefined),
      all: vi.fn().mockReturnValue([])
    };
  };

  const MockDatabase = vi.fn().mockImplementation(() => {
    return {
      pragma: vi.fn(),
      prepare: vi.fn().mockImplementation((_sql: string) => createMockStatement()),
      exec: vi.fn(),
      transaction: vi.fn((fn: Function) => {
        return function(this: any, ...args: any[]) {
          return fn.apply(this, args);
        };
      }),
      close: vi.fn()
    };
  });

  return { default: MockDatabase, Database: MockDatabase };
});