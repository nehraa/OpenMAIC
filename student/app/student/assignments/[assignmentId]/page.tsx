'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Circle, Clock, PlayCircle } from 'lucide-react';

interface Slide {
  slide_id: string;
  title: string;
  content: string;
  index: number;
  viewed: boolean;
  viewed_at: string | null;
}

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  class_name: string;
  due_at: string | null;
  status: string;
}

interface Progress {
  viewed_count: number;
  total_slides: number;
  is_complete: boolean;
}

interface Attempt {
  completion_state: string;
  submitted_at: string | null;
  score_percent: number | null;
}

export default function StudentAssignmentDetailPage() {
  const { assignmentId } = useParams();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fetchAssignment = useCallback(async () => {
    try {
      const res = await fetch(`/student/api/student/assignments/${assignmentId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch assignment');
      }
      const data = await res.json();
      setAssignment(data.assignment);
      setSlides(data.slides || []);
      setProgress(data.progress);
      setAttempt(data.attempt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleSlideView = async (slideId: string) => {
    try {
      const res = await fetch(`/student/api/student/assignments/${assignmentId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideId })
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);
        // Mark slide as viewed in local state
        setSlides(prev =>
          prev.map(slide =>
            slide.slide_id === slideId
              ? { ...slide, viewed: true, viewed_at: new Date().toISOString() }
              : slide
          )
        );
      }
    } catch (err) {
      console.error('Failed to track progress:', err);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIndex);
      handleSlideView(slides[nextIndex].slide_id);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8 max-w-md text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/student/assignments" className="text-primary hover:underline">
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="bg-white rounded-xl border p-8 max-w-md text-center">
          <p className="text-muted-foreground mb-4">Assignment not found</p>
          <Link href="/student/assignments" className="text-primary hover:underline">
            Back to Assignments
          </Link>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];
  const progressPercent = progress && progress.total_slides > 0
    ? Math.round((progress.viewed_count / progress.total_slides) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/student/assignments"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{assignment.title}</h1>
                <p className="text-sm text-muted-foreground">{assignment.class_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {progress && (
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {progress.viewed_count} / {progress.total_slides} slides
                  </div>
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              {progress?.is_complete && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  <CheckCircle size={16} />
                  Complete
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {slides.length === 0 ? (
          /* No slides available */
          <div className="bg-white rounded-xl border p-12 text-center">
            <PlayCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Slides Available</h2>
            <p className="text-muted-foreground">
              This assignment doesn&apos;t have any slides attached yet.
            </p>
            {assignment.due_at && (
              <p className="text-sm text-muted-foreground mt-4">
                Due: {new Date(assignment.due_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Slide Navigation */}
            <div className="bg-white rounded-xl border overflow-hidden">
              {/* Slide header */}
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    Slide {currentSlideIndex + 1} of {slides.length}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {currentSlide?.title || `Slide ${currentSlideIndex + 1}`}
                  </span>
                </div>
                {currentSlide?.viewed ? (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle size={16} />
                    Viewed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-600 text-sm">
                    <Circle size={16} />
                    Not viewed
                  </span>
                )}
              </div>

              {/* Slide content area */}
              <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                <div className="text-white text-center p-8">
                  <div className="text-4xl font-bold mb-2">
                    Slide {currentSlideIndex + 1}
                  </div>
                  <div className="text-gray-400">
                    {currentSlide?.title || 'No title'}
                  </div>
                  {currentSlide?.content && (
                    <div className="mt-4 text-gray-300 max-w-xl mx-auto">
                      {currentSlide.content}
                    </div>
                  )}
                </div>

                {/* Navigation arrows */}
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={24} className="text-white" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/30 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={24} className="text-white rotate-180" />
                </button>
              </div>

              {/* Slide footer with mark as viewed button */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <div className="flex gap-2">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.slide_id}
                      onClick={() => {
                        setCurrentSlideIndex(index);
                        if (!slide.viewed) {
                          handleSlideView(slide.slide_id);
                        }
                      }}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition ${
                        index === currentSlideIndex
                          ? 'bg-primary text-white'
                          : slide.viewed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                {!currentSlide?.viewed && (
                  <button
                    onClick={() => handleSlideView(currentSlide?.slide_id || '')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                  >
                    Mark as Viewed
                  </button>
                )}
              </div>
            </div>

            {/* Assignment info */}
            <div className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold mb-4">Assignment Details</h2>
              {assignment.description && (
                <p className="text-muted-foreground mb-4">{assignment.description}</p>
              )}
              {assignment.due_at && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock size={16} />
                  Due: {new Date(assignment.due_at).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Attempt info if exists */}
            {attempt && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="font-semibold mb-4">Your Submission</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p className="font-medium capitalize">{attempt.completion_state.replace('_', ' ')}</p>
                  </div>
                  {attempt.score_percent !== null && (
                    <div>
                      <span className="text-muted-foreground">Score</span>
                      <p className="font-medium">{attempt.score_percent}%</p>
                    </div>
                  )}
                  {attempt.submitted_at && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Submitted</span>
                      <p className="font-medium">{new Date(attempt.submitted_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}