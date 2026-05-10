import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '../../../../middleware';
import { getDb } from '../../../../lib/db';
import type { AuthContext } from '../../../../middleware/auth';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  personalityNotes: z.string().optional(),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading', 'mixed']).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendedTopics: z.array(z.string()).optional()
});

// GET /api/teacher/students/[studentId] - Get student detail with classes and assignments
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { studentId } = await routeCtx.params;
  const db = getDb();

  // First check if student exists at all
  const studentExists = await db.query('SELECT id, name, phone_e164, status, created_at FROM users WHERE id = $1', [studentId]);

  if (studentExists.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const student = studentExists.rows[0];

  // Check if student is in any of teacher's classes
  const teacherClassesResult = await db.query(`
    SELECT c.id, c.name, c.subject, c.batch, cm.enrolled_at
    FROM classes c
    JOIN class_memberships cm ON c.id = cm.class_id
    WHERE cm.student_id = $1 AND c.teacher_id = $2
    ORDER BY cm.enrolled_at DESC
  `, [studentId, ctx.user.id]);

  // Get student's assignment progress (only for teacher's classes)
  const assignmentsResult = await db.query(`
    SELECT
      a.id,
      a.title,
      a.status,
      a.due_at,
      ar.visibility_status,
      aa.completion_state,
      aa.score_percent
    FROM assignments a
    JOIN assignment_recipients ar ON a.id = ar.assignment_id
    JOIN classes c ON a.class_id = c.id
    LEFT JOIN assignment_attempts aa ON a.id = aa.assignment_id AND aa.student_id = ar.student_id
    WHERE ar.student_id = $1 AND c.teacher_id = $2
    ORDER BY a.created_at DESC
  `, [studentId, ctx.user.id]);

  // Get student personality/notes if exists
  let studentProfile = null;
  try {
    const personalityResult = await db.query(`
      SELECT personality_notes, learning_style, strengths, weaknesses, created_at, updated_at
      FROM student_profiles
      WHERE student_id = $1
    `, [studentId]);
    studentProfile = personalityResult.rows.length > 0 ? personalityResult.rows[0] : null;
  } catch (profileErr) {
    // student_profiles table may not exist yet - ignore
    console.warn('student_profiles table query failed:', profileErr);
  }

  return NextResponse.json({
    student: {
      ...student,
      classes: teacherClassesResult.rows,
      assignments: assignmentsResult.rows,
      profile: studentProfile
    }
  });
});

// PATCH /api/teacher/students/[studentId] - Update student profile/personality
export const PATCH = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext, routeCtx: { params: Promise<Record<string, string>> }) => {
  const { studentId } = await routeCtx.params;
  const db = getDb();

  // Verify student exists first
  const studentExists = await db.query('SELECT id FROM users WHERE id = $1', [studentId]);
  if (studentExists.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  // Check if student is in any of teacher's classes
  const inTeacherClass = await db.query(`
    SELECT c.id FROM classes c
    JOIN class_memberships cm ON c.id = cm.class_id
    WHERE cm.student_id = $1 AND c.teacher_id = $2
    LIMIT 1
  `, [studentId, ctx.user.id]);

  if (inTeacherClass.rows.length === 0) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Upsert student profile (table may not exist yet)
  try {
    await db.query(`
      INSERT INTO student_profiles (student_id, personality_notes, learning_style, strengths, weaknesses, recommended_topics)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (student_id) DO UPDATE SET
        personality_notes = COALESCE($2, student_profiles.personality_notes),
        learning_style = COALESCE($3, student_profiles.learning_style),
        strengths = COALESCE($4, student_profiles.strengths),
        weaknesses = COALESCE($5, student_profiles.weaknesses),
        recommended_topics = COALESCE($6, student_profiles.recommended_topics),
        updated_at = NOW()
    `, [studentId, data.personalityNotes || null, data.learningStyle || null, data.strengths || null, data.weaknesses || null, data.recommendedTopics || null]);
  } catch (upsertErr) {
    console.warn('Failed to upsert student_profiles:', upsertErr);
  }

  // Fetch updated profile
  let updatedProfile = null;
  try {
    const updatedResult = await db.query(`
      SELECT personality_notes, learning_style, strengths, weaknesses, recommended_topics, created_at, updated_at
      FROM student_profiles
      WHERE student_id = $1
    `, [studentId]);
    updatedProfile = updatedResult.rows[0];
  } catch (fetchErr) {
    console.warn('Failed to fetch student_profiles:', fetchErr);
  }

  return NextResponse.json({ profile: updatedProfile });
});
