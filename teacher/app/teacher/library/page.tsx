'use client';

import { useEffect, useState } from 'react';

// Session ID helper - works on client side
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

interface LibraryAsset {
  id: string;
  type: 'slide_deck' | 'quiz';
  title: string;
  subject_tag: string;
  source_kind: string;
  source_ref: string;
  created_at: string;
  updated_at: string;
  version_count: number;
  latest_version_id: string | null;
}

interface Class {
  id: string;
  name: string;
}

interface ReuseModalProps {
  asset: LibraryAsset;
  classes: Class[];
  onClose: () => void;
  onSuccess: () => void;
}

function ReuseModal({ asset, classes, onClose, onSuccess }: ReuseModalProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState(asset.title);
  const [releaseAt, setReleaseAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/teacher/api/teacher/library/assets/${asset.id}/reuse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          classId: selectedClassId,
          title,
          releaseAt: releaseAt || undefined,
          dueAt: dueAt || undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Create Assignment from {asset.type === 'slide_deck' ? 'Slide Deck' : 'Quiz'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Release Date</label>
              <input
                type="datetime-local"
                value={releaseAt}
                onChange={(e) => setReleaseAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={loading || !selectedClassId}
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OpenmaicGenerateModalProps {
  classes: Class[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}

function OpenmaicGenerateModal({ classes, onClose, onSuccess }: OpenmaicGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [classId, setClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/teacher/api/teacher/library/generate-classroom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({
          prompt,
          ...(classId ? { classId } : {}),
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'OpenMAIC generation failed');
      }

      const msg = data.fallback
        ? 'OpenMAIC Classroom created (fallback stub — core was unreachable). Reuse it to assign to a class.'
        : 'OpenMAIC Classroom created. Reuse it to assign to a class.';
      onSuccess(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            M
          </div>
          <h2 className="text-2xl font-bold">Generate OpenMAIC Classroom</h2>
        </div>
        <p className="text-gray-500 mb-6 text-sm">
          Sends your topic to the OpenMAIC multi-agent pipeline and creates a real interactive
          classroom. Generation may take up to 2 minutes.
        </p>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none h-32 text-sm"
              placeholder="e.g., Photosynthesis for 8th graders"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Class <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm"
              disabled={loading}
            >
              <option value="">— Skip for now —</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-4 bg-purple-50 text-purple-700 rounded-lg text-sm flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
              <div>
                <div className="font-semibold">Generating classroom...</div>
                <div className="text-purple-600/80 text-xs mt-0.5">Up to 2 minutes</div>
              </div>
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
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20"
              disabled={loading || !prompt.trim()}
            >
              {loading ? 'Generating...' : 'Generate Classroom'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface GenerateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function GenerateModal({ onClose, onSuccess }: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'slide_deck' | 'quiz'>('slide_deck');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/teacher/api/teacher/library/generate', {
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

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <h2 className="text-2xl font-bold mb-2">Generate with AI</h2>
        <p className="text-gray-500 mb-6 text-sm">Describe the topic and learning level to create content instantly.</p>

        <form onSubmit={handleGenerate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">I want to create a...</label>
            <div className="flex gap-3 p-1 bg-gray-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setType('slide_deck')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === 'slide_deck' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Slide Deck
              </button>
              <button
                type="button"
                onClick={() => setType('quiz')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  type === 'quiz' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Quiz
              </button>
            </div>
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

function AssetCard({ asset, onUse }: { asset: LibraryAsset; onUse: () => void }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-1">{asset.title}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          asset.type === 'slide_deck' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {asset.type === 'slide_deck' ? 'Slides' : 'Quiz'}
        </span>
      </div>

      {asset.subject_tag && (
        <p className="text-sm text-gray-500 mb-2">{asset.subject_tag}</p>
      )}

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-400">
          {new Date(asset.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={onUse}
          className="text-sm text-primary hover:underline font-medium"
        >
          Use
        </button>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'slide_deck' | 'quiz'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showOpenmaicGenerate, setShowOpenmaicGenerate] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchClasses();
  }, [filter, subjectFilter, search]);

  async function fetchAssets() {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      if (subjectFilter) params.set('subject', subjectFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/teacher/api/teacher/library/assets?${params}`, {
        headers: { 'x-session-id': getSessionId() }
      });

      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClasses() {
    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        headers: { 'x-session-id': getSessionId() }
      });

      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  const uniqueSubjects = [...new Set(assets.map(a => a.subject_tag).filter(Boolean))];

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Content Library</h1>
          <p className="text-gray-600 mt-1">Reuse your generated slides and quizzes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowOpenmaicGenerate(true)}
            data-testid="generate-openmaic-classroom"
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate OpenMAIC Classroom
          </button>
          <button
            onClick={() => setShowGenerate(true)}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate with AI
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex rounded-lg border overflow-hidden">
            {(['all', 'slide_deck', 'quiz'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === type
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {type === 'all' ? 'All' : type === 'slide_deck' ? 'Slides' : 'Quizzes'}
              </button>
            ))}
          </div>

          {uniqueSubjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Subjects</option>
              {uniqueSubjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">{total} assets</p>

      {/* Asset Grid */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : assets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onUse={() => setSelectedAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Reuse Modal */}
      {selectedAsset && (
        <ReuseModal
          asset={selectedAsset}
          classes={classes}
          onClose={() => setSelectedAsset(null)}
          onSuccess={() => {
            // Optionally refresh or show success message
          }}
        />
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onSuccess={() => {
            fetchAssets();
            setShowGenerate(false);
          }}
        />
      )}

      {/* OpenMAIC Generate Modal */}
      {showOpenmaicGenerate && (
        <OpenmaicGenerateModal
          classes={classes}
          onClose={() => setShowOpenmaicGenerate(false)}
          onSuccess={(message) => {
            fetchAssets();
            setShowOpenmaicGenerate(false);
            setToast(message);
            setTimeout(() => setToast(''), 5000);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm z-50 max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}