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

// Question generation from slide content
const SLIDE_CONTENT_QUERY = `
  SELECT cav.payload_json
  FROM content_asset_versions cav
  WHERE cav.id = ?
`;

const SLIDE_CONTENT_PARSE_QUERY = `
  SELECT payload_json FROM content_asset_versions WHERE id = ?
`;

export interface GeneratedQuestion {
  type: 'mcq' | 'short_answer';
  question: string;
  options?: string[];
  correctIndex?: number;
  sampleAnswer?: string;
  points: number;
}

/**
 * Generate quiz questions from slide content
 * This is a simple extraction-based approach that looks for text content in slides
 */
export function generateQuizFromSlides(slideAssetVersionId: string): GeneratedQuestion[] {
  const db = getDb();

  const versionRow = db.prepare(SLIDE_CONTENT_PARSE_QUERY).get(slideAssetVersionId) as { payload_json: string } | undefined;

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

  // Extract text content from slides to generate questions
  // Simple approach: create questions from slide text content
  for (const slide of slides) {
    const text = slide.content || slide.text || '';
    const title = slide.title || '';

    if (text.length > 20) {
      // Create a question from the slide content
      // Split text into sentences and create questions
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

      if (sentences.length >= 2) {
        // Generate MCQ from first sentence
        const questionText = sentences[0].trim();
        if (questionText.length > 15) {
          // Simple distractors generation (in production, this would use AI)
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

  // Ensure we have at least some questions
  if (questions.length === 0 && slides.length > 0) {
    // Use first slide's title or a default
    const firstSlideTitle = slides[0]?.title || '';
    // Generate a general question about the slides
    questions.push({
      type: 'short_answer',
      question: `Summarize the key concepts covered in the slide deck titled "${firstSlideTitle || 'the presentation'}"`,
      sampleAnswer: 'The slide deck covers important concepts that were presented in the lesson.',
      points: 2
    });
  }

  return questions.slice(0, 10); // Limit to 10 questions max
}

/**
 * Create a new quiz asset with initial draft version
 */
export function createQuiz(data: CreateQuizData): Quiz {
  const db = getDb();

  // Create the quiz content asset
  const result = db.prepare(`
    INSERT INTO content_assets (owner_teacher_id, type, title, subject_tag, source_kind, source_ref)
    VALUES (?, 'quiz', ?, ?, 'manual', '')
  `).run(
    data.teacherId,
    data.title,
    data.subjectTag || ''
  );

  const assetId = result.lastInsertRowid;

  // Create initial draft version with empty questions
  db.prepare(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES (?, 1, '{"questions":[]}', 'draft')
  `).run(assetId);

  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ?').get(assetId) as Quiz;
  return quiz;
}

/**
 * Update quiz metadata (only draft quizzes)
 */
export function updateQuiz(id: string, data: UpdateQuizData): Quiz | null {
  const db = getDb();

  // Check quiz exists and get current version status
  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(id, 'quiz') as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  // Get current version
  const currentVersion = db.prepare(`
    SELECT * FROM content_asset_versions WHERE asset_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as QuizVersion | undefined;

  if (!currentVersion || currentVersion.status !== 'draft') {
    throw new Error(`Cannot update quiz with status '${currentVersion?.status || 'unknown'}'`);
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.subjectTag !== undefined) {
    fields.push('subject_tag = ?');
    values.push(data.subjectTag);
  }

  if (fields.length > 0) {
    fields.push("updated_at = datetime('now')");
    values.push(id);
    db.prepare(`UPDATE content_assets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return db.prepare('SELECT * FROM content_assets WHERE id = ?').get(id) as Quiz;
}

/**
 * Publish quiz (change draft version to published)
 */
export function publishQuiz(id: string): Quiz | null {
  const db = getDb();

  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(id, 'quiz') as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const currentVersion = db.prepare(`
    SELECT * FROM content_asset_versions WHERE asset_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as QuizVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for quiz');
  }

  if (currentVersion.status !== 'draft') {
    throw new Error(`Cannot publish quiz with status '${currentVersion.status}'`);
  }

  // Validate quiz has questions before publishing
  const payload: QuizPayload = JSON.parse(currentVersion.payload_json);
  if (payload.questions.length === 0) {
    throw new Error('Cannot publish an empty quiz');
  }

  // Archive any existing published versions
  db.prepare(`
    UPDATE content_asset_versions SET status = 'archived' WHERE asset_id = ? AND status = 'published'
  `).run(id);

  // Publish the current version
  db.prepare(`
    UPDATE content_asset_versions SET status = 'published' WHERE id = ?
  `).run(currentVersion.id);

  return db.prepare('SELECT * FROM content_assets WHERE id = ?').get(id) as Quiz;
}

/**
 * Duplicate quiz to a new draft version
 */
export function duplicateQuiz(id: string): Quiz | null {
  const db = getDb();

  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(id, 'quiz') as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const currentVersion = db.prepare(`
    SELECT * FROM content_asset_versions WHERE asset_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as QuizVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for quiz');
  }

  // Get max version number
  const maxVersion = db.prepare(`
    SELECT MAX(version_number) as max_v FROM content_asset_versions WHERE asset_id = ?
  `).get(id) as { max_v: number };

  // Create new draft version with same payload
  db.prepare(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES (?, ?, ?, 'draft')
  `).run(id, maxVersion.max_v + 1, currentVersion.payload_json);

  return db.prepare('SELECT * FROM content_assets WHERE id = ?').get(id) as Quiz;
}

/**
 * Get quiz with its current version
 */
export function getQuizWithVersion(id: string): { quiz: Quiz; version: QuizVersion; payload: QuizPayload } | null {
  const db = getDb();

  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(id, 'quiz') as Quiz | undefined;
  if (!quiz) {
    return null;
  }

  const version = db.prepare(`
    SELECT * FROM content_asset_versions WHERE asset_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(id) as QuizVersion | undefined;

  if (!version) {
    return null;
  }

  const payload: QuizPayload = JSON.parse(version.payload_json);
  return { quiz, version, payload };
}

/**
 * Add a question to the quiz
 */
export function addQuestion(quizId: string, questionData: AddQuestionData): QuizQuestion {
  const db = getDb();

  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(quizId, 'quiz') as Quiz | undefined;
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  const currentVersion = db.prepare(`
    SELECT * FROM content_asset_versions WHERE asset_id = ? ORDER BY version_number DESC LIMIT 1
  `).get(quizId) as QuizVersion | undefined;

  if (!currentVersion || currentVersion.status !== 'draft') {
    throw new Error('Can only add questions to draft quizzes');
  }

  const payload: QuizPayload = JSON.parse(currentVersion.payload_json);

  // Generate question ID
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

  // Update version with new payload
  db.prepare(`
    UPDATE content_asset_versions SET payload_json = ? WHERE id = ?
  `).run(JSON.stringify(payload), currentVersion.id);

  return question;
}

/**
 * Update a question in the quiz
 */
export function updateQuestion(questionId: string, data: UpdateQuestionData): QuizQuestion | null {
  const db = getDb();

  // Find the version containing this question
  const versions = db.prepare(`
    SELECT * FROM content_asset_versions WHERE status = 'draft' ORDER BY version_number DESC
  `).all() as QuizVersion[];

  let targetVersion: QuizVersion | null = null;
  let questionIndex = -1;

  for (const version of versions) {
    const payload: QuizPayload = JSON.parse(version.payload_json);
    const idx = payload.questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      targetVersion = version;
      questionIndex = idx;
      break;
    }
  }

  if (!targetVersion || questionIndex === -1) {
    return null;
  }

  const payload: QuizPayload = JSON.parse(targetVersion.payload_json);
  const question = payload.questions[questionIndex];

  // Update based on question type
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

  db.prepare(`
    UPDATE content_asset_versions SET payload_json = ? WHERE id = ?
  `).run(JSON.stringify(payload), targetVersion.id);

  return question;
}

/**
 * Delete a question from the quiz
 */
export function deleteQuestion(questionId: string): boolean {
  const db = getDb();

  // Find the version containing this question
  const versions = db.prepare(`
    SELECT * FROM content_asset_versions WHERE status = 'draft' ORDER BY version_number DESC
  `).all() as QuizVersion[];

  let targetVersion: QuizVersion | null = null;

  for (const version of versions) {
    const payload: QuizPayload = JSON.parse(version.payload_json);
    const idx = payload.questions.findIndex(q => q.id === questionId);
    if (idx !== -1) {
      targetVersion = version;
      // Remove the question
      payload.questions.splice(idx, 1);
      // Update version
      db.prepare(`
        UPDATE content_asset_versions SET payload_json = ? WHERE id = ?
      `).run(JSON.stringify(payload), targetVersion.id);
      return true;
    }
  }

  return false;
}

/**
 * Get all quizzes for a teacher
 */
export interface ListQuizzesFilters {
  status?: 'draft' | 'published';
}

export function getQuizzesForTeacher(teacherId: string, filters?: ListQuizzesFilters): (Quiz & { version: QuizVersion; questionCount: number })[] {
  const db = getDb();

  const conditions: string[] = ['ca.owner_teacher_id = ?', 'ca.type = ?'];
  const values: (string | number)[] = [teacherId, 'quiz'];

  if (filters?.status) {
    conditions.push('cav.status = ?');
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

  const rows = db.prepare(query).all(...values) as Array<{
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

/**
 * Get quiz by ID
 */
export function getQuizById(id: string): Quiz | null {
  const db = getDb();
  const quiz = db.prepare('SELECT * FROM content_assets WHERE id = ? AND type = ?').get(id, 'quiz') as Quiz | undefined;
  return quiz || null;
}