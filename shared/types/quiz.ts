// Quiz types for Teacher Panel

export interface Quiz {
  id: string;
  owner_teacher_id: string;
  title: string;
  subject_tag: string;
  source_kind: 'manual' | 'ai_generated' | 'imported';
  source_ref: string;
  created_at: string;
  updated_at: string;
}

export interface QuizVersion {
  id: string;
  asset_id: string;
  version_number: number;
  payload_json: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export type QuestionType = 'mcq' | 'short_answer';

export interface MCQQuestion {
  type: 'mcq';
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface ShortAnswerQuestion {
  type: 'short_answer';
  id: string;
  question: string;
  sampleAnswer: string;
  points: number;
}

export type QuizQuestion = MCQQuestion | ShortAnswerQuestion;

export interface QuizPayload {
  questions: QuizQuestion[];
}

export interface CreateQuizData {
  title: string;
  teacherId: string;
  subjectTag?: string;
}

export interface UpdateQuizData {
  title?: string;
  subjectTag?: string;
}

export interface AddQuestionData {
  type: 'mcq' | 'short_answer';
  question: string;
  options?: string[];
  correctIndex?: number;
  sampleAnswer?: string;
  points: number;
}

export interface UpdateQuestionData {
  question?: string;
  options?: string[];
  correctIndex?: number;
  sampleAnswer?: string;
  points?: number;
}