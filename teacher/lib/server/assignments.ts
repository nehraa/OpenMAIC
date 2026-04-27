import { getDb } from '../db';
import type { Assignment, AssignmentRecipient, AssignmentAttempt } from '@shared/types/assignment';

export interface CreateAssignmentData {
  classId: string;
  teacherId: string;
  title: string;
  description?: string;
  slideAssetVersionId?: string;
  quizAssetVersionId?: string;
  releaseAt?: string;
  dueAt?: string;
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  slideAssetVersionId?: string;
  quizAssetVersionId?: string;
  releaseAt?: string;
  dueAt?: string;
  status?: 'draft' | 'scheduled' | 'released' | 'closed';
}

export interface AssignmentWithRecipients extends Assignment {
  recipients: AssignmentRecipient[];
}

export function createAssignment(data: CreateAssignmentData): Assignment {
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO assignments (class_id, teacher_id, title, description, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(
    data.classId,
    data.teacherId,
    data.title,
    data.description || '',
    data.slideAssetVersionId || null,
    data.quizAssetVersionId || null,
    data.releaseAt || null,
    data.dueAt || null
  );

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid) as Assignment;
  return assignment;
}

export function updateAssignment(id: string, data: UpdateAssignmentData): Assignment | null {
  const db = getDb();

  // First get the current assignment to check status
  const current = db.prepare('SELECT status FROM assignments WHERE id = ?').get(id) as { status: string } | undefined;
  if (!current) {
    return null;
  }

  // Can only update draft or scheduled assignments
  if (current.status !== 'draft' && current.status !== 'scheduled') {
    throw new Error(`Cannot update assignment with status '${current.status}'`);
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.slideAssetVersionId !== undefined) {
    fields.push('slide_asset_version_id = ?');
    values.push(data.slideAssetVersionId || null);
  }
  if (data.quizAssetVersionId !== undefined) {
    fields.push('quiz_asset_version_id = ?');
    values.push(data.quizAssetVersionId || null);
  }
  if (data.releaseAt !== undefined) {
    fields.push('release_at = ?');
    values.push(data.releaseAt || null);
  }
  if (data.dueAt !== undefined) {
    fields.push('due_at = ?');
    values.push(data.dueAt || null);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    values.push(data.status);
  }

  if (fields.length === 0) {
    return db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE assignments SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment;
}

export function addRecipients(assignmentId: string, studentIds: string[]): AssignmentRecipient[] {
  const db = getDb();
  const insertedRecipients: AssignmentRecipient[] = [];

  const insertStmt = db.prepare(`
    INSERT INTO assignment_recipients (assignment_id, student_id, visibility_status)
    VALUES (?, ?, 'hidden')
  `);

  const selectStmt = db.prepare(`
    SELECT * FROM assignment_recipients WHERE assignment_id = ? AND student_id = ?
  `);

  const insertMany = db.transaction((ids: string[]) => {
    for (const studentId of ids) {
      // Check if already exists
      const existing = selectStmt.get(assignmentId, studentId) as AssignmentRecipient | undefined;
      if (!existing) {
        const result = insertStmt.run(assignmentId, studentId);
        const recipient = db.prepare('SELECT * FROM assignment_recipients WHERE id = ?').get(result.lastInsertRowid) as AssignmentRecipient;
        insertedRecipients.push(recipient);
      }
    }
  });

  insertMany(studentIds);
  return insertedRecipients;
}

export function releaseAssignment(id: string): Assignment | null {
  const db = getDb();

  // Get current assignment
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment | undefined;
  if (!assignment) {
    return null;
  }

  if (assignment.status !== 'draft' && assignment.status !== 'scheduled') {
    throw new Error(`Cannot release assignment with status '${assignment.status}'`);
  }

  // Update assignment status to released
  db.prepare(`
    UPDATE assignments SET status = 'released', updated_at = datetime('now') WHERE id = ?
  `).run(id);

  // Update all recipients to visible
  db.prepare(`
    UPDATE assignment_recipients SET visibility_status = 'visible' WHERE assignment_id = ?
  `).run(id);

  return db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment;
}

export function getAssignmentWithRecipients(id: string): AssignmentWithRecipients | null {
  const db = getDb();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment | undefined;
  if (!assignment) {
    return null;
  }

  const recipients = db.prepare('SELECT * FROM assignment_recipients WHERE assignment_id = ?').all(id) as AssignmentRecipient[];

  return {
    ...assignment,
    recipients
  };
}

export interface ListAssignmentsFilters {
  classId?: string;
  status?: 'draft' | 'scheduled' | 'released' | 'closed';
}

export function getAssignmentsForTeacher(teacherId: string, filters?: ListAssignmentsFilters): Assignment[] {
  const db = getDb();

  const conditions: string[] = ['teacher_id = ?'];
  const values: (string | number)[] = [teacherId];

  if (filters?.classId) {
    conditions.push('class_id = ?');
    values.push(filters.classId);
  }
  if (filters?.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }

  const query = `
    SELECT * FROM assignments
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;

  return db.prepare(query).all(...values) as Assignment[];
}

export function getAssignmentById(id: string): Assignment | null {
  const db = getDb();
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id) as Assignment | undefined;
  return assignment || null;
}

export function deleteAssignment(id: string): boolean {
  const db = getDb();

  const assignment = db.prepare('SELECT status FROM assignments WHERE id = ?').get(id) as { status: string } | undefined;
  if (!assignment) {
    return false;
  }

  // Can only delete draft assignments
  if (assignment.status !== 'draft') {
    throw new Error(`Cannot delete assignment with status '${assignment.status}'`);
  }

  db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
  return true;
}
