import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';
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

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ id: string; status: string; assignment_id: string }>(
      `SELECT id, status, assignment_id FROM live_sessions WHERE id = $1`,
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session) return { kind: 'not_found' as const };
    if (session.status !== 'live') return { kind: 'not_live' as const };

    const enrollmentResult = await client.query(
      `SELECT ar.id FROM assignment_recipients ar
       JOIN assignments a ON ar.assignment_id = a.id
       JOIN class_memberships cm ON cm.class_id = a.class_id
       WHERE ar.assignment_id = $1 AND ar.student_id = $2 AND cm.student_id = $3`,
      [session.assignment_id, studentId, studentId]
    );
    if (enrollmentResult.rows.length === 0) return { kind: 'not_enrolled' as const };

    const oneMinuteAgo = new Date(Date.now() - QUESTION_RATE_LIMIT_MINUTES * 60 * 1000).toISOString();
    const recentQuestionResult = await client.query(
      `SELECT id FROM live_session_questions
       WHERE session_id = $1 AND student_id = $2 AND created_at > $3
       ORDER BY created_at DESC LIMIT 1`,
      [sessionId, studentId, oneMinuteAgo]
    );
    if (recentQuestionResult.rows.length > 0) return { kind: 'rate_limited' as const };

    const insertResult = await client.query(
      `INSERT INTO live_session_questions (session_id, student_id, question_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [sessionId, studentId, trimmedQuestion]
    );
    return { kind: 'ok' as const, question: insertResult.rows[0] };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.kind === 'not_live') {
    return NextResponse.json({ error: 'Questions can only be asked during live sessions' }, { status: 400 });
  }
  if (result.kind === 'not_enrolled') {
    return NextResponse.json({ error: 'Not enrolled in this class' }, { status: 403 });
  }
  if (result.kind === 'rate_limited') {
    return NextResponse.json({ error: 'Please wait before asking another question' }, { status: 429 });
  }
  return NextResponse.json({ question: result.question }, { status: 201 });
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
  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const sessionResult = await client.query<{ assignment_id: string }>(
      `SELECT ls.assignment_id FROM live_sessions ls
       JOIN assignment_recipients ar ON ar.assignment_id = ls.assignment_id
       JOIN assignments a ON a.id = ls.assignment_id
       JOIN class_memberships cm ON cm.class_id = a.class_id
       WHERE ls.id = $1 AND ar.student_id = $2 AND cm.student_id = $3`,
      [sessionId, studentId, studentId]
    );
    const session = sessionResult.rows[0];
    if (!session) return { kind: 'not_found' as const };

    const questionsResult = await client.query(
      `SELECT ls_q.id, ls_q.session_id, ls_q.student_id, ls_q.question_text,
              ls_q.answer_text, ls_q.created_at, ls_q.answered_at,
              u.name as student_name
       FROM live_session_questions ls_q
       JOIN users u ON ls_q.student_id = u.id
       WHERE ls_q.session_id = $1
       ORDER BY ls_q.created_at ASC`,
      [sessionId]
    );
    return { kind: 'ok' as const, questions: questionsResult.rows };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Session not found or not enrolled' }, { status: 404 });
  }
  return NextResponse.json({ questions: result.questions });
};