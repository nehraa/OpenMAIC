import { getDb } from '../db';

export interface UsageEventInput {
  tenantId: string;
  actorUserId: string;
  actorRole: 'teacher' | 'student_classroom' | 'student_b2c';
  provider: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  costUsd: number;
  classId?: string;
  sessionId?: string;
  feature?: string;
  requestId?: string;
}

/**
 * Record a token usage event.
 * Call this after any LLM call (or mock LLM call) to track usage for analytics.
 * Non-throwing: logs errors but does not fail the caller.
 */
export async function recordUsage(event: UsageEventInput): Promise<void> {
  try {
    const db = getDb();
    await db.query(
      `INSERT INTO llm_usage_events (
        tenant_id, actor_user_id, actor_role, provider, model, endpoint,
        input_tokens, output_tokens, cached_tokens, reasoning_tokens,
        cost_usd, class_id, session_id, feature, request_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        event.tenantId,
        event.actorUserId,
        event.actorRole,
        event.provider,
        event.model,
        event.endpoint,
        event.inputTokens,
        event.outputTokens,
        event.cachedTokens ?? 0,
        event.reasoningTokens ?? 0,
        event.costUsd,
        event.classId ?? null,
        event.sessionId ?? null,
        event.feature ?? null,
        event.requestId ?? null,
      ]
    );
  } catch (err) {
    // Non-fatal: don't break the caller if usage recording fails
    console.error('[recordUsage] Failed to record usage event:', err);
  }
}

/**
 * Estimate cost from token counts based on model pricing.
 * Falls back to $0 if model is unknown.
 *
 * Pricing is per-token (divide per-1K rates by 1000).
 */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenRouter / common models (per-token rates)
  'openai/gpt-4o': { input: 0.0000025, output: 0.00001 },
  'openai/gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
  'openai/gpt-4.1': { input: 0.000002, output: 0.000008 },
  'openai/gpt-4.1-mini': { input: 0.0000004, output: 0.0000016 },
  'openai/gpt-4.1-nano': { input: 0.0000001, output: 0.0000004 },
  'anthropic/claude-sonnet-4-20250514': { input: 0.000003, output: 0.000015 },
  'anthropic/claude-haiku-4-20250514': { input: 0.0000008, output: 0.000004 },
  'google/gemini-2.5-flash': { input: 0.00000015, output: 0.0000006 },
  'google/gemini-2.5-pro': { input: 0.00000125, output: 0.00001 },
  'deepseek/deepseek-chat': { input: 0.00000027, output: 0.0000011 },
  'deepseek/deepseek-reasoner': { input: 0.00000055, output: 0.0000022 },
  'qwen/qwen-plus': { input: 0.0000004, output: 0.0000012 },
  'qwen/qwen-max': { input: 0.000002, output: 0.000006 },
  'minimax/minimax-m2.7': { input: 0.0000004, output: 0.0000012 },
};

export function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return inputTokens * pricing.input + outputTokens * pricing.output;
}
