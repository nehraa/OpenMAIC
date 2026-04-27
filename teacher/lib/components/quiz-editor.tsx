'use client';

import { useState } from 'react';
import type { QuizQuestion, MCQQuestion, ShortAnswerQuestion } from '@shared/types/quiz';

interface QuizEditorProps {
  quizId: string;
  initialQuestions: QuizQuestion[];
  onSave?: () => void;
}

interface QuestionEditorState {
  type: 'mcq' | 'short_answer';
  question: string;
  options: string[];
  correctIndex: number;
  sampleAnswer: string;
  points: number;
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

function newMCQEditor(): QuestionEditorState {
  return {
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    sampleAnswer: '',
    points: 1
  };
}

function newShortAnswerEditor(): QuestionEditorState {
  return {
    type: 'short_answer',
    question: '',
    options: [],
    correctIndex: 0,
    sampleAnswer: '',
    points: 2
  };
}

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
  canEdit
}: {
  question: QuizQuestion;
  index: number;
  onUpdate?: (data: Partial<QuestionEditorState>) => void;
  onDelete?: () => void;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<QuestionEditorState>(
    question.type === 'mcq'
      ? { type: 'mcq', question: question.question, options: question.options, correctIndex: question.correctIndex, sampleAnswer: '', points: question.points }
      : { type: 'short_answer', question: question.question, options: [], correctIndex: 0, sampleAnswer: (question as ShortAnswerQuestion).sampleAnswer, points: question.points }
  );

  function saveEdits() {
    if (onUpdate) {
      onUpdate(editState);
    }
    setEditing(false);
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${question.type === 'mcq' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
            {question.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
          </span>
          <span className="text-xs text-gray-500">{question.points} pts</span>
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-primary hover:underline">Edit</button>
          )}
          {canEdit && onDelete && (
            <button onClick={onDelete} className="text-xs text-red-500 hover:underline">Delete</button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Question Text</label>
            <textarea
              value={editState.question}
              onChange={(e) => setEditState({ ...editState, question: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              rows={2}
            />
          </div>

          {question.type === 'mcq' && (
            <div>
              <label className="block text-sm font-medium mb-1">Options</label>
              {editState.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={editState.correctIndex === i}
                    onChange={() => setEditState({ ...editState, correctIndex: i })}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...editState.options];
                      newOptions[i] = e.target.value;
                      setEditState({ ...editState, options: newOptions });
                    }}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
              <button
                onClick={() => setEditState({ ...editState, options: [...editState.options, ''] })}
                className="text-xs text-primary hover:underline"
              >
                Add option
              </button>
            </div>
          )}

          {question.type === 'short_answer' && (
            <div>
              <label className="block text-sm font-medium mb-1">Sample Answer</label>
              <input
                type="text"
                value={editState.sampleAnswer}
                onChange={(e) => setEditState({ ...editState, sampleAnswer: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Sample answer for reference"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            <input
              type="number"
              value={editState.points}
              onChange={(e) => setEditState({ ...editState, points: parseInt(e.target.value) || 1 })}
              className="w-20 border rounded px-2 py-1"
              min={1}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1 text-sm border rounded">Cancel</button>
            <button onClick={saveEdits} className="px-3 py-1 text-sm bg-primary text-white rounded">Save</button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-800 mb-3">{question.question}</p>
          {question.type === 'mcq' && (
            <div className="space-y-1">
              {(question as MCQQuestion).options.map((opt, i) => (
                <div key={i} className={`text-sm ${i === (question as MCQQuestion).correctIndex ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                  {i === (question as MCQQuestion).correctIndex ? '✓ ' : '  '}{opt}
                </div>
              ))}
            </div>
          )}
          {question.type === 'short_answer' && (
            <p className="text-sm text-gray-500">Sample: {(question as ShortAnswerQuestion).sampleAnswer || 'Not provided'}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function QuizEditor({ quizId, initialQuestions, onSave }: QuizEditorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [showAddMCQ, setShowAddMCQ] = useState(false);
  const [showAddSA, setShowAddSA] = useState(false);
  const [mcqState, setMcqState] = useState<QuestionEditorState>(newMCQEditor());
  const [saState, setSaState] = useState<QuestionEditorState>(newShortAnswerEditor());
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  async function addMCQ() {
    if (!mcqState.question.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
        body: JSON.stringify({
          type: 'mcq',
          question: mcqState.question,
          options: mcqState.options.filter(o => o.trim()),
          correctIndex: mcqState.correctIndex,
          points: mcqState.points
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, data.question]);
        setMcqState(newMCQEditor());
        setShowAddMCQ(false);
        onSave?.();
      }
    } finally {
      setSaving(false);
    }
  }

  async function addShortAnswer() {
    if (!saState.question.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
        body: JSON.stringify({
          type: 'short_answer',
          question: saState.question,
          sampleAnswer: saState.sampleAnswer,
          points: saState.points
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions([...questions, data.question]);
        setSaState(newShortAnswerEditor());
        setShowAddSA(false);
        onSave?.();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm('Delete this question?')) return;
    const res = await fetch(`/api/teacher/quizzes/${quizId}/questions/${questionId}`, {
      method: 'DELETE',
      headers: { 'x-session-id': getSessionId() }
    });
    if (res.ok) {
      setQuestions(questions.filter(q => q.id !== questionId));
      onSave?.();
    }
  }

  async function publishQuiz() {
    if (questions.length === 0) {
      alert('Cannot publish an empty quiz');
      return;
    }
    if (!confirm(`Publish quiz with ${questions.length} questions? This cannot be undone.`)) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/teacher/quizzes/${quizId}/publish`, {
        method: 'POST',
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        onSave?.();
        alert('Quiz published successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to publish quiz');
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Questions</h2>
          <p className="text-sm text-gray-500">{questions.length} questions | {totalPoints} total points</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={publishQuiz}
            disabled={publishing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {publishing ? 'Publishing...' : 'Publish Quiz'}
          </button>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-gray-500 mb-4">No questions yet</p>
            <p className="text-sm text-gray-400">Add questions below to build your quiz</p>
          </div>
        ) : (
          questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              onDelete={() => deleteQuestion(q.id)}
              canEdit={true}
            />
          ))
        )}
      </div>

      {/* Add Question Buttons */}
      {!showAddMCQ && !showAddSA && (
        <div className="flex gap-4">
          <button
            onClick={() => { setShowAddMCQ(true); setShowAddSA(false); }}
            className="flex-1 border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition"
          >
            <span className="text-blue-600 font-medium">+ Add Multiple Choice</span>
          </button>
          <button
            onClick={() => { setShowAddSA(true); setShowAddMCQ(false); }}
            className="flex-1 border-2 border-dashed rounded-lg p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition"
          >
            <span className="text-purple-600 font-medium">+ Add Short Answer</span>
          </button>
        </div>
      )}

      {/* MCQ Editor */}
      {showAddMCQ && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h3 className="font-medium mb-4">Add Multiple Choice Question</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <textarea
                value={mcqState.question}
                onChange={(e) => setMcqState({ ...mcqState, question: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Options (select correct answer)</label>
              {mcqState.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="new-mcq-correct"
                    checked={mcqState.correctIndex === i}
                    onChange={() => setMcqState({ ...mcqState, correctIndex: i })}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...mcqState.options];
                      newOptions[i] = e.target.value;
                      setMcqState({ ...mcqState, options: newOptions });
                    }}
                    className="flex-1 border rounded px-2 py-1"
                    placeholder={`Option ${i + 1}`}
                  />
                </div>
              ))}
              <button
                onClick={() => setMcqState({ ...mcqState, options: [...mcqState.options, ''] })}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add option
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <input
                type="number"
                value={mcqState.points}
                onChange={(e) => setMcqState({ ...mcqState, points: parseInt(e.target.value) || 1 })}
                className="w-20 border rounded px-2 py-1"
                min={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddMCQ(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={addMCQ} disabled={saving || !mcqState.question.trim()} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Short Answer Editor */}
      {showAddSA && (
        <div className="border rounded-lg p-4 bg-purple-50">
          <h3 className="font-medium mb-4">Add Short Answer Question</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <textarea
                value={saState.question}
                onChange={(e) => setSaState({ ...saState, question: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                placeholder="Enter your question..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sample Answer (for reference)</label>
              <input
                type="text"
                value={saState.sampleAnswer}
                onChange={(e) => setSaState({ ...saState, sampleAnswer: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="Ideal answer students should provide"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <input
                type="number"
                value={saState.points}
                onChange={(e) => setSaState({ ...saState, points: parseInt(e.target.value) || 1 })}
                className="w-20 border rounded px-2 py-1"
                min={1}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddSA(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={addShortAnswer} disabled={saving || !saState.question.trim()} className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50">
                {saving ? 'Adding...' : 'Add Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}