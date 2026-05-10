'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Session ID helper - works on client side
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

interface Class {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  title: string;
  type: 'slide_deck' | 'quiz';
}

interface FormState {
  title: string;
  description: string;
  classId: string;
  slideAssetVersionId: string;
  quizAssetVersionId: string;
  releaseAt: string;
  dueAt: string;
}

export default function NewAssignmentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [slideDecks, setSlideDecks] = useState<Asset[]>([]);
  const [quizzes, setQuizzes] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateType, setGenerateType] = useState<'slide_deck' | 'quiz'>('slide_deck');
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    classId: '',
    slideAssetVersionId: '',
    quizAssetVersionId: '',
    releaseAt: '',
    dueAt: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchAssets();
  }, []);

  async function fetchClasses() {
    try {
      const res = await fetch('/api/teacher/classes', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to fetch classes:', err);
    }
  }

  async function fetchAssets() {
    try {
      const [slidesRes, quizzesRes] = await Promise.all([
        fetch('/api/teacher/library/assets?type=slide_deck&limit=50', {
          headers: { 'x-session-id': getSessionId() }
        }),
        fetch('/api/teacher/library/assets?type=quiz&limit=50', {
          headers: { 'x-session-id': getSessionId() }
        })
      ]);

      if (slidesRes.ok) {
        const data = await slidesRes.json();
        setSlideDecks(data.assets || []);
      }
      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data.assets || []);
      }
    } catch (err) {
      console.error('Failed to fetch assets:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.classId) {
      setError('Please select a class');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          classId: form.classId,
          slideAssetVersionId: form.slideAssetVersionId || undefined,
          quizAssetVersionId: form.quizAssetVersionId || undefined,
          releaseAt: form.releaseAt || undefined,
          dueAt: form.dueAt || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      router.push('/teacher/assignments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/teacher/assignments" className="text-gray-500 hover:text-gray-700">
          ← Back to Assignments
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create New Assignment</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Assignment title"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Optional description for this assignment"
          />
        </div>

        <div>
          <label htmlFor="classId" className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            id="classId"
            name="classId"
            value={form.classId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          >
            <option value="">Select a class</option>
            {classes.map(cls => (
              <option key={cls.id} value={cls.id}>{cls.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="slideAssetVersionId" className="block text-sm font-medium text-gray-700">
              Learning Material
            </label>
            <button
              type="button"
              onClick={() => { setGenerateType('slide_deck'); setShowGenerateModal(true); }}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate AI Content
            </button>
          </div>
          <select
            id="slideAssetVersionId"
            name="slideAssetVersionId"
            value={form.slideAssetVersionId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">None</option>
            {slideDecks.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.title}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="quizAssetVersionId" className="block text-sm font-medium text-gray-700">
              Quiz
            </label>
            <button
              type="button"
              onClick={() => { setGenerateType('quiz'); setShowGenerateModal(true); }}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate AI Content
            </button>
          </div>
          <select
            id="quizAssetVersionId"
            name="quizAssetVersionId"
            value={form.quizAssetVersionId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">None</option>
            {quizzes.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="releaseAt" className="block text-sm font-medium text-gray-700 mb-1">
              Release Date
            </label>
            <input
              type="datetime-local"
              id="releaseAt"
              name="releaseAt"
              value={form.releaseAt}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label htmlFor="dueAt" className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <input
              type="datetime-local"
              id="dueAt"
              name="dueAt"
              value={form.dueAt}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/teacher/assignments"
            className="flex-1 border border-gray-300 py-2 rounded-lg text-center hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Assignment'}
          </button>
        </div>
      </form>

      {/* Generate AI Content Modal */}
      {showGenerateModal && (
        <GenerateContentModal
          type={generateType}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(assetId) => {
            if (generateType === 'slide_deck') {
              setForm(prev => ({ ...prev, slideAssetVersionId: assetId }));
            } else {
              setForm(prev => ({ ...prev, quizAssetVersionId: assetId }));
            }
            setShowGenerateModal(false);
            fetchAssets();
          }}
        />
      )}
    </div>
  );
}

interface GenerateContentModalProps {
  type: 'slide_deck' | 'quiz';
  onClose: () => void;
  onSuccess: (assetId: string) => void;
}

function GenerateContentModal({ type, onClose, onSuccess }: GenerateContentModalProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/library/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          prompt,
          type
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      if (data.asset && data.asset.latest_version_id) {
        onSuccess(data.asset.latest_version_id);
      } else {
        throw new Error('Invalid response from generation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Generate {type === 'slide_deck' ? 'Learning Material' : 'Quiz'} with AI</h2>
        <p className="text-gray-500 mb-6 text-sm">Describe the topic and learning level to create content instantly.</p>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">What do you want to create?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-32 text-sm"
              placeholder={type === 'slide_deck' ? "e.g., Introduction to Algebra for 8th Grade" : "e.g., 10 multiple choice questions on photosynthesis"}
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : 'Generate Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}