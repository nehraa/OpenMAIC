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
  class_id?: string;
  class_name?: string;
  // Unwrapped from latest_payload (the GET /assets endpoint parses the
  // payload_json string column so the page can read fields directly).
  // Used to detect OpenMAIC classroom assets and show the share link.
  latest_payload?: {
    openmaicClassroomId?: string;
    openmaicUrl?: string;
    [key: string]: unknown;
  } | null;
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
      const res = await fetch(`/api/teacher/library/assets/${asset.id}/reuse`, {
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

interface GenerateModalProps {
  onClose: () => void;
  onKickoff: (job: { jobId: string; prompt: string; type: 'slide_deck' | 'quiz' }) => void;
}

function GenerateModal({ onClose, onKickoff }: GenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'slide_deck' | 'quiz'>('slide_deck');
  const [kicking, setKicking] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setKicking(true);
    setError('');

    try {
      const res = await fetch('/api/teacher/library/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify({ prompt, type })
      });

      // Defensive parse — even on non-2xx, the body might be HTML from an
      // edge error page. Treat any non-JSON failure as a kickoff failure.
      let data: { jobId?: string; error?: unknown } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error(`Generation request failed (HTTP ${res.status})`);
      }

      if (!res.ok || !data.jobId) {
        const message =
          (typeof data.error === 'string' && data.error) ||
          `Generation request failed (HTTP ${res.status})`;
        throw new Error(message);
      }

      // Hand the job off to the parent; the modal closes and the page shows
      // a non-blocking toast while generation runs in the background.
      onKickoff({ jobId: data.jobId, prompt, type });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setKicking(false);
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
              disabled={kicking}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/20"
              disabled={kicking || !prompt.trim()}
            >
              {kicking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </>
              ) : 'Generate Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JobLogEntry {
  ts: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface ActiveJob {
  jobId: string;
  prompt: string;
  type: 'slide_deck' | 'quiz';
  status: 'pending' | 'completed' | 'failed';
  error?: string;
  mockContent?: boolean;
  progress: number;
  step: string;
  message: string;
  scenesGenerated: number;
  totalScenes: number;
  log: JobLogEntry[];
  showLog: boolean;
}

function GenerationNotifications({
  jobs,
  onDismiss,
  onToggleLog
}: {
  jobs: ActiveJob[];
  onDismiss: (jobId: string) => void;
  onToggleLog: (jobId: string) => void;
}) {
  if (jobs.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-96" data-testid="generation-notifications">
      {jobs.map((job) => {
        const title =
          job.prompt.length > 60 ? `${job.prompt.substring(0, 57)}...` : job.prompt;
        const isSlide = job.type === 'slide_deck';
        // Clamp progress between 0 and 100 so the bar never goes negative
        // or wider than the toast during the first poll (server returns 0).
        const pct = Math.max(0, Math.min(100, Math.round(job.progress ?? 0)));
        const sceneLabel =
          job.totalScenes > 0
            ? `${job.scenesGenerated}/${job.totalScenes} scenes`
            : null;
        return (
          <div
            key={job.jobId}
            className={`rounded-xl shadow-lg border p-3 flex flex-col gap-2 ${
              job.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : job.status === 'completed'
                  ? 'bg-white border-green-200'
                  : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {job.status === 'pending' ? (
                <div className="w-5 h-5 mt-0.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
              ) : job.status === 'completed' ? (
                <div className="w-5 h-5 mt-0.5 rounded-full bg-green-500 text-white flex items-center justify-center text-xs shrink-0">✓</div>
              ) : (
                <div className="w-5 h-5 mt-0.5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0">!</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {isSlide ? 'Slide deck' : 'Quiz'}
                </div>
                <div className="text-sm font-medium text-gray-900 truncate">{title}</div>
                <div className={`text-xs mt-0.5 ${
                  job.status === 'failed' ? 'text-red-600' :
                  job.status === 'completed' ? (job.mockContent ? 'text-amber-600' : 'text-green-600') :
                  'text-gray-500'
                }`}>
                  {job.status === 'pending' && (job.message || 'Generating in background...')}
                  {job.status === 'completed' && (job.mockContent ? 'Done (sample content)' : 'Done — refresh library to view')}
                  {job.status === 'failed' && (job.error || 'Failed')}
                </div>
              </div>
              {job.status !== 'pending' && (
                <button
                  onClick={() => onDismiss(job.jobId)}
                  className="text-gray-400 hover:text-gray-600 text-sm shrink-0"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              )}
            </div>

            {/* Progress bar — visible while running. Clamps to 2% min so the
                user sees movement even before the first scenes start. */}
            {job.status === 'pending' && (
              <div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                  <span>{pct}%</span>
                  {sceneLabel && <span>{sceneLabel}</span>}
                </div>
              </div>
            )}

            {/* Log toggle — keeps the toast small by default but lets the
                teacher expand the trail when something went sideways. */}
            <button
              onClick={() => onToggleLog(job.jobId)}
              className="self-start text-[10px] text-gray-500 hover:text-gray-700 uppercase tracking-wide"
              data-testid="toggle-log"
            >
              {job.showLog ? '▾ Hide log' : '▸ Show log'}
            </button>
            {job.showLog && job.log.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-2 max-h-40 overflow-y-auto font-mono text-[10px] leading-relaxed">
                {job.log.slice(-12).map((entry, i) => (
                  <div
                    key={i}
                    className={
                      entry.level === 'error'
                        ? 'text-red-700'
                        : entry.level === 'warn'
                          ? 'text-amber-700'
                          : 'text-gray-600'
                    }
                  >
                    <span className="text-gray-400">
                      {new Date(entry.ts).toLocaleTimeString()}
                    </span>{' '}
                    {entry.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AssetCard({
  asset,
  accessCode,
  onUse
}: {
  asset: LibraryAsset;
  accessCode: string;
  onUse: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isOpenMAIC =
    asset.type === 'slide_deck' &&
    Boolean(asset.latest_payload?.openmaicClassroomId);
  const shareUrl = asset.latest_payload?.openmaicUrl;

  async function copyCode() {
    if (!accessCode) return;
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — teacher can still read it off the badge.
    }
  }

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={onUse}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900 line-clamp-1">{asset.title}</h3>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          asset.type === 'slide_deck' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {asset.type === 'slide_deck' ? 'Slides' : 'Quiz'}
        </span>
      </div>

      {asset.subject_tag && (
        <p className="text-sm text-gray-500 mb-1">{asset.subject_tag}</p>
      )}

      {asset.class_name && (
        <p className="text-xs text-primary font-medium mb-2">{asset.class_name}</p>
      )}

      {/* Access-code badge — shown only for OpenMAIC classroom assets when
          a code is configured. The teacher needs this to share with
          students; without it they have to ask support. */}
      {isOpenMAIC && accessCode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 ring-1 ring-amber-200 pl-2 pr-1 py-1 text-xs text-amber-900"
          data-testid="library-access-code"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <span className="font-medium">Code:</span>
          <code className="font-mono tracking-widest">{accessCode}</code>
          <button
            onClick={copyCode}
            className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 hover:bg-amber-200 transition-colors"
            aria-label="Copy access code"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          {shareUrl && (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              Open
            </a>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <span className="text-xs text-gray-400">
          {new Date(asset.created_at).toLocaleDateString()}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUse();
          }}
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
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<LibraryAsset | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  // Mirrors core's ACCESS_CODE — fetched once on mount, shown on each
  // OpenMAIC classroom asset card so the teacher knows which code to
  // share with students.
  const [accessCode, setAccessCode] = useState<string>('');

  // Poll status for any pending jobs every 3s. Stop polling once everything
  // is resolved; completed/failed jobs stick around as a toast until the
  // teacher dismisses them.
  useEffect(() => {
    const pending = activeJobs.filter(j => j.status === 'pending');
    if (pending.length === 0) return;
    const interval = setInterval(async () => {
      for (const job of pending) {
        try {
          const res = await fetch(`/api/teacher/library/generate-status/${job.jobId}`, {
            headers: { 'x-session-id': getSessionId() }
          });
          if (res.status === 404) {
            setActiveJobs(prev =>
              prev.map(j =>
                j.jobId === job.jobId
                  ? { ...j, status: 'failed', error: 'Server lost the job — please retry' }
                  : j
              )
            );
            continue;
          }
          if (!res.ok) continue;
          const data = await res.json();
          setActiveJobs(prev =>
            prev.map(j =>
              j.jobId === job.jobId
                ? {
                    ...j,
                    status: data.status,
                    error: data.error || undefined,
                    mockContent: data.mockContent || undefined,
                    progress: data.progress ?? j.progress,
                    step: data.step ?? j.step,
                    message: data.message ?? j.message,
                    scenesGenerated: data.scenesGenerated ?? j.scenesGenerated,
                    totalScenes: data.totalScenes ?? j.totalScenes,
                    log: Array.isArray(data.log) ? data.log : j.log,
                  }
                : j
            )
          );
        } catch {
          // Transient network blip — try again next tick.
        }
      }
      // If anything just completed, refresh the library grid so the new
      // asset shows up without manual reload.
      if (pending.some(j => j.status !== 'pending')) {
        // re-runs via state update triggering this effect; harmless no-op here
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeJobs]);

  // When a job completes, pull fresh library data so the new asset appears
  // without the teacher needing to refresh.
  useEffect(() => {
    const justCompleted = activeJobs.some(
      j => j.status === 'completed'
    );
    if (justCompleted) {
      fetchAssets();
    }
  }, [activeJobs.map(j => `${j.jobId}:${j.status}`).join(',')]);

  function dismissJob(jobId: string) {
    setActiveJobs(prev => prev.filter(j => j.jobId !== jobId));
  }

  function toggleJobLog(jobId: string) {
    setActiveJobs(prev =>
      prev.map(j => (j.jobId === jobId ? { ...j, showLog: !j.showLog } : j))
    );
  }

  useEffect(() => {
    fetchAssets();
    fetchClasses();
    fetchAccessCode();
  }, [filter, subjectFilter, search, classFilter]);

  async function fetchAccessCode() {
    try {
      const res = await fetch('/api/teacher/access-code', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.code) setAccessCode(data.code);
    } catch {
      // Non-fatal — badge just won't show if the endpoint is unreachable.
    }
  }

  async function fetchAssets() {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('type', filter);
      if (subjectFilter) params.set('subject', subjectFilter);
      if (search) params.set('search', search);
      if (classFilter) params.set('classId', classFilter);

      const res = await fetch(`/api/teacher/library/assets?${params}`, {
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
      const res = await fetch('/api/teacher/classes', {
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

        <div className="flex gap-4 items-center flex-wrap">
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

          {classes.length > 0 && (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Class Tabs */}
      {classes.length > 0 && (
        <div className="flex gap-2 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => { setActiveTab('all'); setClassFilter(''); }}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'all' && !classFilter
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Classes
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => { setActiveTab(cls.id); setClassFilter(cls.id); }}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === cls.id || classFilter === cls.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

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
          onKickoff={(job) => {
            setActiveJobs(prev => [
              ...prev,
              {
                jobId: job.jobId,
                prompt: job.prompt,
                type: job.type,
                status: 'pending',
                progress: 0,
                step: 'queued',
                message: 'Queued',
                scenesGenerated: 0,
                totalScenes: 0,
                log: [],
                showLog: false,
              }
            ]);
          }}
        />
      )}

      {/* Background generation toasts — non-blocking, persist across modal close */}
      <GenerationNotifications
        jobs={activeJobs}
        onDismiss={dismissJob}
        onToggleLog={toggleJobLog}
      />
    </div>
  );
}