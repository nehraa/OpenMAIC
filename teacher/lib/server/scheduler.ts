import { getDb } from '../db';
import { releaseAssignment } from './assignments';
import type { Assignment } from '@shared/types/assignment';

export interface SchedulerJob {
  id: string;
  target_type: 'assignment' | 'notification';
  target_id: string;
  run_at: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// Retry intervals in milliseconds: 1min, 5min, 15min, 1hr
const RETRY_INTERVALS = [60_000, 300_000, 900_000, 3_600_000];
const MAX_RETRIES = 4;

/**
 * Creates or updates a scheduler job for an assignment.
 * If a pending job already exists for the same assignment, it updates the existing job.
 * This ensures idempotency - multiple calls don't create duplicate jobs.
 */
export function createScheduleJob(assignmentId: string, releaseAt: string): SchedulerJob {
  const db = getDb();

  // Check if a pending job already exists for this assignment
  const existingJob = db.prepare(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = ? AND status = 'pending'
  `).get(assignmentId) as SchedulerJob | undefined;

  if (existingJob) {
    // Update existing job with new release time
    db.prepare(`
      UPDATE scheduler_jobs
      SET run_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(releaseAt, existingJob.id);

    // Update the assignment's release_at and status
    db.prepare(`
      UPDATE assignments SET release_at = ?, status = 'scheduled', updated_at = datetime('now')
      WHERE id = ?
    `).run(releaseAt, assignmentId);

    return db.prepare('SELECT * FROM scheduler_jobs WHERE id = ?').get(existingJob.id) as SchedulerJob;
  }

  // Create new job
  const result = db.prepare(`
    INSERT INTO scheduler_jobs (target_type, target_id, run_at, status)
    VALUES ('assignment', ?, ?, 'pending')
  `).run(assignmentId, releaseAt);

  // Update assignment status to scheduled
  db.prepare(`
    UPDATE assignments SET release_at = ?, status = 'scheduled', updated_at = datetime('now')
    WHERE id = ?
  `).run(releaseAt, assignmentId);

  return db.prepare('SELECT * FROM scheduler_jobs WHERE id = ?').get(result.lastInsertRowid) as SchedulerJob;
}

/**
 * Cancels a scheduled job by setting its status to 'canceled'.
 * Returns the updated job or null if no pending job was found.
 */
export function cancelScheduleJob(assignmentId: string): SchedulerJob | null {
  const db = getDb();

  const existingJob = db.prepare(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = ? AND status = 'pending'
  `).get(assignmentId) as SchedulerJob | undefined;

  if (!existingJob) {
    return null;
  }

  db.prepare(`
    UPDATE scheduler_jobs SET status = 'failed', last_error = 'Cancelled by user', updated_at = datetime('now')
    WHERE id = ?
  `).run(existingJob.id);

  // Revert assignment status to draft
  db.prepare(`
    UPDATE assignments SET status = 'draft', updated_at = datetime('now')
    WHERE id = ?
  `).run(assignmentId);

  return db.prepare('SELECT * FROM scheduler_jobs WHERE id = ?').get(existingJob.id) as SchedulerJob;
}

/**
 * Updates an existing scheduled job with a new release time.
 * If no pending job exists, creates a new one.
 */
export function updateSchedule(assignmentId: string, newReleaseAt: string): SchedulerJob {
  return createScheduleJob(assignmentId, newReleaseAt);
}

/**
 * Gets the current schedule for an assignment.
 * Returns the pending job if one exists, or null.
 */
export function getSchedule(assignmentId: string): SchedulerJob | null {
  const db = getDb();

  const job = db.prepare(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = ? AND status = 'pending'
  `).get(assignmentId) as SchedulerJob | undefined;

  return job || null;
}

/**
 * Processes all pending jobs that are due to run.
 * Called by the cron/worker at regular intervals.
 * Uses exponential backoff for failed jobs.
 */
export function runPendingJobs(): { processed: number; succeeded: number; failed: number } {
  const db = getDb();

  // Get all due pending jobs
  const dueJobs = db.prepare(`
    SELECT * FROM scheduler_jobs
    WHERE status = 'pending' AND run_at <= datetime('now')
  `).all() as SchedulerJob[];

  let succeeded = 0;
  let failed = 0;

  for (const job of dueJobs) {
    try {
      // Mark as running
      db.prepare(`
        UPDATE scheduler_jobs SET status = 'running', updated_at = datetime('now')
        WHERE id = ?
      `).run(job.id);

      if (job.target_type === 'assignment') {
        // Release the assignment
        const assignment = releaseAssignment(job.target_id);

        if (assignment) {
          // Mark as completed
          db.prepare(`
            UPDATE scheduler_jobs SET status = 'completed', updated_at = datetime('now')
            WHERE id = ?
          `).run(job.id);
          succeeded++;
        } else {
          // Assignment not found - mark as failed
          handleJobFailure(db, job.id, 'Assignment not found');
          failed++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      handleJobFailure(db, job.id, errorMessage);
      failed++;
    }
  }

  return {
    processed: dueJobs.length,
    succeeded,
    failed
  };
}

/**
 * Handles job failure with exponential backoff retry.
 * After max retries, marks the job as permanently failed.
 */
function handleJobFailure(db: ReturnType<typeof getDb>, jobId: string, errorMessage: string): void {
  const job = db.prepare('SELECT * FROM scheduler_jobs WHERE id = ?').get(jobId) as SchedulerJob;

  const newRetryCount = job.retry_count + 1;

  if (newRetryCount >= MAX_RETRIES) {
    // Max retries reached - mark as permanently failed
    db.prepare(`
      UPDATE scheduler_jobs
      SET status = 'failed', retry_count = ?, last_error = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newRetryCount, errorMessage, jobId);
  } else {
    // Schedule retry with exponential backoff
    const nextRunAt = new Date(Date.now() + RETRY_INTERVALS[newRetryCount - 1]).toISOString();

    db.prepare(`
      UPDATE scheduler_jobs
      SET status = 'pending', retry_count = ?, last_error = ?, run_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(newRetryCount, errorMessage, nextRunAt, jobId);
  }
}

/**
 * Manually releases an assignment (same as automatic release via scheduler).
 */
export function releaseAssignmentById(id: string): Assignment | null {
  return releaseAssignment(id);
}
