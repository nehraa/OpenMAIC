'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Participant {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  joined_at: string;
  completion_state: 'pending' | 'completed';
  left_at: string | null;
}

interface Question {
  id: string;
  student_id: string;
  student_name?: string;
  question_text: string;
  answer_text: string | null;
  created_at: string;
  answered_at: string | null;
}

interface SessionState {
  currentSlideIndex: number;
  totalSlides: number;
  slideContent?: string;
  timestamp: string;
}

interface LiveSession {
  id: string;
  assignment_id: string;
  state_snapshot_json: string;
  status: 'live' | 'ended';
  started_at: string;
  ended_at: string | null;
  participants: Participant[];
  participantCount: number;
}

interface SessionData {
  session: LiveSession;
  questions: Question[];
}

export default function TeacherLiveSessionPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(1);
  const [updating, setUpdating] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/teacher/api/teacher/live-sessions/${sessionId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch session');
      }
      const result = await res.json();
      setData(result);

      // Parse state and update local state
      if (result.session.state_snapshot_json) {
        const state: SessionState = JSON.parse(result.session.state_snapshot_json);
        setCurrentSlideIndex(state.currentSlideIndex || 0);
        setTotalSlides(state.totalSlides || 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();

    // Poll every 2 seconds
    const interval = setInterval(fetchSession, 2000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const updateState = async (newSlideIndex: number) => {
    setUpdating(true);
    try {
      const res = await fetch(`/teacher/api/teacher/live-sessions/${sessionId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSlideIndex: newSlideIndex,
          totalSlides
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update state');
      }
    } catch (err) {
      console.error('Failed to update state:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      const newIndex = currentSlideIndex - 1;
      setCurrentSlideIndex(newIndex);
      updateState(newIndex);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      const newIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(newIndex);
      updateState(newIndex);
    }
  };

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this live session?')) {
      return;
    }

    try {
      const res = await fetch(`/teacher/api/teacher/live-sessions/${sessionId}/end`, {
        method: 'POST'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to end session');
      }

      router.push('/teacher/assignments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading session...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center">Session not found</div>;

  const { session, questions } = data;
  const isEnded = session.status === 'ended';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Live Session</h1>
              <p className="text-sm text-gray-500">
                {isEnded ? 'Session ended' : 'Live'} - Started {new Date(session.started_at).toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{session.participantCount}</div>
                <div className="text-sm text-gray-500">students joined</div>
              </div>
              {!isEnded && (
                <button
                  onClick={handleEndSession}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - Slide viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Slide content display */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl font-bold mb-4">
                    Slide {currentSlideIndex + 1}
                  </div>
                  <div className="text-gray-400">
                    {totalSlides > 0 ? `of ${totalSlides}` : 'No slides'}
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              {!isEnded && (
                <div className="p-4 bg-gray-100 flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={currentSlideIndex === 0 || updating}
                    className="px-6 py-2 bg-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <div className="text-gray-600">
                    Slide {currentSlideIndex + 1} of {totalSlides}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={currentSlideIndex >= totalSlides - 1 || updating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Questions panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">
                  Questions ({questions.length})
                </h2>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {questions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No questions yet
                  </div>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">
                            {q.student_name || 'Student'}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(q.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {q.answer_text && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Answered
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-gray-700">{q.question_text}</p>
                      {q.answer_text && (
                        <p className="mt-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                          {q.answer_text}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
