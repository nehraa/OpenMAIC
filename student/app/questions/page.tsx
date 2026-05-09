'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  class_name: string;
  content: string;
  status: 'pending' | 'answered' | 'closed';
  created_at: string;
  answered_at: string | null;
}

export default function StudentQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = () => {
    setLoading(true);
    fetch('/student/api/student/questions')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch questions');
        return r.json();
      })
      .then(data => {
        setQuestions(data.questions || []);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/student/api/student/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) throw new Error('Failed to submit question');

      setTitle('');
      setContent('');
      setShowAskForm(false);
      fetchQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: Question['status']) => {
    switch (status) {
      case 'answered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'closed':
        return <CheckCircle className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: Question['status']) => {
    switch (status) {
      case 'answered':
        return <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Answered</span>;
      case 'closed':
        return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Closed</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquare size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Ask a Question</h1>
                <p className="text-sm text-muted-foreground">Get help from your teacher</p>
              </div>
            </div>
            <button
              onClick={() => setShowAskForm(!showAskForm)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Ask Question
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {showAskForm && (
          <form onSubmit={handleSubmitQuestion} className="bg-white rounded-xl border p-6 mb-8">
            <h2 className="font-semibold mb-4">Ask a New Question</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Question Title</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Help with quadratic equations"
                  required
                  className="w-full h-12 px-4 rounded-xl border bg-background"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-1">Details</label>
                <textarea
                  id="content"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Describe your question in detail..."
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border bg-background resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Question'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAskForm(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4 mb-4" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">No Questions Yet</h2>
            <p className="text-muted-foreground">
              You haven&apos;t asked any questions. Click &quot;Ask Question&quot; to get help from your teacher.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {questions.map(question => (
              <div key={question.id} className="bg-white rounded-xl border p-6 hover:border-primary/40 transition-all">
                <div className="flex items-start gap-4">
                  {getStatusIcon(question.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{question.title}</h3>
                      {getStatusBadge(question.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{question.class_name}</p>
                    <p className="text-muted-foreground mb-3">{question.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Asked: {new Date(question.created_at).toLocaleDateString()}
                      </span>
                      {question.answered_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Answered: {new Date(question.answered_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}