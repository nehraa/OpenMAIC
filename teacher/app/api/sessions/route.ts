import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, title, duration, maxParticipants, aiTeacherEnabled, aiClassmatesCount, enableWhiteboard, enableChat } = body

    const db = getDb()

    // Generate session ID
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert into database
    const result = await db.query(`
      INSERT INTO classroom_sessions (id, class_id, title, max_duration_minutes, status, created_at)
      VALUES ($1, $2, $3, $4, 'draft', NOW())
      RETURNING *
    `, [sessionId, classId, title, duration])

    return NextResponse.json({
      sessionId,
      session: result.rows[0],
      message: 'Session created successfully'
    })
  } catch (error) {
    console.error('Failed to create session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const db = getDb()

  let query = 'SELECT * FROM classroom_sessions ORDER BY created_at DESC'
  const params: string[] = []

  if (status) {
    query = 'SELECT * FROM classroom_sessions WHERE status = $1 ORDER BY created_at DESC'
    params.push(status)
  }

  const result = await db.query(query, params)

  return NextResponse.json({ sessions: result.rows })
}