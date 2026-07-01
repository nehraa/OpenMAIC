import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/lib/auth/require-auth';
import { withTenant } from '@/lib/db';
import {
  toClientQuestion,
  type QuizQuestionServer,
} from '@/lib/server/quiz-grading';

const ClientQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['mcq', 'short_answer', 'multiple_choice', 'true_false']),
  question: z.string(),
  options: z.array(z.string()).optional(),
  points: z.number(),
});

const QuizResponseSchema = z.object({
  assignmentId: z.string(),
  title: z.string(),
  questions: z.array(ClientQuestionSchema),
  timeLimit: z.number().int().positive(),
  attempt: z
    .object({
      submitted: z.boolean(),
      score: z.number().nullable(),
      submittedAt: z.string().nullable(),
    })
    .nullable(),
});

interface AssignmentRow {
  id: string;
  title: string;
  quiz_asset_version_id: string | null;
}

interface QuizVersionRow {
  payload_json: string | null;
}

interface AttemptRow {
  completion_state: string;
  submitted_at: string | null;
  score_percent: number | null;
}

const TIME_LIMIT_SECONDS = 600;

function parseQuestions(payloadJson: string | null): QuizQuestionServer[] {
  if (!payloadJson) return [];
  try {
    const payload = JSON.parse(payloadJson) as { questions?: unknown };
    if (!payload || !Array.isArray(payload.questions)) return [];
    return payload.questions.filter(
      (q): q is QuizQuestionServer =>
        typeof q === 'object' &&
        q !== null &&
        typeof (q as Record<string, unknown>).id === 'string' &&
        typeof (q as Record<string, unknown>).type === 'string'
    );
  } catch {
    return [];
  }
}

// GET /api/student/quizzes/[assignmentId]
// Returns the quiz definition (without correct answers) plus the current attempt state.
export const GET = async (
  request: NextRequest,
  context: { params: Promise<{ assignmentId: string }> }
) => {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const roleCheck = requireRole(authResult.user, ['student_classroom', 'student_b2c']);
  if (roleCheck) return roleCheck;

  const { assignmentId } = await context.params;
  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
  }

  const studentId = authResult.user.id;

  const result = await withTenant(authResult.tenantId, async (client) => {
    const assignmentResult = await client.query<AssignmentRow>(
      `SELECT a.id, a.title, a.quiz_asset_version_id
       FROM assignments a
       JOIN assignment_recipients ar ON a.id = ar.assignment_id
       WHERE a.id = $1
         AND ar.student_id = $2
         AND a.status IN ('released', 'closed')`,
      [assignmentId, studentId]
    );
    const assignment = assignmentResult.rows[0];
    if (!assignment) return { kind: 'not_found' as const };
    if (!assignment.quiz_asset_version_id) return { kind: 'no_quiz' as const };

    const versionResult = await client.query<QuizVersionRow>(
      `SELECT payload_json FROM content_asset_versions WHERE id = $1`,
      [assignment.quiz_asset_version_id]
    );
    const version = versionResult.rows[0];
    const questions = parseQuestions(version?.payload_json ?? null);
    if (questions.length === 0) return { kind: 'no_quiz' as const };

    const attemptResult = await client.query<AttemptRow>(
      `SELECT completion_state, submitted_at, score_percent
       FROM assignment_attempts
       WHERE assignment_id = $1 AND student_id = $2`,
      [assignmentId, studentId]
    );
    return { kind: 'ok' as const, assignment, attempt: attemptResult.rows[0] ?? null, questions };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }
  if (result.kind === 'no_quiz') {
    return NextResponse.json({ error: 'No quiz for this assignment' }, { status: 404 });
  }

  const response = {
    assignmentId: result.assignment.id,
    title: result.assignment.title,
    questions: result.questions.map(toClientQuestion),
    timeLimit: TIME_LIMIT_SECONDS,
    attempt: result.attempt
      ? {
          submitted:
            result.attempt.completion_state === 'submitted' ||
            result.attempt.completion_state === 'graded',
          score: result.attempt.score_percent,
          submittedAt: result.attempt.submitted_at,
        }
      : null,
  };

  const validated = QuizResponseSchema.safeParse(response);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Quiz payload failed validation', issues: validated.error.issues },
      { status: 500 }
    );
  }

  return NextResponse.json(validated.data);
};