import { test } from 'node:test';
import assert from 'node:assert/strict';

// ----- Test driver ----------------------------------------------------------
// Install a per-test handler on the global mock used by test/db-stub.mjs.
// The handler decides what getDb().query() returns for each SQL statement.

type QueryResult<T> = { rows: T[] };
type QueryHandler = (sql: string, params: unknown[]) => Promise<QueryResult<unknown>>;

interface MockState {
  assignmentRow: { id: string; quiz_asset_version_id: string | null } | null;
  versionPayload: string | null;
  upsertCalls: number;
  upsertedAttempts: Array<{ id: string; params: unknown[] }>;
  upsertError: Error | null;
}

const state: MockState = {
  assignmentRow: null,
  versionPayload: null,
  upsertCalls: 0,
  upsertedAttempts: [],
  upsertError: null,
};

const handler: QueryHandler = async (sql, params) => {
  const s = sql.trim();
  if (s.startsWith('SELECT a.id, a.quiz_asset_version_id')) {
    return { rows: state.assignmentRow ? [state.assignmentRow] : [] };
  }
  if (s.startsWith('SELECT payload_json FROM content_asset_versions')) {
    return { rows: state.versionPayload ? [{ payload_json: state.versionPayload }] : [] };
  }
  if (s.startsWith('INSERT INTO assignment_attempts')) {
    state.upsertCalls += 1;
    if (state.upsertError) throw state.upsertError;
    const attemptId = `attempt-${state.upsertCalls}`;
    state.upsertedAttempts.push({ id: attemptId, params });
    return { rows: [{ id: attemptId }] };
  }
  throw new Error(`Unexpected SQL in test: ${s}`);
};

(globalThis as unknown as { __OPENMAIC_STUDENT_DB_MOCK__: { handler: QueryHandler } })
  .__OPENMAIC_STUDENT_DB_MOCK__ = { handler };

// Now import the module under test. The test/db-loader.mjs loader (registered
// via --import in package.json) redirects ../db/index.ts to test/db-stub.mjs,
// which reads the handler we just installed.
const { submitQuizAttempt } = await import('./quiz-submit.ts');

// Minimal client stub: submitQuizAttempt only calls .query(); delegate to
// the per-test handler installed above so query() returns the stubbed rows.
const client = {
  query: (sql: string, params: unknown[]) => handler(sql, params),
} as unknown as Parameters<typeof submitQuizAttempt>[0];

const QUIZ_PAYLOAD = JSON.stringify({
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctIndex: 1,
      points: 2,
    },
    {
      id: 'q2',
      type: 'true_false',
      question: 'Sky is blue',
      correct_answer: true,
      points: 1,
    },
  ],
});

function resetState() {
  state.assignmentRow = null;
  state.versionPayload = null;
  state.upsertCalls = 0;
  state.upsertedAttempts = [];
  state.upsertError = null;
}

// ----- Tests ---------------------------------------------------------------

test('submitQuizAttempt: happy path grades and upserts', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = QUIZ_PAYLOAD;

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4', q2: true },
  });

  assert.equal(result.kind, 'ok');
  if (result.kind !== 'ok') throw new Error('unreachable');
  assert.equal(result.graded.scorePercent, 100);
  assert.equal(result.graded.pointsEarned, 3);
  assert.equal(result.graded.totalPoints, 3);
  assert.equal(result.attemptId, 'attempt-1');
  assert.equal(state.upsertCalls, 1);
  // params order: assignmentId, studentId, startedAt, scorePercent, JSON.stringify(answers)
  const p = state.upsertedAttempts[0].params;
  assert.equal(p[0], 'a1');
  assert.equal(p[1], 's1');
  assert.equal(p[2], null); // no startedAt
  assert.equal(p[3], 100);
  assert.deepEqual(JSON.parse(p[4] as string), { q1: '4', q2: true });
});

test('submitQuizAttempt: missing assignment returns assignment_not_found', async () => {
  resetState();
  state.assignmentRow = null;
  state.versionPayload = QUIZ_PAYLOAD;

  const result = await submitQuizAttempt(client, {
    assignmentId: 'missing',
    studentId: 's1',
    answers: { q1: '4', q2: true },
  });

  assert.equal(result.kind, 'assignment_not_found');
  assert.equal(state.upsertCalls, 0);
});

test('submitQuizAttempt: missing quiz_asset_version_id returns no_quiz', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: null };
  state.versionPayload = QUIZ_PAYLOAD;

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4', q2: true },
  });

  assert.equal(result.kind, 'no_quiz');
  assert.equal(state.upsertCalls, 0);
});

test('submitQuizAttempt: empty questions array returns no_quiz', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = JSON.stringify({ questions: [] });

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4' },
  });

  assert.equal(result.kind, 'no_quiz');
});

test('submitQuizAttempt: empty answers grades to 0% but still upserts', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = QUIZ_PAYLOAD;

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: {},
  });

  assert.equal(result.kind, 'ok');
  if (result.kind !== 'ok') throw new Error('unreachable');
  assert.equal(result.graded.scorePercent, 0);
  assert.equal(result.graded.pointsEarned, 0);
  assert.equal(state.upsertCalls, 1);
  assert.equal(state.upsertedAttempts[0].params[3], 0);
});

test('submitQuizAttempt: resubmit replaces prior score (UPSERT path)', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = QUIZ_PAYLOAD;

  const first = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4', q2: true },
  });
  assert.equal(first.kind, 'ok');
  if (first.kind !== 'ok') throw new Error('unreachable');
  assert.equal(first.attemptId, 'attempt-1');
  assert.equal(state.upsertCalls, 1);

  // Student re-submits with a worse answer; same (assignment, student) pair.
  const second = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '3', q2: false },
  });
  assert.equal(second.kind, 'ok');
  if (second.kind !== 'ok') throw new Error('unreachable');
  assert.equal(second.attemptId, 'attempt-2');
  assert.equal(state.upsertCalls, 2);
  // The second call overwrote the prior score.
  assert.equal(state.upsertedAttempts[1].params[3], 0);
});

test('submitQuizAttempt: startedAt is passed through to the UPSERT', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = QUIZ_PAYLOAD;

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4', q2: true },
    startedAt: '2026-06-01T10:00:00.000Z',
  });

  assert.equal(result.kind, 'ok');
  assert.equal(state.upsertedAttempts[0].params[2], '2026-06-01T10:00:00.000Z');
});

test('submitQuizAttempt: db error during UPSERT surfaces a typed error', async () => {
  resetState();
  state.assignmentRow = { id: 'a1', quiz_asset_version_id: 'v1' };
  state.versionPayload = QUIZ_PAYLOAD;
  state.upsertError = new Error('connection lost');

  const result = await submitQuizAttempt(client, {
    assignmentId: 'a1',
    studentId: 's1',
    answers: { q1: '4', q2: true },
  });

  assert.equal(result.kind, 'db_error');
  if (result.kind !== 'db_error') throw new Error('unreachable');
  assert.equal(result.message, 'connection lost');
});