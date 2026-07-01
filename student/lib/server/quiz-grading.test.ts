import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeQuestion,
  gradeQuiz,
  toClientQuestion,
  normalizeString,
  normalizeBoolean,
  getCorrectOptionText,
  type QuizQuestionServer,
} from './quiz-grading.ts';

const MCQ: QuizQuestionServer = {
  id: 'q1',
  type: 'mcq',
  question: 'What is 2+2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  points: 2,
};

const MCQ_AI: QuizQuestionServer = {
  id: 'q2',
  type: 'multiple_choice',
  question: 'What is 2+3?',
  options: ['4', '5', '6', '7'],
  correct_index: 1,
  points: 1,
};

const TRUE_FALSE: QuizQuestionServer = {
  id: 'q3',
  type: 'true_false',
  question: 'The Earth is flat.',
  correct_answer: false,
  points: 1,
};

const SHORT_ANSWER: QuizQuestionServer = {
  id: 'q4',
  type: 'short_answer',
  question: 'Capital of France?',
  sampleAnswer: 'Paris',
  points: 3,
};

const SHORT_ANSWER_AI: QuizQuestionServer = {
  id: 'q5',
  type: 'short_answer',
  question: 'Largest planet?',
  correct_answer: 'Jupiter',
  points: 2,
};

const OPEN_ENDED: QuizQuestionServer = {
  id: 'q6',
  type: 'short_answer',
  question: 'What did you learn?',
  points: 4,
};

test('mcq correct (text answer)', () => {
  const r = gradeQuestion(MCQ, '4');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 2);
  assert.equal(r.totalPoints, 2);
});

test('mcq wrong (text answer)', () => {
  const r = gradeQuestion(MCQ, '3');
  assert.equal(r.isCorrect, false);
  assert.equal(r.pointsEarned, 0);
});

test('mcq correct via index number', () => {
  const r = gradeQuestion(MCQ, 1);
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 2);
});

test('multiple_choice (AI format) correct', () => {
  const r = gradeQuestion(MCQ_AI, '5');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 1);
});

test('true_false correct', () => {
  const r = gradeQuestion(TRUE_FALSE, false);
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 1);
});

test('true_false wrong', () => {
  const r = gradeQuestion(TRUE_FALSE, true);
  assert.equal(r.isCorrect, false);
  assert.equal(r.pointsEarned, 0);
});

test('true_false accepts string "false"', () => {
  const r = gradeQuestion(TRUE_FALSE, 'false');
  assert.equal(r.isCorrect, true);
});

test('short_answer exact match', () => {
  const r = gradeQuestion(SHORT_ANSWER, 'Paris');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 3);
});

test('short_answer close match (whitespace + case)', () => {
  const r = gradeQuestion(SHORT_ANSWER, '  paris  ');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 3);
});

test('short_answer contains key', () => {
  const r = gradeQuestion(SHORT_ANSWER, 'The capital of France is Paris.');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 3);
});

test('short_answer wrong', () => {
  const r = gradeQuestion(SHORT_ANSWER, 'London');
  assert.equal(r.isCorrect, false);
  assert.equal(r.pointsEarned, 0);
});

test('short_answer AI format (correct_answer instead of sampleAnswer)', () => {
  const r = gradeQuestion(SHORT_ANSWER_AI, 'Jupiter');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 2);
});

test('open-ended short_answer with no key awards full points for any non-empty answer', () => {
  const r = gradeQuestion(OPEN_ENDED, 'I learned a lot.');
  assert.equal(r.isCorrect, true);
  assert.equal(r.pointsEarned, 4);
  assert.equal(r.openEnded, true);
});

test('open-ended short_answer with empty answer gets 0', () => {
  const r = gradeQuestion(OPEN_ENDED, '   ');
  assert.equal(r.isCorrect, false);
  assert.equal(r.pointsEarned, 0);
  assert.equal(r.openEnded, true);
});

test('gradeQuiz sums points and rounds percent', () => {
  const quiz: QuizQuestionServer[] = [MCQ, MCQ_AI, TRUE_FALSE, SHORT_ANSWER, SHORT_ANSWER_AI, OPEN_ENDED];
  const answers = {
    q1: '4', // correct (2/2)
    q2: '5', // correct (1/1)
    q3: false, // correct (1/1)
    q4: 'Paris', // correct (3/3)
    q5: 'Saturn', // wrong (0/2)
    q6: 'Great session!', // open-ended full credit (4/4)
  };
  const r = gradeQuiz(quiz, answers);
  // Earned: 2+1+1+3+0+4 = 11. Total: 2+1+1+3+2+4 = 13. 11/13 = 84.615% -> 85
  assert.equal(r.pointsEarned, 11);
  assert.equal(r.totalPoints, 13);
  assert.equal(r.scorePercent, 85);
  assert.equal(r.results.length, 6);
  assert.equal(r.results.filter((x) => x.isCorrect).length, 5);
});

test('gradeQuiz on empty questions returns 0%', () => {
  const r = gradeQuiz([], {});
  assert.equal(r.scorePercent, 0);
  assert.equal(r.totalPoints, 0);
  assert.equal(r.pointsEarned, 0);
});

test('toClientQuestion strips answer fields', () => {
  const client = toClientQuestion(MCQ);
  assert.deepEqual(Object.keys(client).sort(), ['id', 'options', 'points', 'question', 'type']);
  assert.equal((client as QuizQuestionServer).correctIndex, undefined);
});

test('normalizeString collapses whitespace + lowercases', () => {
  assert.equal(normalizeString('  Hello   WORLD  '), 'hello world');
});

test('normalizeBoolean handles strings and bools', () => {
  assert.equal(normalizeBoolean('yes'), true);
  assert.equal(normalizeBoolean('No'), false);
  assert.equal(normalizeBoolean(true), true);
  assert.equal(normalizeBoolean(0), null);
});

test('getCorrectOptionText returns the option at the correct index', () => {
  assert.equal(getCorrectOptionText(MCQ), '4');
  assert.equal(getCorrectOptionText(MCQ_AI), '5');
});
