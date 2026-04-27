// Mock for better-sqlite3 native bindings
// This file mocks the entire better-sqlite3 module

import { vi } from 'vitest';

// Create mock database class
const createMockStatement = (sql: string) => {
  const handlers: Record<string, Function> = {};

  return {
    run: vi.fn().mockReturnValue({ lastInsertRowid: 'mock-id', changes: 1 }),
    get: vi.fn().mockReturnValue(undefined),
    all: vi.fn().mockReturnValue([])
  };
};

const MockDatabase = vi.fn().mockImplementation(() => {
  return {
    pragma: vi.fn(),
    prepare: vi.fn().mockImplementation((sql: string) => createMockStatement(sql)),
    exec: vi.fn(),
    transaction: vi.fn((fn: Function) => {
      return function(this: any, ...args: any[]) {
        return fn.apply(this, args);
      };
    }),
    close: vi.fn()
  };
});

export default MockDatabase;
export { MockDatabase };
export const Database = MockDatabase;