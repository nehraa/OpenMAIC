'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  id: string;
  title: string;
  description: string;
  class_id: string;
  class_name: string | null;
  status: 'draft' | 'scheduled' | 'released' | 'closed';
  release_at: string | null;
  due_at: string | null;
  student_status: 'not_started' | 'in_progress' | 'completed';
  attempt_id: string | null;
  started_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

function StatusBadge({ status }: { status: 'not_started' | 'in_progress' | 'completed' }) {
  const styles = {
    not_started: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700'
  };

  const labels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      const sessionId = getSessionId();
      const res = await fetch('/api/student/assignments', {
        headers: { 'x-session-id': sessionId }
      });

      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      } else if (res.status === 403) {
        // User is not a student - redirect or show error
        console.error('Access denied: user is not a student');
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">My Assignments</h1>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No assignments available yet.</p>
          <p className="text-sm mt-2">Your teacher will assign work when ready.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Due Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/student/assignments/${assignment.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{assignment.class_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {assignment.due_at
                      ? new Date(assignment.due_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={assignment.student_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
