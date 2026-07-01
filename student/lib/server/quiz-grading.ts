/**
 * Quiz grading logic for the student app.
 *
 * The same content_asset_versions row can hold quiz payloads in two shapes:
 *   - Editor-created ('mcq' | 'short_answer') — see @shared/types/quiz.
 *   - AI-generated ('multiple_choice' | 'true_false' | 'short_answer') — see
 *     teacher/lib/server/ai-providers.ts.
 *
 * This module normalizes both into a single grading interface.
 */

export type QuestionType = 'mcq' | 'short_answer' | 'multiple_choice' | 'true_false';

export interface QuizQuestionServer {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  points: number;
  // Editor format
  correctIndex?: number;
  sampleAnswer?: string;
  // AI format
  correct_index?: number;
  correct_answer?: string | boolean;
}

export interface GradedQuestion {
  id: string;
  type: QuestionType;
  pointsEarned: number;
  totalPoints: number;
  isCorrect: boolean;
  /** True when the question was open-ended (no answer key present) and got full credit. */
  openEnded: boolean;
}

export interface GradedQuiz {
  pointsEarned: number;
  totalPoints: number;
  scorePercent: number;
  results: GradedQuestion[];
}

export interface ClientQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  points: number;
}

/** Strip server-only answer fields before sending a question to the client. */
export function toClientQuestion(q: QuizQuestionServer): ClientQuestion {
  const base: ClientQuestion = {
    id: q.id,
    type: q.type,
    question: q.question,
    points: q.points,
  };
  if (q.options) base.options = q.options;
  return base;
}

/** Lowercase, trim, and collapse internal whitespace. */
export function normalizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Normalize a boolean-like answer coming from the client (string or bool). */
export function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === 't' || v === 'yes' || v === '1') return true;
    if (v === 'false' || v === 'f' || v === 'no' || v === '0') return false;
  }
  return null;
}

/** Normalize a number-like answer (numeric string or number) into a non-negative int, or null. */
export function normalizeIndex(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isInteger(n) && n >= 0) return n;
  }
  return null;
}

/** Resolve the canonical correct index for a multiple-choice question across both formats. */
export function getCorrectIndex(q: QuizQuestionServer): number | null {
  if (typeof q.correctIndex === 'number') return q.correctIndex;
  if (typeof q.correct_index === 'number') return q.correct_index;
  return null;
}

/** Resolve the canonical correct option text for a multiple-choice question. */
export function getCorrectOptionText(q: QuizQuestionServer): string | null {
  const idx = getCorrectIndex(q);
  if (idx === null || !Array.isArray(q.options) || idx >= q.options.length) return null;
  return q.options[idx] ?? null;
}

/** Resolve the canonical answer key for a true_false question. */
export function getTrueFalseAnswer(q: QuizQuestionServer): boolean | null {
  if (typeof q.correct_answer === 'boolean') return q.correct_answer;
  if (typeof q.correct_answer === 'string') return normalizeBoolean(q.correct_answer);
  return null;
}

/** Resolve the canonical answer key for a short_answer question. */
export function getShortAnswerKey(q: QuizQuestionServer): string | null {
  if (typeof q.sampleAnswer === 'string' && q.sampleAnswer.trim() !== '') {
    return q.sampleAnswer;
  }
  if (typeof q.correct_answer === 'string' && q.correct_answer.trim() !== '') {
    return q.correct_answer;
  }
  return null;
}

/** Grade a single question. Returns a GradedQuestion (always includes totalPoints). */
export function gradeQuestion(
  question: QuizQuestionServer,
  answer: unknown
): GradedQuestion {
  const base = {
    id: question.id,
    type: question.type,
    totalPoints: question.points,
  };

  if (question.type === 'mcq' || question.type === 'multiple_choice') {
    const correctText = getCorrectOptionText(question);
    const correctIdx = getCorrectIndex(question);
    let isCorrect = false;

    if (answer === null || answer === undefined) {
      isCorrect = false;
    } else if (typeof answer === 'number') {
      if (correctIdx !== null) isCorrect = answer === correctIdx;
    } else if (typeof answer === 'string') {
      // Accept either an index string ("0".."3") or the option text.
      const asIndex = normalizeIndex(answer);
      if (asIndex !== null && correctIdx !== null && asIndex === correctIdx) {
        isCorrect = true;
      } else if (correctText !== null) {
        // Fall through to text match — covers "4" matching options[1] = "4",
        // and also works when the student sent the literal option label.
        isCorrect = normalizeString(answer) === normalizeString(correctText);
      }
    }

    return {
      ...base,
      pointsEarned: isCorrect ? question.points : 0,
      isCorrect,
      openEnded: false,
    };
  }

  if (question.type === 'true_false') {
    const expected = getTrueFalseAnswer(question);
    const actual = normalizeBoolean(answer);
    const isCorrect = expected !== null && actual !== null && actual === expected;
    return {
      ...base,
      pointsEarned: isCorrect ? question.points : 0,
      isCorrect,
      openEnded: false,
    };
  }

  // short_answer
  const key = getShortAnswerKey(question);
  if (key === null) {
    // Open-ended: no answer key present, award full credit for any non-empty answer.
    const answered = typeof answer === 'string' ? answer.trim() !== '' : answer !== null && answer !== undefined;
    return {
      ...base,
      pointsEarned: answered ? question.points : 0,
      isCorrect: answered,
      openEnded: true,
    };
  }

  if (typeof answer !== 'string') {
    return { ...base, pointsEarned: 0, isCorrect: false, openEnded: false };
  }

  const normalizedKey = normalizeString(key);
  const normalizedAnswer = normalizeString(answer);
  const isCorrect =
    normalizedAnswer === normalizedKey ||
    normalizedAnswer.includes(normalizedKey) ||
    normalizedKey.includes(normalizedAnswer);

  return {
    ...base,
    pointsEarned: isCorrect ? question.points : 0,
    isCorrect,
    openEnded: false,
  };
}

/** Grade a whole quiz payload against a student's answer map. */
export function gradeQuiz(
  questions: QuizQuestionServer[],
  answers: Record<string, unknown>
): GradedQuiz {
  const results = questions.map((q) => gradeQuestion(q, answers[q.id]));
  const totalPoints = results.reduce((sum, r) => sum + r.totalPoints, 0);
  const pointsEarned = results.reduce((sum, r) => sum + r.pointsEarned, 0);
  const scorePercent = totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0;
  return { pointsEarned, totalPoints, scorePercent, results };
}
