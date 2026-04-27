'use client';

import { useEffect, useState } from 'react';
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
  recipient_count: number;
  created_at: string;
}

interface Class {
  id: string;
  name: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchClasses();
  }, []);

  async function fetchAssignments() {
    try {
      const res = await fetch('/api/teacher/assignments', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
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

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        <Link
          href="/teacher/assignments/new"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          Create Assignment
        </Link>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No assignments yet</p>
          <Link href="/teacher/assignments/new" className="text-primary hover:underline">
            Create your first assignment
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Class</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Release Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Recipients</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/teacher/assignments/${assignment.id}`} className="text-primary hover:underline font-medium">
                      {assignment.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{assignment.class_name || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={assignment.status} /></td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {assignment.release_at ? new Date(assignment.release_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{assignment.recipient_count || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}