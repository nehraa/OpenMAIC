'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface SessionState {
  currentSlideIndex: number;
  totalSlides: number;
  slideContent?: string;
  timestamp: string;
}

interface LiveSession {
  id: string;
  assignment_id: string;
  assignment_title: string;
  teacher_name: string;
  state_snapshot_json: string;
  status: 'live' | 'ended';
  started_at: string;
  ended_at: string | null;
  state?: SessionState;
}

interface Participation {
  id: string;
  completion_state: 'pending' | 'completed';
  joined_at: string;
}

export default function StudentLiveSessionPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/student/api/student/live-sessions/${sessionId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch session');
      }
      const result = await res.json();
      setSession(result.session);
      setParticipation(result.participation);

      if (result.participation) {
        setHasJoined(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();

    // Poll every 3 seconds
    const interval = setInterval(fetchSession, 3000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleJoin = async () => {
    try {
      const res = await fetch(`/student/api/student/live-sessions/${sessionId}/join`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join');
      }

      const result = await res.json();
      setParticipation(result.participant);
      setHasJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
    }
  };

  const handleMarkComplete = async () => {
    try {
      const res = await fetch(`/student/api/student/live-sessions/${sessionId}/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_state: 'completed' })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark complete');
      }

      setParticipation(prev => prev ? { ...prev, completion_state: 'completed' } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark complete');
    }
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) return;

    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/student/api/student/live-sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText.trim() })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit question');
      }

      setQuestionText('');
      setShowQuestionModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setSubmittingQuestion(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">Error: {error}</div>;
  if (!session) return <div className="min-h-screen flex items-center justify-center">Session not found</div>;

  const isEnded = session.status === 'ended';
  const currentSlideIndex = session.state?.currentSlideIndex ?? 0;
  const totalSlides = session.state?.totalSlides ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{session.assignment_title}</h1>
              <p className="text-sm text-gray-500">
                with {session.teacher_name} - {isEnded ? 'Session ended' : 'Live'}
              </p>
            </div>
            {hasJoined && !isEnded && (
              <button
                onClick={() => setShowQuestionModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ask Question
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!hasJoined && !isEnded ? (
          /* Join prompt */
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to join?</h2>
            <p className="text-gray-600 mb-6">
              Click below to join this live session and follow along with the slides.
            </p>
            <button
              onClick={handleJoin}
              className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition"
            >
              Join Session
            </button>
          </div>
        ) : (
          /* Slide viewer */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl font-bold mb-4">
                  Slide {currentSlideIndex + 1}
                </div>
                <div className="text-gray-400">
                  {totalSlides > 0 ? `of ${totalSlides}` : 'No slides'}
                </div>
                {isEnded && (
                  <div className="mt-4 text-red-400">
                    This session has ended
                  </div>
                )}
              </div>
            </div>

            {/* Status bar */}
            <div className="p-4 bg-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isEnded ? 'bg-gray-400' : 'bg-green-500 animate-pulse'}`}></span>
                <span className="text-gray-600">
                  {isEnded ? 'Session ended' : 'Following along'}
                </span>
              </div>
              {participation?.completion_state === 'completed' ? (
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                  Completed
                </span>
              ) : hasJoined && !isEnded ? (
                <button
                  onClick={handleMarkComplete}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Mark Complete
                </button>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Ask a Question</h3>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={1000}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowQuestionModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitQuestion}
                disabled={!questionText.trim() || submittingQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingQuestion ? 'Submitting...' : 'Submit Question'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
