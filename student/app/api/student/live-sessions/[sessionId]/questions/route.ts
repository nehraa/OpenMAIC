import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';
import { QUESTION_RATE_LIMIT_MINUTES } from '@shared/constants';

// POST /api/student/live-sessions/[sessionId]/questions
export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;
  const { question } = await request.json();

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
  }

  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length > 1000) {
    return NextResponse.json({ error: 'Question must be 1000 characters or less' }, { status: 400 });
  }

  const db = getDb();

  // Get the live session and verify it exists and is live
  const session = db.prepare(`
    SELECT id, status, assignment_id FROM live_sessions WHERE id = ?
  `).get(sessionId) as { id: string; status: string; assignment_id: string } | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.status !== 'live') {
    return NextResponse.json({ error: 'Questions can only be asked during live sessions' }, { status: 400 });
  }

  // Verify student is enrolled in the assignment's class
  const enrollment = db.prepare(`
    SELECT ar.id FROM assignment_recipients ar
    JOIN assignments a ON ar.assignment_id = a.id
    JOIN class_memberships cm ON cm.class_id = a.class_id
    WHERE ar.assignment_id = ? AND cm.student_id = ?
  `).get(session.assignment_id, authResult.user.id);

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - QUESTION_RATE_LIMIT_MINUTES * 60 * 1000).toISOString();

  const recentQuestion = db.prepare(`
    SELECT id FROM live_session_questions
    WHERE session_id = ? AND student_id = ? AND created_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).get(sessionId, authResult.user.id, oneMinuteAgo);

  if (recentQuestion) {
    return NextResponse.json({ error: 'Please wait before asking another question' }, { status: 429 });
  }

  const result = db.prepare(`
    INSERT INTO live_session_questions (session_id, student_id, question_text)
    VALUES (?, ?, ?)
  `).run(sessionId, authResult.user.id, trimmedQuestion);

  const createdQuestion = db.prepare('SELECT * FROM live_session_questions WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ question: createdQuestion }, { status: 201 });
};

// GET /api/student/live-sessions/[sessionId]/questions
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { sessionId } = await context.params;

  const db = getDb();

  // Get the live session and verify enrollment
  const session = db.prepare(`
    SELECT ls.assignment_id FROM live_sessions ls
    JOIN assignment_recipients ar ON ar.assignment_id = ls.assignment_id
    JOIN class_memberships cm ON cm.class_id = ar.assignment_id
    WHERE ls.id = ? AND cm.student_id = ?
  `).get(sessionId, authResult.user.id) as { assignment_id: string } | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found or not enrolled' }, { status: 404 });
  }

  const questions = db.prepare(`
    SELECT ls_q.id, ls_q.session_id, ls_q.student_id, ls_q.question_text, ls_q.answer_text, ls_q.created_at, ls_q.answered_at, u.name as student_name
    FROM live_session_questions ls_q
    JOIN users u ON ls_q.student_id = u.id
    WHERE ls_q.session_id = ?
    ORDER BY ls_q.created_at ASC
  `).all(sessionId);

  return NextResponse.json({ questions });
};
