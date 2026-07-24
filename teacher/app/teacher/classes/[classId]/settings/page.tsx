'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';

interface ClassRecord {
  id: string;
  name: string;
  subject: string;
  batch: string;
  join_code: string;
}

export default function ClassSettingsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const router = useRouter();
  const { classId } = usePromise(params);

  const [cls, setCls] = useState<ClassRecord | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [batch, setBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/teacher/api/teacher/classes/${classId}`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Class not found');
        const data = (await res.json()) as { class: ClassRecord };
        if (cancelled) return;
        setCls(data.class);
        setName(data.class.name ?? '');
        setSubject(data.class.subject ?? '');
        setBatch(data.class.batch ?? '');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load class');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/teacher/api/teacher/classes/${classId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, subject, batch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save class');
      }
      setSuccess('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save class');
    } finally {
      setSaving(false);
    }
  };

  const removeClass = async () => {
    if (!classId) return;
    if (!confirm('Delete this class? Students will lose access to its assignments.')) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/teacher/api/teacher/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete class');
      }
      router.push('/teacher/classes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete class');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!cls) {
    return (
      <div className="p-8">
        <Link href="/teacher/classes" className="text-primary hover:underline mb-4 inline-flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Back to Classes
        </Link>
        <p className="text-center text-muted-foreground py-12">
          {error ?? 'Class not found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/teacher/classes/${classId}`}
        className="text-primary hover:underline mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={14} /> Back to class
      </Link>

      <h1 className="text-2xl font-bold mb-1">Class Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Join code:{' '}
        <code className="rounded bg-muted px-2 py-0.5 font-mono">{cls.join_code}</code>
      </p>

      <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-4">
        <label className="block text-sm">
          <span className="font-medium">Class name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Subject</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Batch</span>
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={removeClass}
            disabled={deleting}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete class'}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
