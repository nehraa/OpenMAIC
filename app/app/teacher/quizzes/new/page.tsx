'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ContentAsset, ContentAssetVersion } from '@shared/types/assignment';

interface LibraryAsset extends ContentAsset {
  version_count: number;
  latest_version_id: string | null;
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

export default function NewQuizPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [slideDecks, setSlideDecks] = useState<LibraryAsset[]>([]);
  const [selectedSlides, setSelectedSlides] = useState<string | null>(null);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState<'blank' | 'from-slides'>('blank');

  async function createQuiz() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/teacher/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
        body: JSON.stringify({ title: title.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/teacher/quizzes/${data.quiz.id}/edit`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function generateFromSlides() {
    if (!selectedSlides || !title.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/teacher/quizzes/generate-from-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-session-id': getSessionId() },
        body: JSON.stringify({
          slideAssetVersionId: selectedSlides,
          title: title.trim()
        })
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/teacher/quizzes/${data.quiz.id}/edit`);
      }
    } finally {
      setGenerating(false);
    }
  }

  function fetchSlideDecks() {
    setLoadingDecks(true);
    fetch('/api/teacher/library/assets?type=slide_deck', {
      headers: { 'x-session-id': getSessionId() }
    })
      .then(res => res.ok ? res.json() : { assets: [] })
      .then(data => setSlideDecks(data.assets || []))
      .catch(() => setSlideDecks([]))
      .finally(() => setLoadingDecks(false));
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/teacher/quizzes" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
        ← Back to Quizzes
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create New Quiz</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Quiz Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Enter quiz title"
          autoFocus
        />
      </div>

      {/* Creation Mode */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">How would you like to create your quiz?</label>
        <div className="space-y-3">
          <label className={`flex p-4 border-2 rounded-lg cursor-pointer transition ${mode === 'blank' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="mode"
              checked={mode === 'blank'}
              onChange={() => setMode('blank')}
              className="mt-1 mr-3"
            />
            <div>
              <span className="font-medium">Blank Quiz</span>
              <p className="text-sm text-gray-500">Start with an empty quiz and add questions manually</p>
            </div>
          </label>
          <label className={`flex p-4 border-2 rounded-lg cursor-pointer transition ${mode === 'from-slides' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
            <input
              type="radio"
              name="mode"
              checked={mode === 'from-slides'}
              onChange={() => { setMode('from-slides'); fetchSlideDecks(); }}
              className="mt-1 mr-3"
            />
            <div>
              <span className="font-medium">Generate from Slides</span>
              <p className="text-sm text-gray-500">AI will create quiz questions based on your slide deck content</p>
            </div>
          </label>
        </div>
      </div>

      {/* Slide Deck Selection (only in from-slides mode) */}
      {mode === 'from-slides' && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select a Slide Deck</label>
          {loadingDecks ? (
            <p className="text-gray-500">Loading slide decks...</p>
          ) : slideDecks.length === 0 ? (
            <p className="text-gray-500">No slide decks available. Create a slide deck first.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
              {slideDecks.map((deck) => (
                <label
                  key={deck.id}
                  className={`flex p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${selectedSlides === deck.latest_version_id ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                >
                  <input
                    type="radio"
                    name="slides"
                    checked={selectedSlides === deck.latest_version_id}
                    onChange={() => setSelectedSlides(deck.latest_version_id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <span className="font-medium">{deck.title}</span>
                    <p className="text-xs text-gray-500">{deck.subject_tag} · {deck.latest_version_id ? 'Ready' : 'No versions'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/teacher/quizzes" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
          Cancel
        </Link>
        {mode === 'blank' ? (
          <button
            onClick={createQuiz}
            disabled={creating || !title.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Quiz'}
          </button>
        ) : (
          <button
            onClick={generateFromSlides}
            disabled={generating || !title.trim() || !selectedSlides}
            className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
          >
            {generating ? 'Generating with AI...' : 'Generate Quiz with AI'}
          </button>
        )}
      </div>
    </div>
  );
}
