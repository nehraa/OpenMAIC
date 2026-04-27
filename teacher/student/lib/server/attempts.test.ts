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
  startAttempt,
  recordSlideView,
  submitAttempt,
  getAttemptWithResults,
  getSlideProgress,
  getAssignmentStatus
} from './attempts';
import type { AssignmentAttempt, AssignmentSlideProgress } from '@shared/types/assignment';

describe('Student Attempts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('startAttempt', () => {
    it('creates a new attempt when none exists', () => {
      const newAttempt: AssignmentAttempt = {
        id: 'attempt-new',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T10:00:00.000Z',
        submitted_at: null,
        score_percent: null,
        completion_state: 'in_progress'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM assignment_attempts')) {
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        if (sql.includes('INSERT INTO assignment_attempts')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'attempt-new' }) };
        }
        if (sql.includes('SELECT * FROM assignment_attempts WHERE id = ?')) {
          return { get: vi.fn().mockReturnValue(newAttempt) };
        }
        return { get: vi.fn(), run: vi.fn(), all: vi.fn() };
      });

      const result = startAttempt('student-1', 'assign-1');

      expect(result.completion_state).toBe('in_progress');
    });

    it('returns existing attempt if already started', () => {
      const existingAttempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T09:00:00.000Z',
        submitted_at: null,
        score_percent: null,
        completion_state: 'in_progress'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM assignment_attempts')) {
          return { get: vi.fn().mockReturnValue(existingAttempt) };
        }
        return { get: vi.fn() };
      });

      const result = startAttempt('student-1', 'assign-1');

      expect(result.id).toBe('attempt-1');
    });

    it('throws error when assignment already submitted', () => {
      const submittedAttempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T09:00:00.000Z',
        submitted_at: '2026-04-26T10:00:00.000Z',
        score_percent: null,
        completion_state: 'submitted'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM assignment_attempts')) {
          return { get: vi.fn().mockReturnValue(submittedAttempt) };
        }
        return { get: vi.fn() };
      });

      expect(() => startAttempt('student-1', 'assign-1')).toThrow('Assignment already submitted');
    });
  });

  describe('recordSlideView', () => {
    it('records slide view for new slide', () => {
      const progress: AssignmentSlideProgress = {
        id: 'progress-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        slide_id: 'slide-5',
        viewed_at: '2026-04-26T10:30:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO assignment_slide_progress')) {
          return { run: vi.fn() };
        }
        if (sql.includes('SELECT * FROM assignment_slide_progress')) {
          return { get: vi.fn().mockReturnValue(progress) };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = recordSlideView('attempt-1', 'student-1', 'assign-1', 'slide-5');

      expect(result.slide_id).toBe('slide-5');
    });
  });

  describe('getAttemptWithResults', () => {
    it('returns attempt when found', () => {
      const attempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T09:00:00.000Z',
        submitted_at: '2026-04-26T10:00:00.000Z',
        score_percent: 85,
        completion_state: 'graded'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(attempt)
      });

      const result = getAttemptWithResults('attempt-1');

      expect(result).not.toBeNull();
      expect(result?.score_percent).toBe(85);
    });

    it('returns null when attempt not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAttemptWithResults('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getSlideProgress', () => {
    it('returns all viewed slides for an assignment', () => {
      const progressList: AssignmentSlideProgress[] = [
        { id: 'p1', assignment_id: 'assign-1', student_id: 'student-1', slide_id: 'slide-1', viewed_at: '2026-04-26T10:00:00.000Z' },
        { id: 'p2', assignment_id: 'assign-1', student_id: 'student-1', slide_id: 'slide-2', viewed_at: '2026-04-26T10:05:00.000Z' },
        { id: 'p3', assignment_id: 'assign-1', student_id: 'student-1', slide_id: 'slide-3', viewed_at: '2026-04-26T10:10:00.000Z' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(progressList)
      });

      const result = getSlideProgress('student-1', 'assign-1');

      expect(result).toHaveLength(3);
    });

    it('returns empty array when no slides viewed', () => {
      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([])
      });

      const result = getSlideProgress('student-1', 'assign-999');

      expect(result).toHaveLength(0);
    });
  });

  describe('getAssignmentStatus', () => {
    it('returns not_started when no attempt exists', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAssignmentStatus('student-1', 'assign-1');

      expect(result.status).toBe('not_started');
      expect(result.attempt).toBeNull();
    });

    it('returns in_progress for pending attempt', () => {
      const pendingAttempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T09:00:00.000Z',
        submitted_at: null,
        score_percent: null,
        completion_state: 'pending'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(pendingAttempt)
      });

      const result = getAssignmentStatus('student-1', 'assign-1');

      expect(result.status).toBe('in_progress');
    });

    it('returns completed for submitted attempt', () => {
      const submittedAttempt: AssignmentAttempt = {
        id: 'attempt-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        started_at: '2026-04-26T09:00:00.000Z',
        submitted_at: '2026-04-26T11:00:00.000Z',
        score_percent: null,
        completion_state: 'submitted'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(submittedAttempt)
      });

      const result = getAssignmentStatus('student-1', 'assign-1');

      expect(result.status).toBe('completed');
    });
  });
});
