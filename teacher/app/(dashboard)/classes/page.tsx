'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ClassData {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  student_count: number;
  created_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', subject: '', batch: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        headers: { 'x-session-id': getSessionId() }
      });
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify(newClass)
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewClass({ name: '', subject: '', batch: '' });
        fetchClasses();
      }
    } catch (error) {
      console.error('Failed to create class:', error);
    } finally {
      setCreating(false);
    }
  }

  function getSessionId() {
    return localStorage.getItem('session_id') || '';
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Classes</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No classes yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:underline"
          >
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/classes/${cls.id}`}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-lg">{cls.name}</h2>
              <p className="text-gray-600 text-sm">{cls.subject} • {cls.batch}</p>
              <div className="mt-3 flex justify-between text-sm">
                <span className="text-gray-500">{cls.student_count} students</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {cls.join_code}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Class</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Class Name *</label>
                <input
                  type="text"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input
                  type="text"
                  value={newClass.subject}
                  onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Batch</label>
                <input
                  type="text"
                  value={newClass.batch}
                  onChange={(e) => setNewClass({ ...newClass, batch: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 2024-25"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}