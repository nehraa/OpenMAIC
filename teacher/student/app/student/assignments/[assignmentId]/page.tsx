'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

interface AssignmentDetail {
  id: string;
  title: string;
  description: string;
  class_id: string;
  class_name: string | null;
  status: 'draft' | 'scheduled' | 'released' | 'closed';
  release_at: string | null;
  due_at: string | null;
  slide_asset_version_id: string | null;
  quiz_asset_version_id: string | null;
  student_status: 'not_started' | 'in_progress' | 'completed';
  attempt_id: string | null;
  started_at: string | null;
  submitted_at: string | null;
  score_percent: number | null;
  viewed_slides: string[];
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

export default function StudentAssignmentDetailPage({
  params
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  async function fetchAssignment() {
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/student/assignments/${assignmentId}`, {
        headers: { 'x-session-id': sessionId }
      });

      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
      } else if (res.status === 404) {
        router.push('/student/assignments');
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/student/assignments/${assignmentId}/start`, {
        method: 'POST',
        headers: { 'x-session-id': sessionId }
      });

      if (res.ok) {
        const data = await res.json();
        setAssignment((prev) =>
          prev
            ? {
                ...prev,
                attempt_id: data.attempt.id,
                student_status: 'in_progress',
                started_at: data.attempt.started_at
              }
            : null
        );
      }
    } catch (error) {
      console.error('Failed to start assignment:', error);
    }
  }

  async function handleSubmit() {
    if (!assignment?.attempt_id) return;

    setSubmitting(true);
    try {
      const sessionId = getSessionId();
      const res = await fetch(`/api/student/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attemptId: assignment.attempt_id,
          answers: {}
        })
      });

      if (res.ok) {
        setShowConfirmation(true);
        setAssignment((prev) =>
          prev ? { ...prev, student_status: 'completed', submitted_at: new Date().toISOString() } : null
        );
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!assignment) {
    return <div className="p-8">Assignment not found</div>;
  }

  if (showConfirmation) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2">Assignment Submitted!</h2>
          <p className="text-green-700">
            Your assignment has been submitted successfully. Your teacher will review it soon.
          </p>
          <button
            onClick={() => router.push('/student/assignments')}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => router.push('/student/assignments')}
        className="text-gray-500 hover:text-gray-700 mb-4 flex items-center gap-1"
      >
        ← Back to Assignments
      </button>

      <div className="bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{assignment.title}</h1>
        {assignment.class_name && (
          <p className="text-gray-500 mb-4">{assignment.class_name}</p>
        )}

        {assignment.description && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-gray-600">{assignment.description}</p>
          </div>
        )}

        {assignment.due_at && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Due Date</h3>
            <p className="text-gray-600">{new Date(assignment.due_at).toLocaleDateString()}</p>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Status</h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              assignment.student_status === 'completed'
                ? 'bg-green-100 text-green-700'
                : assignment.student_status === 'in_progress'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            {assignment.student_status === 'not_started'
              ? 'Not Started'
              : assignment.student_status === 'in_progress'
                ? 'In Progress'
                : 'Completed'}
          </span>
        </div>

        {assignment.student_status === 'not_started' && (
          <button
            onClick={handleStart}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 font-medium"
          >
            Start Assignment
          </button>
        )}

        {assignment.student_status === 'in_progress' && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        )}
      </div>
    </div>
  );
}
