import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/usage/weekly?week=2026-W17
// Returns: { week, total_tokens, total_cost, daily_breakdown: [...], by_model: {...} }
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const weekParam = searchParams.get('week') || getCurrentISOWeek();

  // Parse week format (2026-W17) - ISO week starting Monday
  const weekMatch = weekParam.match(/^(\d{4})-W(\d{2})$/);
  if (!weekMatch) {
    return NextResponse.json({ error: 'Invalid week format. Use YYYY-Www (e.g., 2026-W17)' }, { status: 400 });
  }

  const year = parseInt(weekMatch[1], 10);
  const week = parseInt(weekMatch[2], 10);

  if (week < 1 || week > 53) {
    return NextResponse.json({ error: 'Week must be between 01 and 53' }, { status: 400 });
  }

  // Calculate the Monday and Sunday of the ISO week
  // ISO week 1 is the week containing the first Thursday of the year
  const jan4 = new Date(year, 0, 4); // Jan 4 is always in week 1
  const jan4Day = jan4.getDay();
  // Monday is day 1 (ISO day 1)
  const daysToMonday = jan4Day <= 4 ? jan4Day - 1 : 7 - jan4Day + 1;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - daysToMonday);

  const monday = new Date(mondayOfWeek1);
  monday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  // Get all class IDs for this teacher to include student usage
  const teacherClasses = db.prepare(`
    SELECT id FROM classes WHERE teacher_id = ?
  `).all(ctx.user.id) as { id: string }[];

  const classIds = teacherClasses.map(c => c.id);
  const teacherId = ctx.user.id;

  const placeholders = classIds.length > 0
    ? classIds.map(() => '?').join(',')
    : "'__no_classes__'";

  const userCondition = `
    (
      actor_user_id = ?
      OR actor_user_id IN (
        SELECT student_id FROM class_memberships WHERE class_id IN (${placeholders})
      )
    )
  `;

  // Aggregate totals for the week
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(cached_tokens), 0) as total_cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as total_reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost
    FROM llm_usage_events
    WHERE date(timestamp) >= ?
      AND date(timestamp) <= ?
      AND ${userCondition}
  `).get(mondayStr, sundayStr, teacherId, ...classIds) as {
    total_input_tokens: number;
    total_output_tokens: number;
    total_cached_tokens: number;
    total_reasoning_tokens: number;
    total_cost: number;
  };

  const total_tokens =
    totals.total_input_tokens +
    totals.total_output_tokens +
    totals.total_cached_tokens +
    totals.total_reasoning_tokens;

  // Get daily breakdown
  const dailyRows = db.prepare(`
    SELECT
      date(timestamp) as day,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as cost
    FROM llm_usage_events
    WHERE date(timestamp) >= ?
      AND date(timestamp) <= ?
      AND ${userCondition}
    GROUP BY date(timestamp)
    ORDER BY date(timestamp) ASC
  `).all(mondayStr, sundayStr, teacherId, ...classIds) as Array<{
    day: string;
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }>;

  const daily_breakdown = dailyRows.map(row => ({
    date: row.day,
    total_tokens:
      row.input_tokens +
      row.output_tokens +
      row.cached_tokens +
      row.reasoning_tokens,
    cost: row.cost,
  }));

  // Get breakdown by model
  const byModelRows = db.prepare(`
    SELECT
      model,
      provider,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as cost
    FROM llm_usage_events
    WHERE date(timestamp) >= ?
      AND date(timestamp) <= ?
      AND ${userCondition}
    GROUP BY model, provider
  `).all(mondayStr, sundayStr, teacherId, ...classIds) as Array<{
    model: string;
    provider: string;
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }>;

  const by_model: Record<string, {
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }> = {};

  for (const row of byModelRows) {
    by_model[row.model] = {
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cached_tokens: row.cached_tokens,
      reasoning_tokens: row.reasoning_tokens,
      cost: row.cost,
    };
  }

  return NextResponse.json({
    week: weekParam,
    total_tokens,
    total_cost: totals.total_cost,
    daily_breakdown,
    by_model,
  });
});

function getCurrentISOWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay();
  const daysToMonday = jan4Day <= 4 ? jan4Day - 1 : 7 - jan4Day + 1;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - daysToMonday);

  const diffMs = now.getTime() - mondayOfWeek1.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const weekNumber = Math.floor(diffDays / 7) + 1;

  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}