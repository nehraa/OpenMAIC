import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

type TokenUsage = {
  id: string;
  timestamp: string;
  actor_user_id: string;
  actor_role: string;
  provider: string;
  model: string;
  endpoint: string;
  input_tokens: number;
  output_tokens: number;
  cached_tokens: number;
  reasoning_tokens: number;
  cost_usd: number;
  class_id?: string;
  session_id?: string;
  feature?: string;
};

function getStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case 'week':
      now.setDate(now.getDate() - 7);
      break;
    case 'month':
      now.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      now.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      now.setFullYear(now.getFullYear() - 1);
      break;
    default:
      now.setMonth(now.getMonth() - 1);
  }
  return now.toISOString().split('T')[0];
}

function aggregateByProvider(records: TokenUsage[]) {
  const providerMap = new Map<string, number>();
  for (const record of records) {
    const current = providerMap.get(record.provider) || 0;
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    providerMap.set(record.provider, current + totalTokens);
  }
  return Array.from(providerMap.entries()).map(([name, value]) => ({ name, value }));
}

function aggregateByClass(records: TokenUsage[], classMap: Map<string, string>) {
  const classAggMap = new Map<string, { tokens: number; cost: number }>();
  for (const record of records) {
    const classId = record.class_id || 'uncategorized';
    const current = classAggMap.get(classId) || { tokens: 0, cost: 0 };
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    classAggMap.set(classId, {
      tokens: current.tokens + totalTokens,
      cost: current.cost + record.cost_usd,
    });
  }
  return Array.from(classAggMap.entries()).map(([classId, data]) => ({
    classId,
    name: classMap.get(classId) || (classId === 'uncategorized' ? 'Uncategorized' : classId),
    tokens: data.tokens,
    cost: data.cost,
  }));
}

function aggregateByFeature(records: TokenUsage[]) {
  const featureMap = new Map<string, { tokens: number; cost: number }>();
  for (const record of records) {
    // Use feature column if available, otherwise derive from endpoint
    const feature = record.feature || deriveFeatureFromEndpoint(record.endpoint);
    const current = featureMap.get(feature) || { tokens: 0, cost: 0 };
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    featureMap.set(feature, {
      tokens: current.tokens + totalTokens,
      cost: current.cost + record.cost_usd,
    });
  }
  return Array.from(featureMap.entries()).map(([feature, data]) => ({
    feature: formatFeatureName(feature),
    tokens: data.tokens,
    cost: data.cost,
  }));
}

function deriveFeatureFromEndpoint(endpoint: string): string {
  if (!endpoint) return 'other';
  if (endpoint.includes('/library/generate')) {
    return 'content_generation';
  }
  if (endpoint.includes('/quizzes/generate')) {
    return 'quiz_generation';
  }
  if (endpoint.includes('/sessions') || endpoint.includes('/live-sessions')) {
    return 'classroom';
  }
  if (endpoint.includes('/pbl/chat')) {
    return 'pbl_chat';
  }
  if (endpoint.includes('/quiz-grade')) {
    return 'quiz_grade';
  }
  if (endpoint.includes('/qa') || endpoint.includes('/question')) {
    return 'qa';
  }
  return 'other';
}

function formatFeatureName(feature: string): string {
  const names: Record<string, string> = {
    slide_generation: 'Slide Generation',
    quiz_generation: 'Quiz Generation',
    content_generation: 'Content Generation',
    classroom: 'Classroom',
    pbl_chat: 'PBL Chat',
    quiz_grade: 'Quiz Grading',
    qa: 'Q&A',
    other: 'Other',
  };
  return names[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function calculateSummaryStats(records: TokenUsage[], startDate: string) {
  const totalTokens = records.reduce((sum, r) => {
    return sum + r.input_tokens + r.output_tokens + r.cached_tokens + r.reasoning_tokens;
  }, 0);

  const totalCost = records.reduce((sum, r) => sum + r.cost_usd, 0);
  const uniqueUsers = new Set(records.map(r => r.actor_user_id));
  const uniqueSessions = new Set(records.filter(r => r.session_id).map(r => r.session_id));

  // Calculate period-over-period change
  const periodLengthMs = Date.now() - new Date(startDate).getTime();
  const prevPeriodStart = new Date(new Date(startDate).getTime() - periodLengthMs).toISOString().split('T')[0];

  const prevRecords = records.filter(r => r.timestamp < startDate);
  const prevTokens = prevRecords.reduce((sum, r) => {
    return sum + r.input_tokens + r.output_tokens + r.cached_tokens + r.reasoning_tokens;
  }, 0);
  const prevCost = prevRecords.reduce((sum, r) => sum + r.cost_usd, 0);
  const prevUsers = new Set(prevRecords.map(r => r.actor_user_id));
  const prevSessions = new Set(prevRecords.filter(r => r.session_id).map(r => r.session_id));

  const pctChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    totalTokens,
    totalCost: Math.round(totalCost * 1000000) / 1000000,
    totalSessions: uniqueSessions.size,
    activeStudents: uniqueUsers.size,
    tokenChange: pctChange(totalTokens, prevTokens),
    costChange: pctChange(totalCost, prevCost),
    sessionChange: pctChange(uniqueSessions.size, prevSessions.size),
    studentChange: pctChange(uniqueUsers.size, prevUsers.size),
  };
}

// GET /api/analytics/usage?range=month
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const dateRange = searchParams.get('range') || 'month';
  const startDate = getStartDate(dateRange);

  // Get teacher's classes for filtering
  const teacherClassesResult = await db.query(
    'SELECT id, name FROM classes WHERE teacher_id = $1',
    [ctx.user.id]
  );
  const classMap = new Map(teacherClassesResult.rows.map((c: { id: string; name: string }) => [c.id, c.name]));
  const classIds = Array.from(classMap.keys());

  // Include teacher's own usage + all student usage in teacher's classes
  const allUserIds = [ctx.user.id];
  if (classIds.length > 0) {
    const membershipResult = await db.query(
      'SELECT DISTINCT student_id FROM class_memberships WHERE class_id = ANY($1)',
      [classIds]
    );
    for (const row of membershipResult.rows) {
      allUserIds.push(row.student_id);
    }
  }

  // Build parameterized query
  const userPlaceholders = allUserIds.map((_, i) => `$${i + 2}`).join(',');
  const params: (string | number)[] = [startDate, ...allUserIds];

  const usageResult = await db.query(`
    SELECT
      l.id,
      l.timestamp,
      l.actor_user_id,
      l.actor_role,
      l.provider,
      l.model,
      l.endpoint,
      l.input_tokens,
      l.output_tokens,
      l.cached_tokens,
      l.reasoning_tokens,
      l.cost_usd,
      l.class_id,
      l.session_id,
      l.feature
    FROM llm_usage_events l
    WHERE l.timestamp >= $1
      AND l.actor_user_id IN (${userPlaceholders})
    ORDER BY l.timestamp DESC
    LIMIT 5000
  `, params);

  const records = usageResult.rows as TokenUsage[];

  const byProvider = aggregateByProvider(records);
  const byClass = aggregateByClass(records, classMap);
  const byFeature = aggregateByFeature(records);
  const summary = calculateSummaryStats(records, startDate);

  // Build token timeline (grouped by day)
  const timelineMap = new Map<string, number>();
  for (const record of records) {
    const day = record.timestamp.split('T')[0];
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    timelineMap.set(day, (timelineMap.get(day) || 0) + totalTokens);
  }

  const tokenTimeline = Array.from(timelineMap.entries())
    .map(([date, tokens]) => ({ date, tokens }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    summary,
    byProvider,
    byClass,
    byFeature,
    tokenTimeline,
  });
});
