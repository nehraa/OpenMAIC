import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock database
const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function(this: any, ...args: any[]) {
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

// Mock the assignments module
vi.mock('./assignments', () => ({
  releaseAssignment: vi.fn()
}));

import {
  createScheduleJob,
  cancelScheduleJob,
  updateSchedule,
  getSchedule,
  runPendingJobs
} from './scheduler';
import type { SchedulerJob } from './scheduler';
import { releaseAssignment } from './assignments';

describe('Scheduler Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
    vi.mocked(releaseAssignment).mockReset();
  });

  describe('createScheduleJob', () => {
    it('creates a pending scheduler job for an assignment', () => {
      const mockJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-27T10:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        if (sql.includes('INSERT INTO scheduler_jobs')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'job-1' }) };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(mockJob), run: vi.fn() };
      });

      const result = createScheduleJob('assign-1', '2026-04-27T10:00:00.000Z');

      expect(result.status).toBe('pending');
      expect(result.target_id).toBe('assign-1');
      expect(result.target_type).toBe('assignment');
    });

    it('updates existing pending job instead of creating new one (idempotency)', () => {
      const existingJob: SchedulerJob = {
        id: 'existing-job',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-27T10:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const updatedJob: SchedulerJob = {
        ...existingJob,
        run_at: '2026-04-28T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(existingJob) };
        }
        if (sql.includes('UPDATE scheduler_jobs')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(updatedJob), run: vi.fn() };
      });

      const result = createScheduleJob('assign-1', '2026-04-28T10:00:00.000Z');

      expect(result.id).toBe('existing-job');
      expect(result.run_at).toBe('2026-04-28T10:00:00.000Z');
    });
  });

  describe('cancelScheduleJob', () => {
    it('sets status to failed when cancelling a job', () => {
      const existingJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-27T10:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const cancelledJob: SchedulerJob = {
        ...existingJob,
        status: 'failed',
        last_error: 'Cancelled by user'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(existingJob) };
        }
        if (sql.includes('UPDATE scheduler_jobs')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(cancelledJob), run: vi.fn() };
      });

      const result = cancelScheduleJob('assign-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('failed');
      expect(result?.last_error).toBe('Cancelled by user');
    });

    it('returns null when no pending job found', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = cancelScheduleJob('assign-1');

      expect(result).toBeNull();
    });
  });

  describe('runPendingJobs', () => {
    it('processes due jobs and releases assignments', () => {
      const dueJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-26T09:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T08:00:00.000Z',
        updated_at: '2026-04-26T08:00:00.000Z'
      };

      const mockReleasedAssignment = {
        id: 'assign-1',
        status: 'released'
      };

      let callCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        callCount++;
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('status') && sql.includes('run_at')) {
          return { all: vi.fn().mockReturnValue([dueJob]) };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('status = \'running\'')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('status = \'completed\'')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      vi.mocked(releaseAssignment).mockReturnValue(mockReleasedAssignment as any);

      const result = runPendingJobs();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
      expect(releaseAssignment).toHaveBeenCalledWith('assign-1');
    });

    it('increments retry_count on failure and reschedules', () => {
      const dueJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-26T09:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T08:00:00.000Z',
        updated_at: '2026-04-26T08:00:00.000Z'
      };

      const jobAfterFailure: SchedulerJob = {
        ...dueJob,
        status: 'pending',
        retry_count: 1,
        last_error: 'Assignment not found'
      };

      let callCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        callCount++;
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('status') && sql.includes('run_at')) {
          return { all: vi.fn().mockReturnValue([dueJob]) };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('status = \'running\'')) {
          return { run: vi.fn() };
        }
        if (sql.includes('SELECT * FROM scheduler_jobs WHERE id = ?')) {
          return { get: vi.fn().mockReturnValue(callCount === 1 ? dueJob : jobAfterFailure) };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('retry_count')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      vi.mocked(releaseAssignment).mockImplementation(() => {
        throw new Error('Assignment not found');
      });

      const result = runPendingJobs();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('marks job as permanently failed after max retries', () => {
      const dueJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-26T09:00:00.000Z',
        status: 'pending',
        retry_count: 3, // Already at 3, next failure is max
        last_error: null,
        created_at: '2026-04-26T08:00:00.000Z',
        updated_at: '2026-04-26T08:00:00.000Z'
      };

      const jobAfterMaxRetries: SchedulerJob = {
        ...dueJob,
        status: 'failed',
        retry_count: 4,
        last_error: 'Max retries reached'
      };

      let callCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        callCount++;
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('status') && sql.includes('run_at')) {
          return { all: vi.fn().mockReturnValue([dueJob]) };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('status = \'running\'')) {
          return { run: vi.fn() };
        }
        if (sql.includes('SELECT * FROM scheduler_jobs WHERE id = ?')) {
          return { get: vi.fn().mockReturnValue(callCount === 1 ? dueJob : jobAfterMaxRetries) };
        }
        if (sql.includes('UPDATE scheduler_jobs') && sql.includes('status = \'failed\'') && sql.includes('retry_count = 4')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      vi.mocked(releaseAssignment).mockImplementation(() => {
        throw new Error('Max retries reached');
      });

      const result = runPendingJobs();

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('getSchedule', () => {
    it('returns the pending job for an assignment', () => {
      const pendingJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-27T10:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(pendingJob) };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = getSchedule('assign-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-1');
      expect(result?.status).toBe('pending');
    });

    it('returns null when no pending job exists', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = getSchedule('assign-1');

      expect(result).toBeNull();
    });
  });

  describe('updateSchedule', () => {
    it('updates existing job with new release time', () => {
      const existingJob: SchedulerJob = {
        id: 'job-1',
        target_type: 'assignment',
        target_id: 'assign-1',
        run_at: '2026-04-27T10:00:00.000Z',
        status: 'pending',
        retry_count: 0,
        last_error: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const updatedJob: SchedulerJob = {
        ...existingJob,
        run_at: '2026-04-28T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('scheduler_jobs') && sql.includes('target_type')) {
          return { get: vi.fn().mockReturnValue(existingJob) };
        }
        if (sql.includes('UPDATE scheduler_jobs')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(updatedJob), run: vi.fn() };
      });

      const result = updateSchedule('assign-1', '2026-04-28T10:00:00.000Z');

      expect(result.id).toBe('job-1');
      expect(result.run_at).toBe('2026-04-28T10:00:00.000Z');
    });
  });
});
