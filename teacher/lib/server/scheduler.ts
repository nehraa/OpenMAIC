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

const RETRY_INTERVALS = [60_000, 300_000, 900_000, 3_600_000];
const MAX_RETRIES = 4;

export async function createScheduleJob(assignmentId: string, releaseAt: string): Promise<SchedulerJob> {
  const db = getDb();

  const existingResult = await db.query(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = $1 AND status = 'pending'
  `, [assignmentId]);

  const existingJob = existingResult.rows[0] as SchedulerJob | undefined;

  if (existingJob) {
    await db.query(`
      UPDATE scheduler_jobs
      SET run_at = $1, updated_at = NOW()
      WHERE id = $2
    `, [releaseAt, existingJob.id]);

    await db.query(`
      UPDATE assignments SET release_at = $1, status = 'scheduled', updated_at = NOW()
      WHERE id = $2
    `, [releaseAt, assignmentId]);

    const result = await db.query('SELECT * FROM scheduler_jobs WHERE id = $1', [existingJob.id]);
    return result.rows[0] as SchedulerJob;
  }

  const jobResult = await db.query(`
    INSERT INTO scheduler_jobs (target_type, target_id, run_at, status)
    VALUES ('assignment', $1, $2, 'pending')
    RETURNING *
  `, [assignmentId, releaseAt]);

  const job = jobResult.rows[0] as SchedulerJob;

  await db.query(`
    UPDATE assignments SET release_at = $1, status = 'scheduled', updated_at = NOW()
    WHERE id = $2
  `, [releaseAt, assignmentId]);

  return job;
}

export async function cancelScheduleJob(assignmentId: string): Promise<SchedulerJob | null> {
  const db = getDb();

  const existingResult = await db.query(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = $1 AND status = 'pending'
  `, [assignmentId]);

  const existingJob = existingResult.rows[0] as SchedulerJob | undefined;

  if (!existingJob) {
    return null;
  }

  await db.query(`
    UPDATE scheduler_jobs SET status = 'failed', last_error = 'Cancelled by user', updated_at = NOW()
    WHERE id = $1
  `, [existingJob.id]);

  await db.query(`
    UPDATE assignments SET status = 'draft', updated_at = NOW()
    WHERE id = $1
  `, [assignmentId]);

  const result = await db.query('SELECT * FROM scheduler_jobs WHERE id = $1', [existingJob.id]);
  return result.rows[0] as SchedulerJob;
}

export async function updateSchedule(assignmentId: string, newReleaseAt: string): Promise<SchedulerJob> {
  return createScheduleJob(assignmentId, newReleaseAt);
}

export async function getSchedule(assignmentId: string): Promise<SchedulerJob | null> {
  const db = getDb();

  const result = await db.query(`
    SELECT * FROM scheduler_jobs
    WHERE target_type = 'assignment' AND target_id = $1 AND status = 'pending'
  `, [assignmentId]);

  return result.rows[0] as SchedulerJob || null;
}

export async function runPendingJobs(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const db = getDb();

  const dueJobsResult = await db.query(`
    SELECT * FROM scheduler_jobs
    WHERE status = 'pending' AND run_at <= NOW()
  `);

  const dueJobs = dueJobsResult.rows as SchedulerJob[];

  let succeeded = 0;
  let failed = 0;

  for (const job of dueJobs) {
    try {
      await db.query(`
        UPDATE scheduler_jobs SET status = 'running', updated_at = NOW()
        WHERE id = $1
      `, [job.id]);

      if (job.target_type === 'assignment') {
        const assignment = await releaseAssignment(job.target_id);

        if (assignment) {
          await db.query(`
            UPDATE scheduler_jobs SET status = 'completed', updated_at = NOW()
            WHERE id = $1
          `, [job.id]);
          succeeded++;
        } else {
          await handleJobFailure(db, job.id, 'Assignment not found');
          failed++;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await handleJobFailure(db, job.id, errorMessage);
      failed++;
    }
  }

  return {
    processed: dueJobs.length,
    succeeded,
    failed
  };
}

async function handleJobFailure(db: ReturnType<typeof getDb>, jobId: string, errorMessage: string): Promise<void> {
  const jobResult = await db.query('SELECT * FROM scheduler_jobs WHERE id = $1', [jobId]);
  const job = jobResult.rows[0] as SchedulerJob;

  const newRetryCount = job.retry_count + 1;

  if (newRetryCount >= MAX_RETRIES) {
    await db.query(`
      UPDATE scheduler_jobs
      SET status = 'failed', retry_count = $1, last_error = $2, updated_at = NOW()
      WHERE id = $3
    `, [newRetryCount, errorMessage, jobId]);
  } else {
    const nextRunAt = new Date(Date.now() + RETRY_INTERVALS[newRetryCount - 1]).toISOString();

    await db.query(`
      UPDATE scheduler_jobs
      SET status = 'pending', retry_count = $1, last_error = $2, run_at = $3, updated_at = NOW()
      WHERE id = $4
    `, [newRetryCount, errorMessage, nextRunAt, jobId]);
  }
}

export async function releaseAssignmentById(id: string): Promise<Assignment | null> {
  return releaseAssignment(id);
}
