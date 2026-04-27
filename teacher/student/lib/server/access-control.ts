import { getDb } from '@/lib/db';
import type { Assignment, AssignmentRecipient, AssignmentAttempt } from '@shared/types/assignment';

/**
 * Access control for student assignment visibility.
 * Students can only see assignments where they are a recipient AND the assignment is released.
 */

/**
 * Checks if a student can view a specific assignment.
 * Returns true if:
 * - The assignment exists
 * - The assignment status is 'released'
 * - The student is a recipient of the assignment
 * - The recipient visibility_status is 'visible' or 'completed'
 */
export function canViewAssignment(studentId: string, assignmentId: string): boolean {
  const db = getDb();

  // Check assignment exists and is released
  const assignment = db.prepare(`
    SELECT id, status FROM assignments WHERE id = ?
  `).get(assignmentId) as Pick<Assignment, 'id' | 'status'> | undefined;

  if (!assignment) {
    return false;
  }

  if (assignment.status !== 'released') {
    return false;
  }

  // Check if student is a recipient with visibility
  const recipient = db.prepare(`
    SELECT visibility_status FROM assignment_recipients
    WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId) as Pick<AssignmentRecipient, 'visibility_status'> | undefined;

  if (!recipient) {
    return false;
  }

  return recipient.visibility_status === 'visible' || recipient.visibility_status === 'completed';
}

/**
 * Gets all assignments visible to a student.
 * Only returns released assignments where the student is a recipient with visibility status.
 */
export function getVisibleAssignments(studentId: string): Assignment[] {
  const db = getDb();

  const assignments = db.prepare(`
    SELECT a.* FROM assignments a
    INNER JOIN assignment_recipients ar ON a.id = ar.assignment_id
    WHERE ar.student_id = ?
      AND a.status = 'released'
      AND ar.visibility_status IN ('visible', 'completed')
    ORDER BY a.due_at ASC, a.created_at DESC
  `).all(studentId) as Assignment[];

  return assignments;
}

/**
 * Gets the visibility status for a student's assignment.
 */
export function getRecipientStatus(studentId: string, assignmentId: string): AssignmentRecipient | null {
  const db = getDb();

  const recipient = db.prepare(`
    SELECT * FROM assignment_recipients
    WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId) as AssignmentRecipient | undefined;

  return recipient || null;
}

/**
 * Gets the class name for an assignment (used for display).
 */
export function getAssignmentClassName(assignmentId: string): string | null {
  const db = getDb();

  const result = db.prepare(`
    SELECT c.name FROM classes c
    INNER JOIN assignments a ON a.class_id = c.id
    WHERE a.id = ?
  `).get(assignmentId) as { name: string } | undefined;

  return result?.name || null;
}

/**
 * Checks if a student has an existing attempt for an assignment.
 */
export function getExistingAttempt(studentId: string, assignmentId: string): AssignmentAttempt | null {
  const db = getDb();

  const attempt = db.prepare(`
    SELECT * FROM assignment_attempts
    WHERE assignment_id = ? AND student_id = ?
  `).get(assignmentId, studentId) as AssignmentAttempt | undefined;

  return attempt || null;
}
