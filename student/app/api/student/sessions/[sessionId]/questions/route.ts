import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';
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

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ id: string; status: string }>(
      `SELECT id, status FROM classroom_sessions WHERE id = $1`,
      [sessionId]
    );
    const sessionData = sessionResult.rows[0];
    if (!sessionData) return { kind: 'not_found' as const };
    if (sessionData.status !== 'live') return { kind: 'not_live' as const };

    const oneMinuteAgo = new Date(Date.now() - QUESTION_RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
    const recentQuestionResult = await client.query(
      `SELECT id FROM question_messages
       WHERE session_id = $1 AND student_id = $2 AND created_at > $3
       ORDER BY created_at DESC LIMIT 1`,
      [sessionId, authResult.user.id, oneMinuteAgo]
    );
    if (recentQuestionResult.rows.length > 0) {
      return { kind: 'rate_limited' as const };
    }

    const createdQuestionResult = await client.query(
      `INSERT INTO question_messages (session_id, student_id, question_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, authResult.user.id, trimmedQuestion]
    );
    return { kind: 'ok' as const, question: createdQuestionResult.rows[0] };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.kind === 'not_live') {
    return NextResponse.json({ error: 'Questions can only be asked during live sessions' }, { status: 400 });
  }
  if (result.kind === 'rate_limited') {
    return NextResponse.json({ error: 'Please wait before asking another question' }, { status: 429 });
  }
  return NextResponse.json({ question: result.question }, { status: 201 });
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

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ class_id: string }>(
      `SELECT cs.class_id FROM classroom_sessions cs
       JOIN class_memberships cm ON cm.class_id = cs.class_id
       WHERE cs.id = $1 AND cm.student_id = $2`,
      [sessionId, authResult.user.id]
    );
    const session = sessionResult.rows[0];
    if (!session) return { kind: 'not_found' as const };

    const questionsResult = await client.query(
      `SELECT id, session_id, student_id, question_text, answer_text, created_at, answered_at
       FROM question_messages
       WHERE session_id = $1
       ORDER BY created_at ASC`,
      [sessionId]
    );
    return { kind: 'ok' as const, questions: questionsResult.rows };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found or not enrolled' }, { status: 404 });
  }
  return NextResponse.json({ questions: result.questions });
};
