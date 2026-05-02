'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Users, Copy, Trash2, Plus, X } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
  student_count: number;
  created_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoinCode, setShowJoinCode] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: '', subject: '', batch: '' });
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  }

  function getSessionId() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('session_id') || '';
  }

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      const res = await fetch('/teacher/api/teacher/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': getSessionId()
        },
        body: JSON.stringify(createForm)
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || 'Failed to create class');
        return;
      }

      setClasses([data.class, ...classes]);
      setShowCreate(false);
      setCreateForm({ name: '', subject: '', batch: '' });
      setShowJoinCode(data.class.join_code);
    } catch (error) {
      setCreateError('Failed to create class');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteClass(classId: string) {
    try {
      const res = await fetch(`/teacher/api/teacher/classes/${classId}`, {
        method: 'DELETE',
        headers: { 'x-session-id': getSessionId() }
      });

      if (res.ok) {
        setClasses(classes.filter(c => c.id !== classId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Failed to delete class:', error);
    }
  }

  async function copyJoinCode(code: string) {
    await navigator.clipboard.writeText(code);
  }

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={18} />
          Create Class
        </button>
      </div>

      {/* Create Class Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Class</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            {showJoinCode ? (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 font-medium mb-2">Class Created Successfully!</p>
                  <p className="text-sm text-green-600 mb-3">Share this join code with your students:</p>
                  <div className="bg-white border border-green-300 rounded-lg px-4 py-3 font-mono text-xl font-bold tracking-wider">
                    {showJoinCode}
                  </div>
                </div>
                <button
                  onClick={() => copyJoinCode(showJoinCode)}
                  className="text-primary hover:underline text-sm flex items-center gap-1 mx-auto"
                >
                  <Copy size={14} /> Copy code
                </button>
                <button
                  onClick={() => setShowJoinCode(null)}
                  className="block w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateClass}>
                {createError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                    {createError}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Mathematics 101"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={createForm.subject}
                      onChange={e => setCreateForm({ ...createForm, subject: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch / Year</label>
                    <input
                      type="text"
                      value={createForm.batch}
                      onChange={e => setCreateForm({ ...createForm, batch: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g., 2024"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {createLoading ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Classes List */}
      {classes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="mb-4">No classes yet</p>
          <button onClick={() => setShowCreate(true)} className="text-primary hover:underline">
            Create your first class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <Link href={`/teacher/classes/${cls.id}`} className="font-semibold text-lg hover:text-primary">
                  {cls.name}
                </Link>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyJoinCode(cls.join_code)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    title="Copy join code"
                  >
                    <Copy size={16} />
                  </button>
                  {deleteConfirm === cls.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDeleteClass(cls.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Confirm delete"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(cls.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete class"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {cls.subject && <p>Subject: {cls.subject}</p>}
                {cls.batch && <p>Batch: {cls.batch}</p>}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Users size={16} />
                  <span>{cls.student_count} student{cls.student_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  Join code: <code className="bg-gray-100 px-1 rounded">{cls.join_code}</code>
                </span>
                <Link
                  href={`/teacher/classes/${cls.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
