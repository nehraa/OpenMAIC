/**
 * Server logic for grading a student's quiz submission and persisting the
 * attempt row. Kept separate from the route handler so it can be unit-tested
 * without spinning up a Next.js request.
 */

import type { PoolClient } from 'pg';
import { gradeQuiz, type QuizQuestionServer, type GradedQuiz } from './quiz-grading.ts';

export type SubmitError =
  | { kind: 'assignment_not_found' }
  | { kind: 'no_quiz' }
  | { kind: 'db_error'; message: string };

export interface SubmitSuccess {
  kind: 'ok';
  attemptId: string;
  graded: GradedQuiz;
}

export interface SubmitArgs {
  assignmentId: string;
  studentId: string;
  answers: Record<string, unknown>;
  /** Optional ISO timestamp recorded when the student first opened the quiz. */
  startedAt?: string;
}

interface AssignmentRow {
  id: string;
  quiz_asset_version_id: string | null;
}

interface QuizVersionRow {
  payload_json: string | null;
}

interface UpsertedAttemptRow {
  id: string;
}

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

/**
 * Grade the student's answers against the assignment's quiz payload and
 * upsert the assignment_attempts row on the supplied client. The caller is
 * responsible for opening the tenant-scoped transaction (via `withTenant`).
 *
 * The attempts table has UNIQUE(assignment_id, student_id), so we UPSERT
 * rather than INSERT — a resubmit replaces the prior score, with started_at
 * preserved on the original row (or NOW() if it's the first attempt).
 */
export async function submitQuizAttempt(
  client: PoolClient,
  args: SubmitArgs
): Promise<SubmitSuccess | SubmitError> {
  // Verify the assignment is released/closed and assigned to this student.
  const assignmentResult = await client.query<AssignmentRow>(
    `SELECT a.id, a.quiz_asset_version_id
     FROM assignments a
     JOIN assignment_recipients ar ON a.id = ar.assignment_id
     WHERE a.id = $1
       AND ar.student_id = $2
       AND a.status IN ('released', 'closed')`,
    [args.assignmentId, args.studentId]
  );
  const assignment = assignmentResult.rows[0];
  if (!assignment) return { kind: 'assignment_not_found' };
  if (!assignment.quiz_asset_version_id) return { kind: 'no_quiz' };

  const versionResult = await client.query<QuizVersionRow>(
    `SELECT payload_json FROM content_asset_versions WHERE id = $1`,
    [assignment.quiz_asset_version_id]
  );
  const questions = parseQuestions(versionResult.rows[0]?.payload_json ?? null);
  if (questions.length === 0) return { kind: 'no_quiz' };

  const graded = gradeQuiz(questions, args.answers);

  try {
    const upsertResult = await client.query<UpsertedAttemptRow>(
      `INSERT INTO assignment_attempts (
         tenant_id,
         assignment_id,
         student_id,
         started_at,
         submitted_at,
         score_percent,
         answers_json,
         completion_state
       )
       VALUES (
         (SELECT tenant_id FROM assignments WHERE id = $1),
         $1,
         $2,
         COALESCE($3::timestamptz, NOW()),
         NOW(),
         $4,
         $5,
         'graded'
       )
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET
         submitted_at = NOW(),
         score_percent = EXCLUDED.score_percent,
         answers_json = EXCLUDED.answers_json,
         completion_state = 'graded'
       RETURNING id`,
      [
        args.assignmentId,
        args.studentId,
        args.startedAt ?? null,
        graded.scorePercent,
        JSON.stringify(args.answers),
      ]
    );
    const attemptId = upsertResult.rows[0]?.id;
    if (!attemptId) {
      return { kind: 'db_error', message: 'Upsert returned no row id' };
    }
    return { kind: 'ok', attemptId, graded };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown database error';
    return { kind: 'db_error', message };
  }
}