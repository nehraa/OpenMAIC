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

export async function createAssignment(data: CreateAssignmentData): Promise<Assignment> {
  const db = getDb();

  const result = await db.query(`
    INSERT INTO assignments (class_id, teacher_id, title, description, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
    RETURNING *
  `, [
    data.classId,
    data.teacherId,
    data.title,
    data.description || '',
    data.slideAssetVersionId || null,
    data.quizAssetVersionId || null,
    data.releaseAt || null,
    data.dueAt || null
  ]);

  return result.rows[0] as Assignment;
}

export async function updateAssignment(id: string, data: UpdateAssignmentData): Promise<Assignment | null> {
  const db = getDb();

  // First get the current assignment to check status
  const currentResult = await db.query('SELECT status FROM assignments WHERE id = $1', [id]);
  const current = currentResult.rows[0] as { status: string } | undefined;
  if (!current) {
    return null;
  }

  // Can only update draft or scheduled assignments
  if (current.status !== 'draft' && current.status !== 'scheduled') {
    throw new Error(`Cannot update assignment with status '${current.status}'`);
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.slideAssetVersionId !== undefined) {
    fields.push(`slide_asset_version_id = $${paramIndex++}`);
    values.push(data.slideAssetVersionId || null);
  }
  if (data.quizAssetVersionId !== undefined) {
    fields.push(`quiz_asset_version_id = $${paramIndex++}`);
    values.push(data.quizAssetVersionId || null);
  }
  if (data.releaseAt !== undefined) {
    fields.push(`release_at = $${paramIndex++}`);
    values.push(data.releaseAt || null);
  }
  if (data.dueAt !== undefined) {
    fields.push(`due_at = $${paramIndex++}`);
    values.push(data.dueAt || null);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }

  if (fields.length === 0) {
    const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
    return result.rows[0] as Assignment;
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  await db.query(`UPDATE assignments SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);

  const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
  return result.rows[0] as Assignment;
}

export async function addRecipients(assignmentId: string, studentIds: string[]): Promise<AssignmentRecipient[]> {
  const db = getDb();
  const insertedRecipients: AssignmentRecipient[] = [];

  for (const studentId of studentIds) {
    try {
      const result = await db.query(`
        INSERT INTO assignment_recipients (assignment_id, student_id, visibility_status)
        VALUES ($1, $2, 'hidden')
        ON CONFLICT DO NOTHING
        RETURNING *
      `, [assignmentId, studentId]);

      if (result.rows.length > 0) {
        insertedRecipients.push(result.rows[0] as AssignmentRecipient);
      }
    } catch (error) {
      // Ignore conflicts
    }
  }

  return insertedRecipients;
}

export async function releaseAssignment(id: string): Promise<Assignment | null> {
  const db = getDb();

  // Get current assignment
  const assignmentResult = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
  const assignment = assignmentResult.rows[0] as Assignment | undefined;
  if (!assignment) {
    return null;
  }

  if (assignment.status !== 'draft' && assignment.status !== 'scheduled') {
    throw new Error(`Cannot release assignment with status '${assignment.status}'`);
  }

  // Update assignment status to released
  await db.query(`
    UPDATE assignments SET status = 'released', updated_at = NOW() WHERE id = $1
  `, [id]);

  // Update all recipients to visible
  await db.query(`
    UPDATE assignment_recipients SET visibility_status = 'visible' WHERE assignment_id = $1
  `, [id]);

  const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
  return result.rows[0] as Assignment;
}

export async function getAssignmentWithRecipients(id: string): Promise<AssignmentWithRecipients | null> {
  const db = getDb();

  const assignmentResult = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
  const assignment = assignmentResult.rows[0] as Assignment | undefined;
  if (!assignment) {
    return null;
  }

  const recipientsResult = await db.query('SELECT * FROM assignment_recipients WHERE assignment_id = $1', [id]);
  const recipients = recipientsResult.rows as AssignmentRecipient[];

  return {
    ...assignment,
    recipients
  };
}

export interface ListAssignmentsFilters {
  classId?: string;
  status?: 'draft' | 'scheduled' | 'released' | 'closed';
}

export async function getAssignmentsForTeacher(teacherId: string, filters?: ListAssignmentsFilters): Promise<Assignment[]> {
  const db = getDb();

  const conditions: string[] = ['teacher_id = $1'];
  const values: (string | undefined)[] = [teacherId];
  let paramIndex = 2;

  if (filters?.classId) {
    conditions.push(`class_id = $${paramIndex++}`);
    values.push(filters.classId);
  }
  if (filters?.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  const query = `
    SELECT * FROM assignments
    WHERE ${conditions.join(' AND ')}
    ORDER BY created_at DESC
  `;

  const result = await db.query(query, values);
  return result.rows as Assignment[];
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const db = getDb();
  const result = await db.query('SELECT * FROM assignments WHERE id = $1', [id]);
  return (result.rows[0] as Assignment) || null;
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const db = getDb();

  const assignmentResult = await db.query('SELECT status FROM assignments WHERE id = $1', [id]);
  const assignment = assignmentResult.rows[0] as { status: string } | undefined;
  if (!assignment) {
    return false;
  }

  // Can only delete draft assignments
  if (assignment.status !== 'draft') {
    throw new Error(`Cannot delete assignment with status '${assignment.status}'`);
  }

  await db.query('DELETE FROM assignments WHERE id = $1', [id]);
  return true;
}
