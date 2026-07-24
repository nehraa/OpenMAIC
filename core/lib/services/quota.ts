export type QuotaType = 'questions' | 'images' | 'videos'

export interface QuotaCheck {
  allowed: boolean
  used: number
  limit: number
  remaining: number
}

export async function checkQuota(userId: string, quotaType: QuotaType): Promise<QuotaCheck> {
  // Core's self-hosted deployment has no user DB. Keep quota enforcement at
  // the authenticated portal/teacher layer until a shared quota store exists.
  void userId
  void quotaType
  return { allowed: true, used: 0, limit: 50, remaining: 50 }
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

