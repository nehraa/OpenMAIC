import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getDb } from '@/lib/db'

/**
 * POST /api/sessions/[sessionId]/start — Transition session from draft -> live
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()

    // Verify session exists
    const check = await db.query(
      'SELECT * FROM classroom_sessions WHERE id = $1',
      [params.sessionId]
    )

    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = check.rows[0]

    // Accept 'draft' (newly-created) or 'waiting' (legacy) as pre-live states
    if (session.status !== 'draft' && session.status !== 'waiting') {
      return NextResponse.json(
        { error: `Cannot start session with status '${session.status}'` },
        { status: 400 }
      )
    }

    // Transition to live
    await db.query(
      `UPDATE classroom_sessions SET status = 'live', started_at = NOW() WHERE id = $1`,
      [params.sessionId]
    )

    return NextResponse.json({ ok: true, status: 'live' })
  } catch (error) {
    console.error('Failed to start session:', error)
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 })
  }
}

/**
 * GET /api/sessions/[sessionId] — Get single session with participants
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const db = getDb()

    const sessionRes = await db.query(
      'SELECT * FROM classroom_sessions WHERE id = $1',
      [params.sessionId]
    )

    if (sessionRes.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get participants from live_session_participants if available
    let participants: unknown[] = []
    try {
      const partRes = await db.query(
        `SELECT lsp.*, u.name, u.phone_e164
         FROM live_session_participants lsp
         JOIN users u ON lsp.user_id = u.id
         WHERE lsp.live_session_id = $1 AND lsp.live_session_id IS NOT NULL`,
        [params.sessionId]
      )
      participants = partRes.rows
    } catch {
      // Table may not exist yet — return empty participants
    }

    return NextResponse.json({
      session: sessionRes.rows[0],
      participants,
    })
  } catch (error) {
    console.error('Failed to fetch session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
