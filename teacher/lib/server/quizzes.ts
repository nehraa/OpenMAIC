import { getDb } from '../db';
import type {
  Quiz,
  QuizVersion,
  QuizQuestion,
  QuizPayload,
  CreateQuizData,
  UpdateQuizData,
  AddQuestionData,
  UpdateQuestionData,
  MCQQuestion,
  ShortAnswerQuestion
} from '@shared/types/quiz';
import { z } from 'zod';

// Validation schemas
export const MCQQuestionSchema = z.object({
  type: z.literal('mcq'),
  id: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  points: z.number().int().positive()
});

export const ShortAnswerQuestionSchema = z.object({
  type: z.literal('short_answer'),
  id: z.string().min(1),
  question: z.string().min(1),
  sampleAnswer: z.string(),
  points: z.number().int().positive()
});

export const QuizPayloadSchema = z.object({
  questions: z.array(z.union([MCQQuestionSchema, ShortAnswerQuestionSchema]))
});

export interface GeneratedQuestion {
  type: 'mcq' | 'short_answer';
  question: string;
  options?: string[];
  correctIndex?: number;
  sampleAnswer?: string;
  points: number;
}

export async function generateQuizFromSlides(slideAssetVersionId: string): Promise<GeneratedQuestion[]> {
  const db = getDb();

  const versionResult = await db.query('SELECT payload_json FROM content_asset_versions WHERE id = $1', [slideAssetVersionId]);
  const versionRow = versionResult.rows[0] as { payload_json: string } | undefined;

  if (!versionRow) {
    throw new Error('Slide asset version not found');
  }

  let payload: { slides?: Array<{ content?: string; text?: string; title?: string }> };
  try {
    payload = JSON.parse(versionRow.payload_json);
  } catch {
    throw new Error('Invalid slide content JSON');
  }

  const slides = payload.slides || [];
  const questions: GeneratedQuestion[] = [];

  for (const slide of slides) {
    const text = slide.content || slide.text || '';
    const title = slide.title || '';

    if (text.length > 20) {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

      if (sentences.length >= 2) {
        const questionText = sentences[0].trim();
        if (questionText.length > 15) {
          const distractors = [
            'This is a common misconception about the topic',
            'The correct answer relates to the main concept',
            'Another possible interpretation that is incorrect'
          ];

          questions.push({
            type: 'mcq',
            question: `Based on the slide: ${questionText.substring(0, 80)}...?`,
            options: [
              questionText,
              distractors[0],
              distractors[1],
              distractors[2]
            ],
            correctIndex: 0,
            points: 1
          });
        }
      }
    }
  }

  if (questions.length === 0 && slides.length > 0) {
    const firstSlideTitle = slides[0]?.title || '';
    questions.push({
      type: 'short_answer',
      question: `Summarize the key concepts covered in the slide deck titled "${firstSlideTitle || 'the presentation'}"`,
      sampleAnswer: 'The slide deck covers important concepts that were presented in the lesson.',
      points: 2
    });
  }

  return questions.slice(0, 10);
}

export async function createQuiz(data: CreateQuizData): Promise<Quiz> {
  const db = getDb();

  const quizResult = await db.query(`
    INSERT INTO content_assets (owner_teacher_id, type, title, subject_tag, source_kind, source_ref)
    VALUES ($1, 'quiz', $2, $3, 'manual', '')
    RETURNING *
  `, [data.teacherId, data.title, data.subjectTag || '']);

  const quiz = quizResult.rows[0] as Quiz;
  const assetId = quiz.id;

  await db.query(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES ($1, 1, '{"questions":[]}', 'draft')
  `, [assetId]);

  return quiz;
}

export async function updateQuiz(id: string, data: UpdateQuizData): Promise<Quiz | null> {
  const db = getDb();

  const quizResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [id, 'quiz']);
  const quiz = quizResult.rows[0] as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [id]);
  const currentVersion = versionResult.rows[0] as QuizVersion | undefined;

  if (!currentVersion || currentVersion.status !== 'draft') {
    throw new Error(`Cannot update quiz with status '${currentVersion?.status || 'unknown'}'`);
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];
  let paramIndex = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.subjectTag !== undefined) {
    fields.push(`subject_tag = $${paramIndex++}`);
    values.push(data.subjectTag);
  }

  if (fields.length > 0) {
    fields.push(`updated_at = NOW()`);
    values.push(id);
    await db.query(`UPDATE content_assets SET ${fields.join(', ')} WHERE id = $${paramIndex}`, values);
  }

  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [id]);
  return result.rows[0] as Quiz;
}

export async function publishQuiz(id: string): Promise<Quiz | null> {
  const db = getDb();

  const quizResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [id, 'quiz']);
  const quiz = quizResult.rows[0] as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [id]);
  const currentVersion = versionResult.rows[0] as QuizVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for quiz');
  }

  if (currentVersion.status !== 'draft') {
    throw new Error(`Cannot publish quiz with status '${currentVersion.status}'`);
  }

  const payload: QuizPayload = JSON.parse(currentVersion.payload_json);
  if (payload.questions.length === 0) {
    throw new Error('Cannot publish an empty quiz');
  }

  await db.query(`
    UPDATE content_asset_versions SET status = 'archived' WHERE asset_id = $1 AND status = 'published'
  `, [id]);

  await db.query(`
    UPDATE content_asset_versions SET status = 'published' WHERE id = $1
  `, [currentVersion.id]);

  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [id]);
  return result.rows[0] as Quiz;
}

export async function duplicateQuiz(id: string): Promise<Quiz | null> {
  const db = getDb();

  const quizResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [id, 'quiz']);
  const quiz = quizResult.rows[0] as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [id]);
  const currentVersion = versionResult.rows[0] as QuizVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for quiz');
  }

  const maxVersionResult = await db.query(`
    SELECT MAX(version_number) as max_v FROM content_asset_versions WHERE asset_id = $1
  `, [id]);
  const maxVersion = maxVersionResult.rows[0] as { max_v: number };

  await db.query(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES ($1, $2, $3, 'draft')
  `, [id, maxVersion.max_v + 1, currentVersion.payload_json]);

  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [id]);
  return result.rows[0] as Quiz;
}

export async function getQuizWithVersion(id: string): Promise<{ quiz: Quiz; version: QuizVersion; payload: QuizPayload } | null> {
  const db = getDb();

  const quizResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [id, 'quiz']);
  const quiz = quizResult.rows[0] as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [id]);
  const version = versionResult.rows[0] as QuizVersion | undefined;

  if (!version) {
    return null;
  }

  const payload: QuizPayload = JSON.parse(version.payload_json);
  return { quiz, version, payload };
}

export async function addQuestion(quizId: string, questionData: AddQuestionData): Promise<QuizQuestion> {
  const db = getDb();

  const quizResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [quizId, 'quiz']);
  const quiz = quizResult.rows[0] as Quiz | undefined;
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 ORDER BY version_number DESC LIMIT 1
  `, [quizId]);
  const currentVersion = versionResult.rows[0] as QuizVersion | undefined;

  if (!currentVersion || currentVersion.status !== 'draft') {
    throw new Error('Can only add questions to draft quizzes');
  }

  const payload: QuizPayload = JSON.parse(currentVersion.payload_json);

  const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  let question: QuizQuestion;

  if (questionData.type === 'mcq') {
    if (!questionData.options || questionData.options.length < 2) {
      throw new Error('MCQ must have at least 2 options');
    }
    if (questionData.correctIndex === undefined || questionData.correctIndex < 0 || questionData.correctIndex >= questionData.options.length) {
      throw new Error('Invalid correct answer index');
    }

    const mcqQuestion: MCQQuestion = {
      type: 'mcq',
      id: questionId,
      question: questionData.question,
      options: questionData.options,
      correctIndex: questionData.correctIndex,
      points: questionData.points
    };
    question = mcqQuestion;
  } else {
    const saQuestion: ShortAnswerQuestion = {
      type: 'short_answer',
      id: questionId,
      question: questionData.question,
      sampleAnswer: questionData.sampleAnswer || '',
      points: questionData.points
    };
    question = saQuestion;
  }

  payload.questions.push(question);

  await db.query(`
    UPDATE content_asset_versions SET payload_json = $1 WHERE id = $2
  `, [JSON.stringify(payload), currentVersion.id]);

  return question;
}

export async function updateQuestion(quizId: string, questionId: string, data: UpdateQuestionData): Promise<QuizQuestion | null> {
  const db = getDb();

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 AND status = 'draft' ORDER BY version_number DESC LIMIT 1
  `, [quizId]);
  const targetVersion = versionResult.rows[0] as QuizVersion | null;

  if (!targetVersion) {
    return null;
  }

  const payload: QuizPayload = JSON.parse(targetVersion.payload_json);
  const questionIndex = payload.questions.findIndex(q => q.id === questionId);

  if (questionIndex === -1) {
    return null;
  }

  const question = payload.questions[questionIndex];

  if (question.type === 'mcq') {
    const mcq = question as MCQQuestion;
    if (data.question !== undefined) mcq.question = data.question;
    if (data.options !== undefined) {
      if (data.options.length < 2) throw new Error('MCQ must have at least 2 options');
      mcq.options = data.options;
    }
    if (data.correctIndex !== undefined) {
      if (data.correctIndex < 0 || data.correctIndex >= mcq.options.length) {
        throw new Error('Invalid correct answer index');
      }
      mcq.correctIndex = data.correctIndex;
    }
    if (data.points !== undefined) mcq.points = data.points;
  } else {
    const sa = question as ShortAnswerQuestion;
    if (data.question !== undefined) sa.question = data.question;
    if (data.sampleAnswer !== undefined) sa.sampleAnswer = data.sampleAnswer;
    if (data.points !== undefined) sa.points = data.points;
  }

  payload.questions[questionIndex] = question;

  await db.query(`
    UPDATE content_asset_versions SET payload_json = $1 WHERE id = $2
  `, [JSON.stringify(payload), targetVersion.id]);

  return question;
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<boolean> {
  const db = getDb();

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions WHERE asset_id = $1 AND status = 'draft' ORDER BY version_number DESC LIMIT 1
  `, [quizId]);
  const version = versionResult.rows[0] as QuizVersion | null;

  if (!version) {
    return false;
  }

  const payload: QuizPayload = JSON.parse(version.payload_json);
  const idx = payload.questions.findIndex(q => q.id === questionId);
  if (idx === -1) {
    return false;
  }

  payload.questions.splice(idx, 1);
  await db.query(`
    UPDATE content_asset_versions SET payload_json = $1 WHERE id = $2
  `, [JSON.stringify(payload), version.id]);
  return true;
}

export interface ListQuizzesFilters {
  status?: 'draft' | 'published';
}

export async function getQuizzesForTeacher(teacherId: string, filters?: ListQuizzesFilters): Promise<(Quiz & { version: QuizVersion; questionCount: number })[]> {
  const db = getDb();

  const conditions: string[] = ['ca.owner_teacher_id = $1', 'ca.type = $2'];
  const values: (string | undefined)[] = [teacherId, 'quiz'];
  let paramIndex = 3;

  if (filters?.status) {
    conditions.push(`cav.status = $${paramIndex++}`);
    values.push(filters.status);
  }

  const query = `
    SELECT ca.*, cav.id as v_id, cav.version_number, cav.payload_json, cav.status as v_status, cav.created_at as v_created_at,
           JSON_EXTRACT(cav.payload_json, '$.questions') as questions_json
    FROM content_assets ca
    JOIN content_asset_versions cav ON ca.id = cav.asset_id
    WHERE ${conditions.join(' AND ')}
    AND cav.version_number = (
      SELECT MAX(cav2.version_number) FROM content_asset_versions cav2 WHERE cav2.asset_id = ca.id
    )
    ORDER BY ca.created_at DESC
  `;

  const result = await db.query(query, values);
  const rows = result.rows as Array<{
    id: string;
    owner_teacher_id: string;
    title: string;
    subject_tag: string;
    source_kind: string;
    source_ref: string;
    created_at: string;
    updated_at: string;
    v_id: string;
    version_number: number;
    payload_json: string;
    v_status: 'draft' | 'published' | 'archived';
    v_created_at: string;
    questions_json: string;
  }>;

  return rows.map(row => {
    let questions: QuizQuestion[] = [];
    try {
      questions = JSON.parse(row.questions_json || '[]');
    } catch { /* empty */ }

    return {
      id: row.id,
      owner_teacher_id: row.owner_teacher_id,
      title: row.title,
      subject_tag: row.subject_tag,
      source_kind: row.source_kind as 'manual' | 'ai_generated' | 'imported',
      source_ref: row.source_ref,
      created_at: row.created_at,
      updated_at: row.updated_at,
      version: {
        id: row.v_id,
        asset_id: row.id,
        version_number: row.version_number,
        payload_json: row.payload_json,
        status: row.v_status,
        created_at: row.v_created_at
      },
      questionCount: questions.length
    };
  });
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const db = getDb();
  const result = await db.query('SELECT * FROM content_assets WHERE id = $1 AND type = $2', [id, 'quiz']);
  return (result.rows[0] as Quiz) || null;
}
