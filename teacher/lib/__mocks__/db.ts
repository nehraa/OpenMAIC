// Manual mock for better-sqlite3 that doesn't require native bindings
import { vi } from 'vitest';

export const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function(this: any, ...args: any[]) {
      return fn.apply(this, args);
    };
  }),
  exec: vi.fn()
};

export const getDb = () => mockDb;
export default { getDb };