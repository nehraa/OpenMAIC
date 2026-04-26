'use client';

import { useEffect, useState, use } from 'react';
import { Clock, MessageCircle, CheckCircle, PlayCircle, AlertCircle } from 'lucide-react';

interface SessionContent {
  id: string;
  title: string;
  status: 'draft' | 'live' | 'ended';
  started_at?: string;
  ended_at?: string;
  max_duration_minutes: number;
  content?: {
    slides?: SlideContent[];
    notebook?: NotebookContent;
    media?: MediaContent[];
  };
}

interface SlideContent {
  id: string;
  title?: string;
  content: string;
  image_url?: string;
}

interface NotebookContent {
  cells: NotebookCell[];
}

interface NotebookCell {
  id: string;
  type: 'text' | 'code' | 'image';
  content: string;
}

interface MediaContent {
  id: string;
  type: 'audio' | 'video';
  url: string;
  title?: string;
}

interface QuestionModalProps {
  onSubmit: (question: string) => Promise<void>;
  onClose: () => void;
}

function QuestionModal({ onSubmit, onClose }: QuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(question.trim());
      onClose();
    } catch (error) {
      console.error('Failed to submit question:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">Ask a Question</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="w-full h-32 p-3 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isSubmitting}
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!question.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SessionEndedOverlay() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Session Ended</h2>
        <p className="text-gray-600">
          This session has ended. Thank you for participating!
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="p-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function StudentSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<SessionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.status !== 'live' || timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          setSessionEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session, timeRemaining]);

  async function fetchSession() {
    try {
      const response = await fetch(`/api/student/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setSession(null);
          return;
        }
        throw new Error('Failed to fetch session');
      }

      const data = await response.json();
      const sessionData = data.session;

      setSession(sessionData);

      // Check if session has already ended
      if (sessionData.status === 'ended') {
        setSessionEnded(true);
      } else if (sessionData.status === 'live' && sessionData.started_at && sessionData.max_duration_minutes) {
        // Calculate time remaining
        const startTime = new Date(sessionData.started_at).getTime();
        const endTime = startTime + sessionData.max_duration_minutes * 60 * 1000;
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        if (remaining <= 0) {
          setSessionEnded(true);
        } else {
          setTimeRemaining(remaining);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkComplete() {
    try {
      const response = await fetch(`/api/student/sessions/${sessionId}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completion_state: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as complete');
      }

      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking complete:', error);
    }
  }

  async function handleAskQuestion(question: string) {
    const response = await fetch(`/api/student/sessions/${sessionId}/questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit question');
    }
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (sessionEnded) {
    return <SessionEndedOverlay />;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="text-gray-600">
            The session you are looking for does not exist or you do not have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Session Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {session.title || 'Classroom Session'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    session.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : session.status === 'ended'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {session.status === 'live' && (
                    <PlayCircle className="w-3 h-3 mr-1" />
                  )}
                  {session.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          {timeRemaining !== null && session.status === 'live' && (
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-mono font-semibold text-gray-700">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Slides Content */}
        {session.content?.slides && session.content.slides.length > 0 && (
          <div className="space-y-6">
            {session.content.slides.map((slide, index) => (
              <div
                key={slide.id || index}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                {slide.title && (
                  <h2 className="text-lg font-semibold mb-4">{slide.title}</h2>
                )}
                <div className="prose prose-gray max-w-none">
                  <p className="whitespace-pre-wrap">{slide.content}</p>
                </div>
                {slide.image_url && (
                  <div className="mt-4">
                    <img
                      src={slide.image_url}
                      alt={`Slide ${index + 1}`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notebook Content */}
        {session.content?.notebook && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Notebook</h2>
            <div className="space-y-4">
              {session.content.notebook.cells.map((cell, index) => (
                <div key={cell.id || index}>
                  {cell.type === 'text' && (
                    <p className="whitespace-pre-wrap">{cell.content}</p>
                  )}
                  {cell.type === 'code' && (
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      <code>{cell.content}</code>
                    </pre>
                  )}
                  {cell.type === 'image' && (
                    <img
                      src={cell.content}
                      alt={`Cell ${index + 1}`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Content */}
        {session.content?.media && session.content.media.length > 0 && (
          <div className="space-y-6">
            {session.content.media.map((media, index) => (
              <div
                key={media.id || index}
                className="bg-white rounded-xl p-6 shadow-sm"
              >
                {media.title && (
                  <h2 className="text-lg font-semibold mb-4">{media.title}</h2>
                )}
                {media.type === 'audio' && (
                  <audio controls className="w-full">
                    <source src={media.url} />
                    Your browser does not support the audio element.
                  </audio>
                )}
                {media.type === 'video' && (
                  <video controls className="w-full rounded-lg">
                    <source src={media.url} />
                    Your browser does not support the video element.
                  </video>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!session.content?.slides?.length &&
         !session.content?.notebook?.cells?.length &&
         !session.content?.media?.length && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <p className="text-gray-500">
              No content available for this session yet.
            </p>
          </div>
        )}
      </main>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <button
            onClick={() => setShowQuestionModal(true)}
            disabled={session.status !== 'live'}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Ask Question
          </button>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted || session.status !== 'live'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              isCompleted
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <QuestionModal
          onSubmit={handleAskQuestion}
          onClose={() => setShowQuestionModal(false)}
        />
      )}
    </div>
  );
}
