// Test setup file for mocking better-sqlite3
// This file is loaded before any test runs

import { vi } from 'vitest';

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
      prepare: vi.fn().mockImplementation((sql: string) => createMockStatement()),
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