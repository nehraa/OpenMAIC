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
  const teacherClassesResult = await db.query(`
    SELECT id FROM classes WHERE teacher_id = $1
  `, [ctx.user.id]);

  const classIds = teacherClassesResult.rows.map((c: { id: string }) => c.id);

  // Build parameterized query
  const params: (string | number)[] = [date, ctx.user.id, ...classIds];
  const classIdParams = classIds.length > 0 ? classIds.map((_, i) => `$${i + 3}`).join(',') : "'__no_classes__'";

  const userCondition = `
    (
      actor_user_id = $2
      OR actor_user_id IN (
        SELECT student_id FROM class_memberships WHERE class_id IN (${classIdParams})
      )
    )
  `;

  // Aggregate totals
  const totalsResult = await db.query(`
    SELECT
      COALESCE(SUM(input_tokens), 0) as total_input_tokens,
      COALESCE(SUM(output_tokens), 0) as total_output_tokens,
      COALESCE(SUM(cached_tokens), 0) as total_cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as total_reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as total_cost
    FROM llm_usage_events
    WHERE date(timestamp) = $1
      AND ${userCondition}
  `, params);

  const totals = totalsResult.rows[0] as {
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
  const byModelResult = await db.query(`
    SELECT
      model,
      provider,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as cost
    FROM llm_usage_events
    WHERE date(timestamp) = $1
      AND ${userCondition}
    GROUP BY model, provider
  `, params);

  const by_model: Record<string, {
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }> = {};

  for (const row of byModelResult.rows) {
    by_model[row.model] = {
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cached_tokens: row.cached_tokens,
      reasoning_tokens: row.reasoning_tokens,
      cost: row.cost,
    };
  }

  // Get breakdown by role
  const byRoleResult = await db.query(`
    SELECT
      actor_role,
      COALESCE(SUM(input_tokens), 0) as input_tokens,
      COALESCE(SUM(output_tokens), 0) as output_tokens,
      COALESCE(SUM(cached_tokens), 0) as cached_tokens,
      COALESCE(SUM(reasoning_tokens), 0) as reasoning_tokens,
      COALESCE(SUM(cost_usd), 0) as cost
    FROM llm_usage_events
    WHERE date(timestamp) = $1
      AND ${userCondition}
    GROUP BY actor_role
  `, params);

  const by_role: Record<string, {
    input_tokens: number;
    output_tokens: number;
    cached_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }> = {};

  for (const row of byRoleResult.rows) {
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
