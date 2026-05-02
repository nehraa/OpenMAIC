'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/lib/components/status-badge';
import { CheckCircle, Circle, Clock, Users, FileText, PlayCircle } from 'lucide-react';

interface Recipient {
  student_id: string;
  student_name: string;
  visibility_status: string;
  progress?: {
    viewed_count: number;
    total_slides: number;
    is_complete: boolean;
  };
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  class_id: string;
  class_name?: string;
  status: 'draft' | 'scheduled' | 'released' | 'closed';
  release_at: string | null;
  due_at: string | null;
  created_at: string;
  slide_asset_version_id: string | null;
  recipient_count?: number;
  recipients?: Recipient[];
}

interface PageProps {
  params: Promise<{ assignmentId: string }>;
}

export default function AssignmentDetailPage({ params }: PageProps) {
  const { assignmentId } = use(params);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignment();
    fetchRecipients();
  }, [assignmentId]);

  async function fetchRecipients() {
    try {
      const res = await fetch(`/teacher/api/teacher/assignments/${assignmentId}/recipients`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignment(prev => prev ? { ...prev, recipients: data.recipients } : null);
      }
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    }
  }

  async function fetchAssignment() {
    try {
      const res = await fetch(`/teacher/api/teacher/assignments/${assignmentId}`, {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignment(data.assignment);
      }
    } catch (error) {
      console.error('Failed to fetch assignment:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRelease() {
    if (!confirm('Are you sure you want to release this assignment?')) return;
    try {
      const res = await fetch(`/teacher/api/teacher/assignments/${assignmentId}/release`, {
        method: 'POST',
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        fetchAssignment();
      }
    } catch (error) {
      console.error('Failed to release assignment:', error);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await fetch(`/teacher/api/teacher/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        window.location.href = '/teacher/assignments';
      }
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  }

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!assignment) return <div className="p-8">Assignment not found</div>;

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/teacher/assignments" className="text-gray-500 hover:text-gray-700">← Back</Link>
        <h1 className="text-2xl font-bold flex-1">{assignment.title}</h1>
        <StatusBadge status={assignment.status} />
      </div>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="font-medium mb-4">Assignment Details</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Class</dt>
              <dd className="font-medium">{assignment.class_name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Due Date</dt>
              <dd className="font-medium">{assignment.due_at ? new Date(assignment.due_at).toLocaleDateString() : '—'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="font-medium">{assignment.description || 'No description'}</dd>
            </div>
          </dl>
        </div>

        {assignment.recipients && assignment.recipients.length > 0 && (
          <div className="border rounded-lg p-6">
            <h2 className="font-medium mb-4 flex items-center gap-2">
              <Users size={20} />
              Recipients ({assignment.recipients.length})
            </h2>
            <ul className="divide-y">
              {assignment.recipients.map((r) => {
                const isVisible = r.visibility_status === 'visible' || r.visibility_status === 'completed';
                const isComplete = r.progress?.is_complete;
                return (
                  <li key={r.student_id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isComplete
                          ? 'bg-green-100 text-green-700'
                          : isVisible
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isComplete ? <CheckCircle size={16} /> : isVisible ? <Circle size={16} /> : <Clock size={16} />}
                      </div>
                      <div>
                        <span className="font-medium">{r.student_name}</span>
                        {r.progress && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {r.progress.viewed_count}/{r.progress.total_slides} slides
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Completed
                        </span>
                      ) : isVisible ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          In Progress
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Not Started
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex gap-4">
          {assignment.status === 'draft' && (
            <>
              <Link
                href={`/teacher/assignments/${assignmentId}/edit`}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Edit
              </Link>
              <button
                onClick={handleRelease}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Release
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}