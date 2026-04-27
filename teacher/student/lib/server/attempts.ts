import { getDb } from '@/lib/db';
import type { AssignmentAttempt, AssignmentSlideProgress } from '@shared/types/assignment';

/**
 * Assignment attempt management for students.
 */

/**
 * Starts a new attempt for a student on an assignment.
 * If an attempt already exists, returns the existing attempt.
 */
export function startAttempt(studentId: string, assignmentId: string): AssignmentAttempt {
  const db = getDb();

  // Check if an attempt already exists
  const existing = db.prepare(`
    SELECT * FROM assignment_attempts
    WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId) as AssignmentAttempt | undefined;

  if (existing) {
    // If already submitted, don't allow re-starting
    if (existing.completion_state === 'submitted' || existing.completion_state === 'graded') {
      throw new Error('Assignment already submitted');
    }
    // Update status to in_progress if it was pending
    if (existing.completion_state === 'pending') {
      db.prepare(`
        UPDATE assignment_attempts
        SET completion_state = 'in_progress', started_at = datetime('now')
        WHERE id = ?
      `).run(existing.id);
      return { ...existing, completion_state: 'in_progress', started_at: new Date().toISOString() };
    }
    return existing;
  }

  // Create new attempt
  const result = db.prepare(`
    INSERT INTO assignment_attempts (assignment_id, student_id, completion_state)
    VALUES (?, ?, 'in_progress')
  `).run(assignmentId, studentId);

  const attempt = db.prepare('SELECT * FROM assignment_attempts WHERE id = ?').get(result.lastInsertRowid) as AssignmentAttempt;
  return attempt;
}

/**
 * Records that a student has viewed a specific slide.
 */
export function recordSlideView(attemptId: string, studentId: string, assignmentId: string, slideId: string): AssignmentSlideProgress {
  const db = getDb();

  // Upsert slide progress (ignore if already viewed)
  db.prepare(`
    INSERT INTO assignment_slide_progress (assignment_id, student_id, slide_id)
    VALUES (?, ?, ?)
    ON CONFLICT(assignment_id, student_id, slide_id) DO NOTHING
  `).run(assignmentId, studentId, slideId);

  const progress = db.prepare(`
    SELECT * FROM assignment_slide_progress
    WHERE assignment_id = ? AND student_id = ? AND slide_id = ?
  `).get(assignmentId, studentId, slideId) as AssignmentSlideProgress;

  return progress;
}

/**
 * Submits an attempt with answers for grading.
 */
export function submitAttempt(
  attemptId: string,
  studentId: string,
  assignmentId: string,
  answers: Record<string, string | string[]>
): AssignmentAttempt {
  const db = getDb();

  // Verify attempt exists and belongs to student
  const attempt = db.prepare(`
    SELECT * FROM assignment_attempts
    WHERE id = ? AND student_id = ? AND assignment_id = ?
  `).get(attemptId, studentId, assignmentId) as AssignmentAttempt | undefined;

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.completion_state === 'submitted' || attempt.completion_state === 'graded') {
    throw new Error('Assignment already submitted');
  }

  // Store answers as JSON in a separate table or update the attempt
  // For now, we just mark as submitted - grading would happen async
  db.prepare(`
    UPDATE assignment_attempts
    SET completion_state = 'submitted',
        submitted_at = datetime('now')
    WHERE id = ?
  `).run(attemptId);

  // Update recipient visibility to completed
  db.prepare(`
    UPDATE assignment_recipients
    SET visibility_status = 'completed'
    WHERE assignment_id = ? AND student_id = ?
  `).run(assignmentId, studentId);

  const updated = db.prepare('SELECT * FROM assignment_attempts WHERE id = ?').get(attemptId) as AssignmentAttempt;
  return updated;
}

/**
 * Gets an attempt with results (for viewing after submission).
 */
export function getAttemptWithResults(attemptId: string): AssignmentAttempt | null {
  const db = getDb();

  const attempt = db.prepare(`
    SELECT * FROM assignment_attempts WHERE id = ?
  `).get(attemptId) as AssignmentAttempt | undefined;

  return attempt || null;
}

/**
 * Gets all slide progress for an attempt.
 */
export function getSlideProgress(studentId: string, assignmentId: string): AssignmentSlideProgress[] {
  const db = getDb();

  const progress = db.prepare(`
    SELECT * FROM assignment_slide_progress
    WHERE assignment_id = ? AND student_id = ?
    ORDER BY viewed_at ASC
  `).all(assignmentId, studentId) as AssignmentSlideProgress[];

  return progress;
}

/**
 * Gets the current status of an assignment for a student.
 */
export function getAssignmentStatus(studentId: string, assignmentId: string): {
  status: 'not_started' | 'in_progress' | 'completed';
  attempt: AssignmentAttempt | null;
} {
  const attempt = getExistingAttempt(studentId, assignmentId);

  if (!attempt) {
    return { status: 'not_started', attempt: null };
  }

  switch (attempt.completion_state) {
    case 'pending':
    case 'in_progress':
      return { status: 'in_progress', attempt };
    case 'submitted':
    case 'graded':
      return { status: 'completed', attempt };
    default:
      return { status: 'not_started', attempt: null };
  }
}

function getExistingAttempt(studentId: string, assignmentId: string): AssignmentAttempt | null {
  const db = getDb();

  const attempt = db.prepare(`
    SELECT * FROM assignment_attempts
    WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId) as AssignmentAttempt | undefined;

  return attempt || null;
}
