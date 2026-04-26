import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { getDb } from '@/lib/db';
import { QUESTION_RATE_LIMIT_MINUTES } from '@shared/constants';

// POST /api/student/sessions/[sessionId]/questions
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

  const sessionData = db.prepare(`
    SELECT id, status FROM classroom_sessions WHERE id = ?
  `).get(sessionId) as { id: string; status: string } | undefined;

  if (!sessionData) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (sessionData.status !== 'live') {
    return NextResponse.json({ error: 'Questions can only be asked during live sessions' }, { status: 400 });
  }

  // Rate limit check
  const oneMinuteAgo = new Date(Date.now() - QUESTION_RATE_LIMIT_MINUTES * 60 * 1000).toISOString();

  const recentQuestion = db.prepare(`
    SELECT id FROM question_messages
    WHERE session_id = ? AND student_id = ? AND created_at > ?
    ORDER BY created_at DESC LIMIT 1
  `).get(sessionId, authResult.user.id, oneMinuteAgo);

  if (recentQuestion) {
    return NextResponse.json({ error: 'Please wait before asking another question' }, { status: 429 });
  }

  const result = db.prepare(`
    INSERT INTO question_messages (session_id, student_id, question_text)
    VALUES (?, ?, ?)
  `).run(sessionId, authResult.user.id, trimmedQuestion);

  const createdQuestion = db.prepare('SELECT * FROM question_messages WHERE id = ?').get(result.lastInsertRowid);

  return NextResponse.json({ question: createdQuestion }, { status: 201 });
};

// GET /api/student/sessions/[sessionId]/questions
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

  // Verify enrollment in the session's class before returning questions
  const session = db.prepare(`
    SELECT cs.class_id FROM classroom_sessions cs
    JOIN class_memberships cm ON cm.class_id = cs.class_id
    WHERE cs.id = ? AND cm.student_id = ?
  `).get(sessionId, authResult.user.id) as { class_id: string } | undefined;

  if (!session) {
    return NextResponse.json({ error: 'Session not found or not enrolled' }, { status: 404 });
  }

  const questions = db.prepare(`
    SELECT id, session_id, student_id, question_text, answer_text, created_at, answered_at
    FROM question_messages
    WHERE session_id = ?
    ORDER BY created_at ASC
  `).all(sessionId);

  return NextResponse.json({ questions });
};
