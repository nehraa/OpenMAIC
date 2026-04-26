import { NextRequest, NextResponse } from 'next/server';
import { withRole } from '@/middleware';
import { getDb } from '@/lib/db';
import type { AuthContext } from '@/middleware/auth';

// GET /api/teacher/usage/daily?date=2026-04-26
// Returns: { date, total_tokens, total_cost, by_model: {...}, by_role: {...} }
export const GET = withRole(['teacher'], async (req: NextRequest, ctx: AuthContext) => {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }

  // Get all class IDs for this teacher to include student usage
  const teacherClasses = db.prepare(`
    SELECT id FROM classes WHERE teacher_id = ?
  `).all(ctx.user.id) as { id: string }[];

  const classIds = teacherClasses.map(c => c.id);
  const teacherId = ctx.user.id;

  // Build query that includes teacher and students from teacher's classes
  // actor_user_id matches teacher OR actor is a student in one of teacher's classes
  const placeholders = classIds.length > 0
    ? classIds.map(() => '?').join(',')
    : "'__no_classes__'";

  // Aggregate totals
  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(cached_tokens), 0) as total_cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as total_reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost
    FROM llm_usage_events
    WHERE date(timestamp) = ?
      AND (
        actor_user_id = ?
        OR actor_user_id IN (
          SELECT student_id FROM class_memberships WHERE class_id IN (${placeholders})
        )
      )
  `).get(date, teacherId, ...classIds) as {
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
    WHERE date(timestamp) = ?
      AND (
        actor_user_id = ?
        OR actor_user_id IN (
          SELECT student_id FROM class_memberships WHERE class_id IN (${placeholders})
        )
      )
    GROUP BY model, provider
  `).all(date, teacherId, ...classIds) as Array<{
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

  // Get breakdown by role
  const byRoleRows = db.prepare(`
    SELECT
      actor_role,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as cost
    FROM llm_usage_events
    WHERE date(timestamp) = ?
      AND (
        actor_user_id = ?
        OR actor_user_id IN (
          SELECT student_id FROM class_memberships WHERE class_id IN (${placeholders})
        )
      )
    GROUP BY actor_role
  `).all(date, teacherId, ...classIds) as Array<{
    actor_role: string;
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }>;

  const by_role: Record<string, {
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }> = {};

  for (const row of byRoleRows) {
    by_role[row.actor_role] = {
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cached_tokens: row.cached_tokens,
      reasoning_tokens: row.reasoning_tokens,
      cost: row.cost,
    };
  }

  return NextResponse.json({
    date,
    total_tokens,
    total_cost: totals.total_cost,
    by_model,
    by_role,
  });
});