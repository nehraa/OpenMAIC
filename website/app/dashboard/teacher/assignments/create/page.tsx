'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';

interface ClassOption {
  id: string;
  name: string;
  subject: string;
  batch: string;
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    dueAt: '',
    slideAssetVersionId: '',
    quizAssetVersionId: '',
  });

  useEffect(() => {
    async function fetchTeacherClass() {
      try {
        const response = await fetch('/api/dashboard/teacher', { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to load');
        const result = await response.json();
        if (result.success && result.data?.classOverview?.classId) {
          setClasses([{
            id: result.data.classOverview.classId,
            name: result.data.classOverview.className || 'My Class',
            subject: '',
            batch: '',
          }]);
          setFormData(prev => ({ ...prev, classId: result.data.classOverview.classId }));
        }
      } catch {
        // Silently handle — form works with manual class ID if dashboard API fails
      } finally {
        setLoading(false);
      }
    }
    fetchTeacherClass();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!formData.title.trim()) {
      setError('Title is required');
      setSubmitting(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      setSubmitting(false);
      return;
    }
    if (!formData.classId.trim()) {
      setError('Class is required');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          classId: formData.classId.trim(),
          dueAt: formData.dueAt || undefined,
          slideAssetVersionId: formData.slideAssetVersionId.trim() || undefined,
          quizAssetVersionId: formData.quizAssetVersionId.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || result.error?.code || 'Failed to create assignment');
      }

      router.push('/dashboard/teacher');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-base flex">
      {/* Sidebar - minimal for create page */}
      <aside className="w-64 bg-dark-card border-r border-dark-line p-4">
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-violet flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-white">A</span>
            </div>
            <span className="font-display font-bold text-xl text-white">AIDU</span>
          </Link>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard/teacher"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-dark-surface transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="font-medium">Dashboard</span>
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-coral/20 text-coral border border-coral/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-medium">New Lesson</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/teacher"
              className="text-slate-400 hover:text-white text-sm mb-2 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-display font-bold text-white">Create New Lesson</h1>
            <p className="text-slate-400 mt-1">Create and assign a new lesson to your class</p>
          </div>

          {/* Form Card */}
          <Card variant="card">
            <CardHeader>
              <CardTitle className="text-white">Lesson Details</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-coral/20 border border-coral/30 text-coral text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">
                    Lesson Title <span className="text-coral">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Introduction to Photosynthesis"
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white placeholder-slate-500 focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description <span className="text-coral">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe what students will learn in this lesson..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white placeholder-slate-500 focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors resize-none"
                  />
                </div>

                {/* Class Selection */}
                <div>
                  <label htmlFor="classId" className="block text-sm font-medium text-slate-300 mb-2">
                    Class <span className="text-coral">*</span>
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label htmlFor="dueAt" className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="dueAt"
                    name="dueAt"
                    value={formData.dueAt}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors"
                  />
                </div>

                {/* Slide Asset Version ID */}
                <div>
                  <label htmlFor="slideAssetVersionId" className="block text-sm font-medium text-slate-300 mb-2">
                    Slide Asset Version ID <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="slideAssetVersionId"
                    name="slideAssetVersionId"
                    value={formData.slideAssetVersionId}
                    onChange={handleChange}
                    placeholder="Asset version ID for slides"
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white placeholder-slate-500 focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors"
                  />
                </div>

                {/* Quiz Asset Version ID */}
                <div>
                  <label htmlFor="quizAssetVersionId" className="block text-sm font-medium text-slate-300 mb-2">
                    Quiz Asset Version ID <span className="text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="quizAssetVersionId"
                    name="quizAssetVersionId"
                    value={formData.quizAssetVersionId}
                    onChange={handleChange}
                    placeholder="Asset version ID for quiz"
                    className="w-full px-4 py-3 rounded-xl bg-dark-surface border border-dark-line text-white placeholder-slate-500 focus:outline-none focus:border-coral/50 focus:ring-1 focus:ring-coral/25 transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.push('/dashboard/teacher')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={submitting}
                    disabled={submitting || loading}
                  >
                    {submitting ? 'Creating...' : 'Create Lesson'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}