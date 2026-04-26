'use client';

import { useEffect, useState } from 'react';

interface DailyUsage {
  date: string;
  total_tokens: number;
  total_cost: number;
  by_model: Record<string, number>;
  by_role: Record<string, number>;
}

interface WeeklyUsage {
  week: string;
  total_tokens: number;
  total_cost: number;
  daily_breakdown: { date: string; tokens: number; cost: number }[];
  by_model: Record<string, number>;
}

export default function UsageDashboard() {
  const [daily, setDaily] = useState<DailyUsage | null>(null);
  const [weekly, setWeekly] = useState<WeeklyUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    async function fetchUsage() {
      const today = new Date().toISOString().split('T')[0];
      const week = getISOWeek(new Date());

      const [dailyRes, weeklyRes] = await Promise.all([
        fetch(`/api/teacher/usage/daily?date=${today}`),
        fetch(`/api/teacher/usage/weekly?week=${week}`)
      ]);

      if (dailyRes.ok) setDaily(await dailyRes.json());
      if (weeklyRes.ok) setWeekly(await weeklyRes.json());
      setLoading(false);
    }
    fetchUsage();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Token Usage</h1>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('daily')}
          className={`px-4 py-2 rounded ${view === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Daily
        </button>
        <button
          onClick={() => setView('weekly')}
          className={`px-4 py-2 rounded ${view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Weekly
        </button>
      </div>

      {view === 'daily' && daily && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Tokens</div>
              <div className="text-3xl font-bold">{daily.total_tokens.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Cost</div>
              <div className="text-3xl font-bold">${daily.total_cost.toFixed(4)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Date</div>
              <div className="text-3xl font-bold">{daily.date}</div>
            </div>
          </div>

          {/* By Model */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">By Model</h2>
            <div className="space-y-2">
              {Object.entries(daily.by_model).map(([model, tokens]) => (
                <div key={model} className="flex justify-between">
                  <span>{model}</span>
                  <span className="font-mono">{tokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Role */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">By Role</h2>
            <div className="space-y-2">
              {Object.entries(daily.by_role).map(([role, tokens]) => (
                <div key={role} className="flex justify-between">
                  <span>{role}</span>
                  <span className="font-mono">{tokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'weekly' && weekly && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Tokens</div>
              <div className="text-3xl font-bold">{weekly.total_tokens.toLocaleString()}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Total Cost</div>
              <div className="text-3xl font-bold">${weekly.total_cost.toFixed(4)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-500">Week</div>
              <div className="text-3xl font-bold">{weekly.week}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Daily Breakdown</h2>
            <div className="space-y-2">
              {weekly.daily_breakdown.map((day) => (
                <div key={day.date} className="flex justify-between">
                  <span>{day.date}</span>
                  <span className="font-mono">{day.tokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Model */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">By Model</h2>
            <div className="space-y-2">
              {Object.entries(weekly.by_model).map(([model, tokens]) => (
                <div key={model} className="flex justify-between">
                  <span>{model}</span>
                  <span className="font-mono">{tokens.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`;
}