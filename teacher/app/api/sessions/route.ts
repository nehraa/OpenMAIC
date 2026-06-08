import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { getDb } from '@/lib/db'

/**
 * POST /api/sessions — Create a new live session
 *
 * Schema uses status enum ('draft', 'live', 'ended'). The new code uses
 * ('waiting', 'live', 'ended'), so we INSERT with 'draft' to satisfy the
 * CHECK constraint and then promote to 'live' when the teacher clicks Start.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const {
      classId,
      title,
      duration,
      maxParticipants,
      aiTeacherEnabled,
      aiClassmatesCount,
      enableWhiteboard,
      enableChat,
    } = body

    if (!classId || !title) {
      return NextResponse.json(
        { error: 'classId and title are required' },
        { status: 400 }
      )
    }

    // Generate a UUID (column is UUID, not TEXT)
    const sessionId = crypto.randomUUID()
    const db = getDb()

    // Verify class exists before insert
    const classCheck = await db.query(
      'SELECT id, teacher_id FROM classes WHERE id = $1',
      [classId]
    )
    if (classCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }
    const teacherId = (classCheck.rows[0] as { teacher_id: string }).teacher_id

    // Create session record (status = 'draft' to satisfy the schema CHECK)
    const result = await db.query(
      `INSERT INTO classroom_sessions
        (id, class_id, teacher_id, title, max_duration_minutes, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'draft', NOW())
       RETURNING *`,
      [sessionId, classId, teacherId, title, duration || 45]
    )

    // Record the AI/feature config in session_participants isn't right — that
    // table is for actual participants. Use a dedicated config column if it
    // exists in the future. For now, log it and surface it in the response.
    const config = {
      maxParticipants: maxParticipants || 30,
      aiTeacherEnabled: aiTeacherEnabled ?? true,
      aiClassmatesCount: aiClassmatesCount || 0,
      enableWhiteboard: enableWhiteboard ?? true,
      enableChat: enableChat ?? true,
    }

    return NextResponse.json({
      sessionId,
      session: result.rows[0],
      config,
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sessions — List teacher's sessions (optionally filtered by status)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  try {
    const db = getDb()
    let query = 'SELECT * FROM classroom_sessions ORDER BY created_at DESC'
    const params: string[] = []

    if (status) {
      query = 'SELECT * FROM classroom_sessions WHERE status = $1 ORDER BY created_at DESC'
      params.push(status)
    }

    const result = await db.query(query, params)
    return NextResponse.json({ sessions: result.rows })
  } catch (error) {
    console.error('Failed to list sessions:', error)
    return NextResponse.json(
      { error: 'Failed to list sessions' },
      { status: 500 }
    )
  }
}
