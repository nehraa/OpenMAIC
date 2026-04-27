'use client';

import { useState } from 'react';

interface AssignmentFormData {
  title: string;
  description: string;
  classId: string;
  dueAt: string;
  recipientStudentIds: string[];
}

interface Class {
  id: string;
  name: string;
}

interface AssignmentFormProps {
  classes: Class[];
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  loading?: boolean;
}

export function AssignmentForm({ classes, onSubmit, loading }: AssignmentFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classId, setClassId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [recipientStudentIds, setRecipientStudentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (title.length > 100) newErrors.title = 'Title must be 100 characters or less';
    if (!classId) newErrors.classId = 'Please select a class';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ title, description, classId, dueAt, recipientStudentIds });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Assignment title"
          maxLength={100}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Optional description"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Class *</label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 ${errors.classId ? 'border-red-500' : ''}`}
        >
          <option value="">Select a class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>{cls.name}</option>
          ))}
        </select>
        {errors.classId && <p className="text-red-500 text-xs mt-1">{errors.classId}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Assignment'}
        </button>
      </div>
    </form>
  );
}