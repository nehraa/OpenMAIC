'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  GraduationCap,
  Clock,
  Trophy,
  BookOpen,
  LogIn,
  PlayCircle,
  HelpCircle,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

interface StudentSummary {
  studentId: string;
  studentName: string;
  studentPhone: string;
  className: string;
  classId: string;
  totalEvents: number;
  assignmentCompleted: number;
  assignmentStarted: number;
  quizAttempts: number;
  avgQuizScore: number | null;
  sessionJoined: number;
  logins: number;
  totalDurationMinutes: number;
  lastActiveAt: string | null;
  firstEventAt: string | null;
  events: Array<{
    id: string;
    eventType: string;
    relatedId: string | null;
    score: number | null;
    durationSeconds: number | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>;
  sparkline: Array<{ date: string; count: number }>;
}

const EVENT_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  login: { label: 'Logged in', icon: LogIn, color: 'bg-gray-100 text-gray-600' },
  session_joined: { label: 'Joined session', icon: PlayCircle, color: 'bg-purple-100 text-purple-600' },
  assignment_started: { label: 'Started assignment', icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
  assignment_completed: { label: 'Completed assignment', icon: Trophy, color: 'bg-green-100 text-green-600' },
  quiz_attempt: { label: 'Quiz attempt', icon: HelpCircle, color: 'bg-amber-100 text-amber-600' },
};

function getSessionId() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('session_id') || '';
}

export default function StudentProgressPage({ params }: { params: Promise<{ studentId: string }> }) {
  const [studentId, setStudentId] = useState<string>('');
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setStudentId(p.studentId));
  }, [params]);

  useEffect(() => {
    if (!studentId) return;

    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/teacher/api/teacher/progress/student/${studentId}?days=30`, {
          headers: { 'x-session-id': getSessionId() },
        });
        if (!res.ok) {
          setError('Student not found or access denied');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setSummary(data.summary);
      } catch {
        setError('Failed to load student progress');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [studentId]);

  const formatDate = useCallback((iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatRelative = useCallback((iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
          <div className="h-48 bg-gray-200 rounded mt-6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Link href="/teacher/progress" className="text-primary hover:underline flex items-center gap-1 text-sm mb-6">
          <ArrowLeft size={14} /> Back to Progress
        </Link>
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    {
      label: 'Assignments Done',
      value: summary.assignmentCompleted,
      sub: `${summary.assignmentStarted} started`,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Quiz Attempts',
      value: summary.quizAttempts,
      sub: summary.avgQuizScore != null ? `Avg ${summary.avgQuizScore}%` : 'No scores',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Sessions Joined',
      value: summary.sessionJoined,
      sub: `${summary.logins} logins`,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Time on Platform',
      value: `${summary.totalDurationMinutes}m`,
      sub: 'Last 30 days',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  // Sparkline: show last 14 of 30 days for readability
  const sparkSlice = summary.sparkline.slice(-14);
  const maxSparkCount = Math.max(...sparkSlice.map((s) => s.count), 1);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back link */}
      <Link
        href="/teacher/progress"
        className="text-primary hover:underline flex items-center gap-1 text-sm mb-6"
      >
        <ArrowLeft size={14} /> Back to Class Progress
      </Link>

      {/* Student header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="text-primary" size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{summary.studentName}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Phone size={13} /> {summary.studentPhone || 'No phone'}
            </span>
            <span className="flex items-center gap-1">
              <GraduationCap size={13} /> {summary.className}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={13} /> Last active: {formatRelative(summary.lastActiveAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Activity Sparkline */}
      <div className="bg-white border rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={15} className="text-primary" />
          Daily Activity (last 14 days)
        </h2>
        {sparkSlice.length > 0 && sparkSlice.some((s) => s.count > 0) ? (
          <div className="h-[120px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparkSlice} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} events`, 'Activity']}
                  labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {sparkSlice.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 0 ? '#6366f1' : '#e5e7eb'}
                      fillOpacity={entry.count / maxSparkCount > 0.5 ? 1 : 0.4 + (entry.count / maxSparkCount) * 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm">
            No activity data yet
          </div>
        )}
      </div>

      {/* Event Timeline */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700">Event Timeline</h2>
          <span className="text-xs text-gray-400">{summary.totalEvents} events (last 30 days)</span>
        </div>

        {summary.events.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No events recorded for this student yet.
          </div>
        ) : (
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {summary.events.map((event) => {
              const config = EVENT_CONFIG[event.eventType] ?? {
                label: event.eventType,
                icon: Activity,
                color: 'bg-gray-100 text-gray-600',
              };
              const Icon = config.icon;

              return (
                <div key={event.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{config.label}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                      <span>{formatDate(event.createdAt)}</span>
                      {event.score != null && (
                        <span className={event.score >= 60 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          Score: {event.score}%
                        </span>
                      )}
                      {event.durationSeconds != null && event.durationSeconds > 0 && (
                        <span>{Math.round(event.durationSeconds / 60)}m</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-300 shrink-0 mt-1">
                    {formatRelative(event.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty state guidance */}
      {summary.totalEvents === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>No events yet.</strong> As the student interacts with assignments, quizzes, and live sessions, their activity will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
