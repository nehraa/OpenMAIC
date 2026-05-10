import { db } from '@/lib/db'
import { eq, and, sql } from 'drizzle-orm'

export type QuotaType = 'questions' | 'images' | 'videos'

export interface QuotaCheck {
  allowed: boolean
  used: number
  limit: number
  remaining: number
}

export async function checkQuota(userId: string, quotaType: QuotaType): Promise<QuotaCheck> {
  const quota = await db.query.userQuotas?.findFirst({
    where: eq(sql`user_id`, userId),
  })

  if (!quota) {
    return { allowed: true, used: 0, limit: 50, remaining: 50 }
  }

  const used = getUsedCount(quota, quotaType)
  const limit = getLimit(quota, quotaType)

  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  }
}

export async function consumeQuota(
  userId: string,
  quotaType: QuotaType,
  amount: number = 1
): Promise<{ success: boolean; remaining: number }> {
  const check = await checkQuota(userId, quotaType)

  if (!check.allowed) {
    throw new QuotaExceededError(quotaType, check.remaining)
  }

  const fieldMap: Record<QuotaType, string> = {
    questions: 'questions_used',
    images: 'images_used',
    videos: 'videos_used',
  }

  const field = fieldMap[quotaType]

  try {
    await db.query.userQuotas?.update({
      where: eq(sql`user_id`, userId),
      set: {
        [field]: sql`${field} + ${amount}`,
        updatedAt: new Date(),
      },
    })
  } catch {
    // Quota table might not exist yet - skip
  }

  return { success: true, remaining: check.remaining - amount }
}

export async function getQuotaStatus(userId: string, quotaType: QuotaType): Promise<QuotaCheck> {
  return checkQuota(userId, quotaType)
}

export class QuotaExceededError extends Error {
  constructor(
    public quotaType: QuotaType,
    public remaining: number
  ) {
    super(`Quota exceeded for ${quotaType}. ${remaining} remaining.`)
    this.name = 'QuotaExceededError'
  }
}

function getLimit(quota: any, quotaType: QuotaType): number {
  const limits: Record<QuotaType, string> = {
    questions: 'questions_limit',
    images: 'images_limit',
    videos: 'videos_limit',
  }
  return quota[limits[quotaType]] || 50
}

function getUsedCount(quota: any, quotaType: QuotaType): number {
  const used: Record<QuotaType, string> = {
    questions: 'questions_used',
    images: 'images_used',
    videos: 'videos_used',
  }
  return quota[used[quotaType]] || 0
}