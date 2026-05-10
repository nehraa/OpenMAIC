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

  return Array.from(providerMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));
}

function aggregateByClass(records: TokenUsage[]) {
  const classMap = new Map<string, { tokens: number; cost: number; name?: string }>();

  for (const record of records) {
    const classId = record.class_id || 'unknown';
    const current = classMap.get(classId) || { tokens: 0, cost: 0 };
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    classMap.set(classId, {
      tokens: current.tokens + totalTokens,
      cost: current.cost + record.cost_usd,
    });
  }

  return Array.from(classMap.entries()).map(([classId, data]) => ({
    classId,
    name: data.name || classId,
    tokens: data.tokens,
    cost: data.cost,
  }));
}

function aggregateByFeature(records: TokenUsage[]) {
  const featureMap = new Map<string, { tokens: number; cost: number }>();

  for (const record of records) {
    const endpoint = record.endpoint || 'unknown';
    const current = featureMap.get(endpoint) || { tokens: 0, cost: 0 };
    const totalTokens =
      record.input_tokens +
      record.output_tokens +
      record.cached_tokens +
      record.reasoning_tokens;
    featureMap.set(endpoint, {
      tokens: current.tokens + totalTokens,
      cost: current.cost + record.cost_usd,
    });
  }

  return Array.from(featureMap.entries()).map(([feature, data]) => ({
    feature,
    tokens: data.tokens,
    cost: data.cost,
  }));
}

function calculateSummaryStats(records: TokenUsage[]) {
  const totalTokens = records.reduce((sum, r) => {
    return sum + r.input_tokens + r.output_tokens + r.cached_tokens + r.reasoning_tokens;
  }, 0);

  const totalCost = records.reduce((sum, r) => sum + r.cost_usd, 0);

  const uniqueUsers = new Set(records.map((r) => r.actor_user_id));
  const uniqueSessions = new Set(records.filter((r) => r.session_id).map((r) => r.session_id));

  return {
    totalTokens,
    totalCost,
    totalSessions: uniqueSessions.size || 0,
    activeStudents: uniqueUsers.size || 0,
    tokenChange: 0,
    costChange: 0,
    sessionChange: 0,
    studentChange: 0,
  };
}

// GET /api/analytics/usage?range=month
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const dateRange = searchParams.get('range') || 'month';

  const startDate = getStartDate(dateRange);

  // Get all class IDs for this teacher to include student usage
  const teacherClassesResult = await db.query(
    'SELECT id, name FROM classes WHERE teacher_id = $1',
    [ctx.user.id]
  );

  const classMap = new Map(teacherClassesResult.rows.map((c: { id: string; name: string }) => [c.id, c.name]));
  const classIds = Array.from(classMap.keys());

  if (classIds.length === 0) {
    return NextResponse.json({
      summary: {
        totalTokens: 0,
        totalCost: 0,
        totalSessions: 0,
        activeStudents: 0,
        tokenChange: 0,
        costChange: 0,
        sessionChange: 0,
        studentChange: 0,
      },
      byProvider: [],
      byClass: [],
      byFeature: [],
      tokenTimeline: [],
    });
  }

  const classIdParams =
    classIds.length > 0 ? classIds.map((_, i) => `$${i + 3}`).join(',') : "'__no_classes__'";

  const userCondition = `
    (
      actor_user_id = $2
      OR actor_user_id IN (
        SELECT student_id FROM class_memberships WHERE class_id IN (${classIdParams})
      )
    )
  `;

  const params: (string | number)[] = [startDate, ctx.user.id, ...classIds];

  // Get token usage records
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
      l.session_id
    FROM llm_usage_events l
    WHERE l.timestamp >= $1
      AND ${userCondition}
    ORDER BY l.timestamp DESC
    LIMIT 1000
  `, params);

  const records = usageResult.rows as TokenUsage[];

  // Enrich class data with names
  for (const record of records) {
    if (record.class_id && classMap.has(record.class_id)) {
      const classData = classMap.get(record.class_id)!;
      record.class_id = classData;
    }
  }

  // Aggregate by provider
  const byProvider = aggregateByProvider(records);

  // Aggregate by class
  const byClass = aggregateByClass(records);

  // Aggregate by feature
  const byFeature = aggregateByFeature(records);

  // Calculate summary stats
  const summary = calculateSummaryStats(records);

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