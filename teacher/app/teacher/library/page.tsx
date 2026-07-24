'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { buildClassroomUrl } from '@/lib/classroom-url';
import { Progress } from '@/components/ui/progress';
import { Modal } from './Modal';

// Public classroom prefix served by Cloudflare. Never fall back to localhost
// or the teacher origin: classroom pages belong to the core service on the
// main OpenMAIC hostname.
const OPENMAIC_CLASSROOM_BASE = process.env.NEXT_PUBLIC_OPENMAIC_PUBLIC_URL || '';

function publicClassroomUrl(classroomId: string): string {
  return buildClassroomUrl(classroomId, OPENMAIC_CLASSROOM_BASE);
}
// _recompile_$(date)

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
  latest_payload?: {
    slides?: Array<{ slide_id?: string; title?: string; content?: string }>;
    questions?: unknown[];
    openmaicClassroomId?: string;
    prompt?: string;
  } | null;
}

interface Class {
  id: string;
  name: string;
}

interface ActiveJob {
  jobId: string;
  kind: 'openmaic' | 'ai';
  type: 'slide_deck' | 'quiz';
  prompt: string;
  status: 'pending' | 'completed' | 'failed';
  asset?: unknown;
  error?: string;
  warning?: string;
  fallback?: boolean;
  progress?: number;
  step?: string;
  message?: string;
  scenesGenerated?: number;
  totalScenes?: number;
}

interface PreviewSlidesModalProps {
  asset: LibraryAsset;
  onClose: () => void;
}

function PreviewSlidesModal({ asset, onClose }: PreviewSlidesModalProps) {
  const titleId = useId();
  const cachedSlides = asset.latest_payload?.slides;
  const classroomId = asset.latest_payload?.openmaicClassroomId;
  const [fetchedSlides, setFetchedSlides] = useState<
    Array<{ slide_id?: string; title?: string; content?: string }> | null
  >(cachedSlides && cachedSlides.length > 0 ? cachedSlides : null);
  const [loading, setLoading] = useState(
    !(cachedSlides && cachedSlides.length > 0) && !!classroomId && asset.type === 'slide_deck'
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (fetchedSlides !== null) return;
    if (!classroomId || asset.type !== 'slide_deck') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/teacher/api/teacher/library/assets/${asset.id}/slides`, {
          headers: { 'x-session-id': getSessionId() },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { slides?: Array<{ slide_id?: string; title?: string; content?: string }> };
        if (cancelled) return;
        setFetchedSlides(data.slides ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load slides');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asset.id, classroomId, asset.type, fetchedSlides]);

  const slides = fetchedSlides ?? [];

  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      panelClassName="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[85vh] overflow-y-auto"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 id={titleId} className="text-2xl font-bold">{asset.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading slides…' : `${slides.length} slide${slides.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {asset.latest_payload?.prompt && (
        <p className="text-sm text-gray-500 mb-6 italic">
          Prompt: {asset.latest_payload.prompt}
        </p>
      )}

      {loading ? (
        <div className="flex items-center gap-3 justify-center py-12 text-gray-500">
          <div className="w-5 h-5 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
          Fetching deck from OpenMAIC…
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          {classroomId && (
            <a
              href={publicClassroomUrl(classroomId)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Open in classroom →
            </a>
          )}
        </div>
      ) : slides.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No slides in this deck.</p>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, i) => (
            <div key={slide.slide_id ?? i} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  Slide {i + 1}
                </span>
                <h3 className="font-semibold text-gray-900">
                  {slide.title || '(untitled)'}
                </h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {slide.content || ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

interface ReuseModalProps {
  asset: LibraryAsset;
  classes: Class[];
  onClose: () => void;
  onSuccess: () => void;
  onPreview?: () => void;
}

function ReuseModal({ asset, classes, onClose, onSuccess, onPreview }: ReuseModalProps) {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState('');
  const [releaseAt, setReleaseAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const classroomId = asset.latest_payload?.openmaicClassroomId;
  const classroomUrl = classroomId ? publicClassroomUrl(classroomId) : null;
  const slideCount = asset.latest_payload?.slides?.length ?? 0;
  const hasSlides = asset.type === 'slide_deck' && slideCount > 0;
  const isSlideDeck = asset.type === 'slide_deck';

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
          description: description.trim() || undefined,
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
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      closeDisabled={loading}
      panelClassName="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
    >
      <h2 id={titleId} className="text-xl font-semibold mb-4">
        Create Assignment from {asset.type === 'slide_deck' ? 'Slide Deck' : 'Quiz'}
      </h2>

      <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-gray-200">
        {hasSlides && onPreview && (
          <button
            type="button"
            data-testid="modal-preview-slides"
            onClick={() => {
              onClose();
              onPreview();
            }}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Slides ({slideCount})
          </button>
        )}
        {classroomUrl && (
          <a
            href={classroomUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="modal-enter-classroom"
            className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 shadow-sm"
          >
            Enter Classroom
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            placeholder={isSlideDeck
              ? 'Instructions for the students. Anything you want them to know before starting the slides.'
              : 'Optional context for the quiz.'}
          />
          <p className="mt-1 text-xs text-gray-400">{description.length}/2000</p>
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
    </Modal>
  );
}

interface OpenmaicGenerateModalProps {
  classes: Class[];
  onClose: () => void;
  onKickoff: (info: { jobId: string; prompt: string; type: 'slide_deck' }) => void;
}

function OpenmaicGenerateModal({ classes, onClose, onKickoff }: OpenmaicGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [classId, setClassId] = useState('');
  const [kicking, setKicking] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setKicking(true);
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

      // Defensive parse — edge proxies sometimes return HTML error pages.
      let data: { jobId?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned a non-JSON response (HTTP ${res.status}). The job may not have been created.`);
      }

      if (!res.ok || !data.jobId) {
        throw new Error(data.error || 'OpenMAIC generation failed to start');
      }

      onKickoff({ jobId: data.jobId, prompt, type: 'slide_deck' });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setKicking(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} titleId={titleId} closeDisabled={kicking}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          M
        </div>
        <h2 id={titleId} className="text-2xl font-bold">Generate OpenMAIC Classroom</h2>
      </div>
      <p className="text-gray-500 mb-6 text-sm">
        Sends your topic to the OpenMAIC multi-agent pipeline. Generation runs in the background — you can keep
        working and we'll notify you when it's ready (usually under 2 minutes).
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
            disabled={kicking}
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
            disabled={kicking}
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

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
            disabled={kicking}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/20"
            disabled={kicking || !prompt.trim()}
          >
            {kicking ? 'Starting...' : 'Generate Classroom'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface GenerateModalProps {
  onClose: () => void;
  onKickoff: (info: { jobId: string; prompt: string; type: 'slide_deck' | 'quiz' }) => void;
}

function GenerateModal({ onClose, onKickoff }: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'slide_deck' | 'quiz'>('slide_deck');
  const [kicking, setKicking] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setKicking(true);
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

      // Defensive parse — edge proxies sometimes return HTML error pages.
      let data: { jobId?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned a non-JSON response (HTTP ${res.status}). The job may not have been created.`);
      }

      if (!res.ok || !data.jobId) {
        throw new Error(data.error || 'Generation failed to start');
      }

      onKickoff({ jobId: data.jobId, prompt, type });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setKicking(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} titleId={titleId} closeDisabled={kicking}>
      <h2 id={titleId} className="text-2xl font-bold mb-2">Generate with AI</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Describe the topic and learning level. Generation runs in the background — you can keep working and
        we'll notify you when it's ready.
      </p>

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
            disabled={kicking}
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
            disabled={kicking}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
            disabled={kicking || !prompt.trim()}
          >
            {kicking ? 'Starting...' : 'Generate Now'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface AssetCardProps {
  asset: LibraryAsset;
  accessCode: string;
  onUse: () => void;
  onPreview: () => void;
  onDelete: () => void;
  deleting: boolean;
}

function AssetCard({ asset, accessCode, onUse, onPreview, onDelete, deleting }: AssetCardProps) {
  const [copied, setCopied] = useState(false);
  const classroomId = asset.latest_payload?.openmaicClassroomId;
  const classroomUrl = classroomId ? publicClassroomUrl(classroomId) : null;

  async function copyAccessCode() {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col">
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

      <div className="text-xs text-gray-400 mb-3">
        {new Date(asset.created_at).toLocaleDateString()}
        {asset.version_count > 1 && ` · ${asset.version_count} versions`}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap gap-2">
        <button
          onClick={onUse}
          className="text-sm text-primary hover:underline font-medium px-2 py-1"
        >
          Use
        </button>

        {asset.type === 'slide_deck' &&
          ((asset.latest_payload?.slides?.length ?? 0) > 0 || classroomId) && (
            <button
              onClick={onPreview}
              className="text-sm px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 shadow-sm"
            >
              Preview Slides
            </button>
          )}

        {classroomId && accessCode && (
          <div
            data-testid="library-access-code"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-900 ring-1 ring-amber-200"
          >
            <span className="font-medium">Code:</span>
            <code className="font-mono tracking-wider">{accessCode}</code>
            <button
              type="button"
              onClick={copyAccessCode}
              aria-label="Copy access code"
              className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium hover:bg-amber-200"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        {classroomUrl && (
          <a
            href={classroomUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="enter-classroom"
            className="text-sm px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:from-purple-700 hover:to-indigo-700 shadow-sm inline-flex items-center gap-1"
          >
            Enter Classroom
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <button
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete asset"
          className="text-sm text-red-600 hover:bg-red-50 font-medium px-2 py-1 rounded disabled:opacity-50 ml-auto"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function GenerationNotifications({
  jobs,
  onDismiss,
}: {
  jobs: ActiveJob[];
  onDismiss: (jobId: string) => void;
}) {
  if (jobs.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none">
      {jobs.map((job) => {
        const isPending = job.status === 'pending';
        const isFailed = job.status === 'failed';
        const kindLabel = job.kind === 'openmaic'
          ? 'OpenMAIC Classroom'
          : job.type === 'slide_deck' ? 'Slide Deck' : 'Quiz';
        const truncated = job.prompt.length > 40 ? `${job.prompt.substring(0, 37)}...` : job.prompt;
        const hasMeasuredProgress = job.kind === 'openmaic' && typeof job.progress === 'number';
        const sceneLabel = job.totalScenes && job.totalScenes > 0
          ? `${job.scenesGenerated ?? 0}/${job.totalScenes} scenes`
          : null;

        let body: React.ReactNode;
        if (isPending) {
          body = (
            <div>
              <div className="font-semibold text-gray-900 text-sm">Generating {kindLabel}</div>
              <div className="text-gray-600 text-xs mt-0.5 truncate" title={job.prompt}>{truncated}</div>
              {job.message && (
                <div className="text-gray-600 text-xs mt-2">{job.message}</div>
              )}
              {hasMeasuredProgress ? (
                <div className="mt-3">
                  <Progress value={job.progress ?? 0} />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                    <span>{Math.round(job.progress ?? 0)}%</span>
                    {sceneLabel && <span>{sceneLabel}</span>}
                  </div>
                </div>
              ) : (
                <progress
                  aria-label={`Generating ${kindLabel}`}
                  className="mt-3 h-2 w-full accent-purple-600"
                />
              )}
            </div>
          );
        } else if (isFailed) {
          body = (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">!</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{kindLabel} failed</div>
                <div className="text-gray-600 text-xs mt-0.5">{job.error || 'Unknown error'}</div>
              </div>
            </div>
          );
        } else {
          body = (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{kindLabel} ready</div>
                <div className="text-gray-600 text-xs mt-0.5 truncate" title={job.prompt}>{truncated}</div>
                {job.fallback && (
                  <div className="text-xs text-amber-600 mt-1">{job.warning || 'Created with fallback (core unreachable).'}</div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div
            key={job.jobId}
            className={`bg-white rounded-xl shadow-xl border p-4 pointer-events-auto transition-opacity ${
              isPending ? 'border-purple-200' : isFailed ? 'border-red-200' : 'border-green-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">{body}</div>
              <button
                onClick={() => onDismiss(job.jobId)}
                aria-label="Dismiss"
                className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const POLL_INTERVAL_MS = 3_000;
const NOT_FOUND_RETRY_LIMIT = 3; // tolerate a brief route deployment/edge propagation delay

export default function LibraryPage() {
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'slide_deck' | 'quiz'>('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [previewingAsset, setPreviewingAsset] = useState<LibraryAsset | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showOpenmaicGenerate, setShowOpenmaicGenerate] = useState(false);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [accessCode, setAccessCode] = useState('');
  const pendingJobsRef = useRef<ActiveJob[]>([]);
  const hasPendingJobs = activeJobs.some(job => job.status === 'pending');

  useEffect(() => {
    fetchAssets();
    fetchClasses();
  }, [filter, subjectFilter, search]);

  useEffect(() => {
    void fetchAccessCode();
  }, []);

  // Track pending jobs for the polling loop.
  useEffect(() => {
    pendingJobsRef.current = activeJobs.filter(j => j.status === 'pending');
  }, [activeJobs]);

  // Per-job 404 retry counter — survives across ticks because we keep it in
  // a ref. Resets when the job transitions out of 'pending'.
  const notFoundCountsRef = useRef<Map<string, number>>(new Map());

  // Poll pending jobs. Returns cleanup that stops the interval.
  useEffect(() => {
    if (pendingJobsRef.current.length === 0) return;

    const tick = async () => {
      const pending = pendingJobsRef.current;
      if (pending.length === 0) return;

      await Promise.all(pending.map(async (job) => {
        // Native fetch does not add Next.js basePath. Address the teacher API
        // explicitly or the browser hits /api/* (outside /teacher) and gets a
        // framework 404 even though the durable job exists in Postgres.
        const url = job.kind === 'openmaic'
          ? `/teacher/api/teacher/library/generate-classroom-status/${job.jobId}`
          : `/teacher/api/teacher/library/generate-status/${job.jobId}`;

        try {
          const res = await fetch(url, {
            headers: { 'x-session-id': getSessionId() },
          });

          // Defensive parse — edge proxies sometimes return HTML error pages.
          let data: {
            status?: 'pending' | 'completed' | 'failed';
            asset?: unknown;
            error?: string;
            warning?: string;
            fallback?: boolean;
            progress?: number | null;
            step?: string | null;
            message?: string | null;
            scenesGenerated?: number | null;
            totalScenes?: number | null;
          } = {};

          if (res.status === 404) {
            // Give route deployment/edge propagation a few retries before
            // declaring the job lost. Durable jobs survive process restarts.
            const counts = notFoundCountsRef.current;
            const prev = counts.get(job.jobId) ?? 0;
            const next = prev + 1;
            counts.set(job.jobId, next);
            if (next < NOT_FOUND_RETRY_LIMIT) {
              return; // keep polling
            }
            counts.delete(job.jobId);
            setActiveJobs((prevJobs) => prevJobs.map(j =>
              j.jobId === job.jobId
                ? {
                    ...j,
                    status: 'failed',
                    error: 'Generation could not be tracked (server may have restarted). Check your library — it may already be there.',
                  }
                : j
            ));
            // Refresh the library once; the asset might have landed before
            // the worker crashed.
            void fetchAssets();
            return;
          }

          try {
            data = await res.json();
          } catch {
            // Treat unparseable response as transient; keep polling.
            return;
          }

          if (!res.ok) {
            // Auth or other hard error — mark failed and stop polling.
            setActiveJobs((prev) => prev.map(j =>
              j.jobId === job.jobId
                ? { ...j, status: 'failed', error: data.error || `HTTP ${res.status}` }
                : j
            ));
            return;
          }

          if (!data.status) return;

          setActiveJobs((prev) => prev.map(j =>
            j.jobId === job.jobId
              ? {
                  ...j,
                  status: data.status ?? j.status,
                  asset: data.asset ?? j.asset,
                  error: data.error ?? j.error,
                  warning: data.warning ?? j.warning,
                  fallback: data.fallback ?? j.fallback,
                  progress: data.progress ?? j.progress,
                  step: data.step ?? j.step,
                  message: data.message ?? j.message,
                  scenesGenerated: data.scenesGenerated ?? j.scenesGenerated,
                  totalScenes: data.totalScenes ?? j.totalScenes,
                }
              : j
          ));

          if (data.status !== 'pending') {
            notFoundCountsRef.current.delete(job.jobId);
          }
        } catch {
          // Network blip — keep polling.
        }
      }));
    };

    // Fire once immediately, then poll.
    void tick();
    const intervalId = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [hasPendingJobs]);

  // When any job completes, refresh the asset list so the new asset appears.
  const completedCountRef = useRef(0);
  useEffect(() => {
    const completed = activeJobs.filter(j => j.status === 'completed').length;
    if (completed > completedCountRef.current) {
      void fetchAssets();
    }
    completedCountRef.current = completed;
  }, [activeJobs]);

  async function fetchAccessCode() {
    try {
      const res = await fetch('/teacher/api/teacher/access-code', {
        headers: { 'x-session-id': getSessionId() },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { code?: string };
      setAccessCode(data.code ?? '');
    } catch {
      setAccessCode('');
    }
  }

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

  function dismissJob(jobId: string) {
    setActiveJobs((prev) => prev.filter(j => j.jobId !== jobId));
  }

  async function handleDelete(asset: LibraryAsset) {
    if (!confirm(`Delete "${asset.title}"? This cannot be undone.`)) return;
    setDeletingId(asset.id);
    try {
      const res = await fetch(`/teacher/api/teacher/library/assets/${asset.id}`, {
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete asset');
    } finally {
      setDeletingId(null);
    }
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
              accessCode={accessCode}
              onUse={() => setSelectedAsset(asset)}
              onPreview={() => setPreviewingAsset(asset)}
              onDelete={() => handleDelete(asset)}
              deleting={deletingId === asset.id}
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
          onPreview={() => setPreviewingAsset(selectedAsset)}
        />
      )}

      {/* Preview Slides Modal */}
      {previewingAsset && (
        <PreviewSlidesModal
          asset={previewingAsset}
          onClose={() => setPreviewingAsset(null)}
        />
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onKickoff={({ jobId, prompt, type }) => {
            setActiveJobs((prev) => [...prev, {
              jobId,
              kind: 'ai',
              type,
              prompt,
              status: 'pending',
            }]);
            setShowGenerate(false);
          }}
        />
      )}

      {/* OpenMAIC Generate Modal */}
      {showOpenmaicGenerate && (
        <OpenmaicGenerateModal
          classes={classes}
          onClose={() => setShowOpenmaicGenerate(false)}
          onKickoff={({ jobId, prompt }) => {
            setActiveJobs((prev) => [...prev, {
              jobId,
              kind: 'openmaic',
              type: 'slide_deck',
              prompt,
              status: 'pending',
            }]);
            setShowOpenmaicGenerate(false);
          }}
        />
      )}

      {/* Generation notifications */}
      <GenerationNotifications jobs={activeJobs} onDismiss={dismissJob} />
    </div>
  );
}
// dummy edit 1783337218
