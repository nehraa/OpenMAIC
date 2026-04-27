'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/lib/components/status-badge';

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
  recipients?: Array<{ student_id: string; student_name: string; visibility_status: string }>;
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
  }, [assignmentId]);

  async function fetchAssignment() {
    try {
      const res = await fetch(`/api/teacher/assignments/${assignmentId}`, {
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
      const res = await fetch(`/api/teacher/assignments/${assignmentId}/release`, {
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
      const res = await fetch(`/api/teacher/assignments/${assignmentId}`, {
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
            <h2 className="font-medium mb-4">Recipients ({assignment.recipients.length})</h2>
            <ul className="divide-y">
              {assignment.recipients.map((r) => (
                <li key={r.student_id} className="py-2 flex justify-between">
                  <span>{r.student_name}</span>
                  <StatusBadge status={r.visibility_status === 'visible' ? 'released' : 'draft'} />
                </li>
              ))}
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