import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock database
const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function(this: unknown, ...args: unknown[]) {
      return fn.apply(this, args);
    };
  }),
  exec: vi.fn()
};

// Mock the db module
vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
  default: { getDb: () => mockDb }
}));

// Import after mocking
import {
  canViewAssignment,
  getVisibleAssignments,
  getRecipientStatus,
  getAssignmentClassName,
  getExistingAttempt
} from './access-control';
import type { Assignment, AssignmentRecipient, AssignmentAttempt } from '@shared/types/assignment';

describe('Student Access Control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('canViewAssignment', () => {
    it('returns true when student is recipient and assignment is released with visible status', () => {
      const releasedAssignment = { id: 'assign-1', status: 'released' };
      const visibleRecipient = { visibility_status: 'visible' };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, status FROM assignments')) {
          return { get: vi.fn().mockReturnValue(releasedAssignment) };
        }
        if (sql.includes('SELECT visibility_status FROM assignment_recipients')) {
          return { get: vi.fn().mockReturnValue(visibleRecipient) };
        }
        return { get: vi.fn(), run: vi.fn(), all: vi.fn() };
      });

      const result = canViewAssignment('student-1', 'assign-1');

      expect(result).toBe(true);
    });

    it('returns false when assignment is not released (draft)', () => {
      const draftAssignment = { id: 'assign-1', status: 'draft' };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(draftAssignment)
      });

      const result = canViewAssignment('student-1', 'assign-1');

      expect(result).toBe(false);
    });

    it('returns false when student is not a recipient', () => {
      const releasedAssignment = { id: 'assign-1', status: 'released' };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, status FROM assignments')) {
          return { get: vi.fn().mockReturnValue(releasedAssignment) };
        }
        if (sql.includes('SELECT visibility_status FROM assignment_recipients')) {
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        return { get: vi.fn() };
      });

      const result = canViewAssignment('student-999', 'assign-1');

      expect(result).toBe(false);
    });

    it('returns false when recipient visibility_status is hidden', () => {
      const releasedAssignment = { id: 'assign-1', status: 'released' };
      const hiddenRecipient = { visibility_status: 'hidden' };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, status FROM assignments')) {
          return { get: vi.fn().mockReturnValue(releasedAssignment) };
        }
        if (sql.includes('SELECT visibility_status FROM assignment_recipients')) {
          return { get: vi.fn().mockReturnValue(hiddenRecipient) };
        }
        return { get: vi.fn() };
      });

      const result = canViewAssignment('student-1', 'assign-1');

      expect(result).toBe(false);
    });

    it('returns false when assignment does not exist', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = canViewAssignment('student-1', 'non-existent');

      expect(result).toBe(false);
    });

    it('returns true when recipient status is completed', () => {
      const releasedAssignment = { id: 'assign-1', status: 'released' };
      const completedRecipient = { visibility_status: 'completed' };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, status FROM assignments')) {
          return { get: vi.fn().mockReturnValue(releasedAssignment) };
        }
        if (sql.includes('SELECT visibility_status FROM assignment_recipients')) {
          return { get: vi.fn().mockReturnValue(completedRecipient) };
        }
        return { get: vi.fn() };
      });

      const result = canViewAssignment('student-1', 'assign-1');

      expect(result).toBe(true);
    });
  });

  describe('getVisibleAssignments', () => {
    it('returns only released assignments with visible/completed recipients', () => {
      const mockAssignments: Assignment[] = [
        { id: 'assign-1', class_id: 'class-1', teacher_id: 'teacher-1', title: 'Assignment 1', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, status: 'released', created_at: '', updated_at: '' },
        { id: 'assign-2', class_id: 'class-1', teacher_id: 'teacher-1', title: 'Assignment 2', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, status: 'released', created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAssignments)
      });

      const result = getVisibleAssignments('student-1');

      expect(result).toHaveLength(2);
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('excludes draft and scheduled assignments', () => {
      const releasedAssignment: Assignment[] = [
        { id: 'assign-1', class_id: 'class-1', teacher_id: 'teacher-1', title: 'Released', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, status: 'released', created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(releasedAssignment)
      });

      const result = getVisibleAssignments('student-1');

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('released');
    });

    it('returns empty array when student has no assignments', () => {
      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([])
      });

      const result = getVisibleAssignments('student-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('getRecipientStatus', () => {
    it('returns recipient when exists', () => {
      const mockRecipient: AssignmentRecipient = {
        id: 'recipient-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        visibility_status: 'visible',
        assigned_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockRecipient)
      });

      const result = getRecipientStatus('student-1', 'assign-1');

      expect(result).not.toBeNull();
      expect(result?.visibility_status).toBe('visible');
    });

    it('returns null when recipient does not exist', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getRecipientStatus('student-999', 'assign-1');

      expect(result).toBeNull();
    });
  });

  describe('getAssignmentClassName', () => {
    it('returns class name when found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ name: 'Math 101' })
      });

      const result = getAssignmentClassName('assign-1');

      expect(result).toBe('Math 101');
    });

    it('returns null when class not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAssignmentClassName('assign-999');

      expect(result).toBeNull();
    });
  });

  describe('getExistingAttempt', () => {
    it('returns attempt when exists', () => {
      const mockAttempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T10:00:00.000Z',
        submitted_at: null,
        score_percent: null,
        completion_state: 'in_progress'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockAttempt)
      });

      const result = getExistingAttempt('student-1', 'assign-1');

      expect(result).not.toBeNull();
      expect(result?.completion_state).toBe('in_progress');
    });

    it('returns null when attempt does not exist', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getExistingAttempt('student-1', 'assign-999');

      expect(result).toBeNull();
    });
  });
});

describe('Student Attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Import attempts module after mocking db
  vi.resetModules();
  const mockDbForAttempts = {
    prepare: vi.fn(),
    transaction: vi.fn((fn: Function) => {
      return function(this: unknown, ...args: unknown[]) {
        return fn.apply(this, args);
      };
    }),
    exec: vi.fn()
  };

  vi.doMock('@/lib/db', () => ({
    getDb: () => mockDbForAttempts,
    default: { getDb: () => mockDbForAttempts }
  }));
});
