import crypto from 'crypto'

export function generateSessionId(): string {
  return `sess_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}
