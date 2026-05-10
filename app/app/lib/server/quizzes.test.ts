import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock database
const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function(this: any, ...args: any[]) {
      return fn.apply(this, args);
    };
  }),
  exec: vi.fn()
};

// Mock the db module
vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
  default: { getDb: () => mockDb }
}));

// Import after mocking
import {
  createQuiz,
  getQuizById,
  updateQuiz,
  publishQuiz,
  duplicateQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getQuizzesForTeacher,
  generateQuizFromSlides
} from './quizzes';
import type { Quiz, QuizVersion, QuizQuestion } from '@shared/types/quiz';

describe('Quizzes Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('createQuiz', () => {
    it('creates a new quiz with draft version', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-123',
        owner_teacher_id: 'teacher-456',
        title: 'Test Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      let insertCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO content_assets')) {
          insertCount++;
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'quiz-123' }) };
        }
        if (sql.includes('INSERT INTO content_asset_versions')) {
          insertCount++;
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'version-1' }) };
        }
        return { get: vi.fn().mockReturnValue(mockQuiz) };
      });

      const result = createQuiz({
        title: 'Test Quiz',
        teacherId: 'teacher-456'
      });

      expect(result.title).toBe('Test Quiz');
      expect(result.owner_teacher_id).toBe('teacher-456');
      expect(insertCount).toBe(2); // Asset + version
    });

    it('creates quiz with subject tag when provided', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-123',
        owner_teacher_id: 'teacher-456',
        title: 'Math Quiz',
        subject_tag: 'Mathematics',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO content_assets')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'quiz-123' }) };
        }
        if (sql.includes('INSERT INTO content_asset_versions')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'version-1' }) };
        }
        return { get: vi.fn().mockReturnValue(mockQuiz) };
      });

      const result = createQuiz({
        title: 'Math Quiz',
        teacherId: 'teacher-456',
        subjectTag: 'Mathematics'
      });

      expect(result.subject_tag).toBe('Mathematics');
    });
  });

  describe('getQuizById', () => {
    it('returns null when quiz not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getQuizById('non-existent-id');

      expect(result).toBeNull();
    });

    it('returns quiz when found', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Test Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockQuiz)
      });

      const result = getQuizById('quiz-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('quiz-1');
    });
  });

  describe('updateQuiz', () => {
    it('updates quiz title when draft', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Original Title',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: '{"questions":[]}',
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      const updatedQuiz = { ...mockQuiz, title: 'Updated Title' };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('SELECT * FROM content_asset_versions')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('UPDATE content_assets')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(updatedQuiz) };
      });

      const result = updateQuiz('quiz-1', { title: 'Updated Title' });

      expect(result).not.toBeNull();
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('throws when trying to update published quiz', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Published Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: '{"questions":[]}',
        status: 'published',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('SELECT * FROM content_asset_versions')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        return { get: vi.fn() };
      });

      expect(() => updateQuiz('quiz-1', { title: 'New Title' }))
        .toThrow("Cannot update quiz with status 'published'");
    });
  });

  describe('publishQuiz', () => {
    it('publishes draft quiz with questions', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Draft Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [{ type: 'mcq', id: 'q1', question: 'Test?', options: ['A', 'B'], correctIndex: 0, points: 1 }] }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      const publishedQuiz = { ...mockQuiz };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('UPDATE content_asset_versions SET status')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(publishedQuiz) };
      });

      const result = publishQuiz('quiz-1');

      expect(result).not.toBeNull();
    });

    it('throws when trying to publish empty quiz', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Empty Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [] }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        return { get: vi.fn() };
      });

      expect(() => publishQuiz('quiz-1'))
        .toThrow('Cannot publish an empty quiz');
    });
  });

  describe('addQuestion', () => {
    it('adds MCQ question to draft quiz', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Test Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [] }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('UPDATE content_asset_versions SET payload_json')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn() };
      });

      const result = addQuestion('quiz-1', {
        type: 'mcq',
        question: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctIndex: 1,
        points: 1
      });

      expect(result.type).toBe('mcq');
      expect(result.question).toBe('What is 2+2?');
      expect((result as any).options).toHaveLength(4);
    });

    it('adds short answer question to draft quiz', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Test Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [] }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('UPDATE content_asset_versions SET payload_json')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn() };
      });

      const result = addQuestion('quiz-1', {
        type: 'short_answer',
        question: 'Explain photosynthesis.',
        sampleAnswer: 'Photosynthesis is the process by which plants convert sunlight into energy.',
        points: 5
      });

      expect(result.type).toBe('short_answer');
      expect(result.question).toBe('Explain photosynthesis.');
    });

    it('throws when trying to add question to published quiz', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Test Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [] }),
        status: 'published',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        return { get: vi.fn() };
      });

      expect(() => addQuestion('quiz-1', {
        type: 'mcq',
        question: 'Test?',
        options: ['A', 'B'],
        correctIndex: 0,
        points: 1
      })).toThrow('Can only add questions to draft quizzes');
    });
  });

  describe('deleteQuestion', () => {
    it('deletes question from draft quiz', () => {
      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({
          questions: [
            { type: 'mcq', id: 'q1', question: 'Test?', options: ['A', 'B'], correctIndex: 0, points: 1 },
            { type: 'short_answer', id: 'q2', question: 'Another?', sampleAnswer: 'Answer', points: 2 }
          ]
        }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_asset_versions WHERE status')) {
          return { all: vi.fn().mockReturnValue([mockVersion]) };
        }
        if (sql.includes('UPDATE content_asset_versions SET payload_json')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn() };
      });

      const result = deleteQuestion('q1');

      expect(result).toBe(true);
    });

    it('returns false when question not found', () => {
      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({
          questions: [
            { type: 'mcq', id: 'q1', question: 'Test?', options: ['A', 'B'], correctIndex: 0, points: 1 }
          ]
        }),
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_asset_versions WHERE status')) {
          return { all: vi.fn().mockReturnValue([mockVersion]) };
        }
        return { get: vi.fn() };
      });

      const result = deleteQuestion('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('duplicateQuiz', () => {
    it('duplicates quiz with new draft version', () => {
      const mockQuiz: Quiz = {
        id: 'quiz-1',
        owner_teacher_id: 'teacher-456',
        title: 'Original Quiz',
        subject_tag: '',
        source_kind: 'manual',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: QuizVersion = {
        id: 'version-1',
        asset_id: 'quiz-1',
        version_number: 1,
        payload_json: JSON.stringify({ questions: [{ type: 'mcq', id: 'q1', question: 'Test?', options: ['A', 'B'], correctIndex: 0, points: 1 }] }),
        status: 'published',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockQuiz) };
        }
        if (sql.includes('ORDER BY version_number DESC LIMIT 1')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('SELECT MAX(version_number)')) {
          return { get: vi.fn().mockReturnValue({ max_v: 1 }) };
        }
        if (sql.includes('INSERT INTO content_asset_versions')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(mockQuiz) };
      });

      const result = duplicateQuiz('quiz-1');

      expect(result).not.toBeNull();
    });
  });

  describe('generateQuizFromSlides', () => {
    it('throws when slide asset version not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      expect(() => generateQuizFromSlides('non-existent-slide-id'))
        .toThrow('Slide asset version not found');
    });

    it('generates questions from slide content', () => {
      const mockSlideVersion = {
        payload_json: JSON.stringify({
          slides: [
            { title: 'Introduction', content: 'This is the first slide. It contains important information about the topic that students should understand.' },
            { title: 'Key Concept', content: 'Photosynthesis is the process by which plants convert sunlight into chemical energy stored in glucose.' }
          ]
        })
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockSlideVersion)
      });

      const questions = generateQuizFromSlides('slide-version-123');

      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toHaveProperty('type');
      expect(questions[0]).toHaveProperty('question');
      expect(questions[0]).toHaveProperty('points');
    });
  });

  describe('getQuizzesForTeacher', () => {
    it('returns all quizzes for teacher', () => {
      const mockRows = [
        {
          id: 'quiz-1',
          owner_teacher_id: 'teacher-456',
          title: 'Quiz 1',
          subject_tag: '',
          source_kind: 'manual',
          source_ref: '',
          created_at: '2026-04-26T10:00:00.000Z',
          updated_at: '2026-04-26T10:00:00.000Z',
          v_id: 'v1',
          version_number: 1,
          payload_json: '{"questions":[]}',
          v_status: 'draft' as const,
          v_created_at: '2026-04-26T10:00:00.000Z',
          questions_json: '[]'
        },
        {
          id: 'quiz-2',
          owner_teacher_id: 'teacher-456',
          title: 'Quiz 2',
          subject_tag: '',
          source_kind: 'manual',
          source_ref: '',
          created_at: '2026-04-26T10:00:00.000Z',
          updated_at: '2026-04-26T10:00:00.000Z',
          v_id: 'v2',
          version_number: 1,
          payload_json: '{"questions":[]}',
          v_status: 'published' as const,
          v_created_at: '2026-04-26T10:00:00.000Z',
          questions_json: '[]'
        }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockRows)
      });

      const result = getQuizzesForTeacher('teacher-456');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('questionCount');
    });

    it('filters by status when provided', () => {
      const mockRows = [
        {
          id: 'quiz-1',
          owner_teacher_id: 'teacher-456',
          title: 'Draft Quiz',
          subject_tag: '',
          source_kind: 'manual',
          source_ref: '',
          created_at: '2026-04-26T10:00:00.000Z',
          updated_at: '2026-04-26T10:00:00.000Z',
          v_id: 'v1',
          version_number: 1,
          payload_json: '{"questions":[]}',
          v_status: 'draft' as const,
          v_created_at: '2026-04-26T10:00:00.000Z',
          questions_json: '[{"type":"mcq","id":"q1","question":"Test?","options":["A","B"],"correctIndex":0,"points":1}]'
        }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockRows)
      });

      const result = getQuizzesForTeacher('teacher-456', { status: 'draft' });

      expect(result).toHaveLength(1);
      expect(result[0].questionCount).toBe(1);
    });
  });
});