import { getDb } from '../db';

export interface LiveSession {
  id: string;
  assignment_id: string;
  teacher_id: string;
  state_snapshot_json: string;
  status: 'live' | 'ended';
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveSessionParticipant {
  id: string;
  live_session_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  completion_state: 'pending' | 'completed';
}

export interface SessionState {
  currentSlideIndex: number;
  totalSlides: number;
  slideContent?: string;
  timestamp: string;
}

export interface LiveSessionWithParticipants extends LiveSession {
  participants: (LiveSessionParticipant & { user_name?: string; user_phone?: string })[];
  participantCount: number;
}

export async function createLiveSession(assignmentId: string, teacherId: string): Promise<LiveSession> {
  const db = getDb();

  const initialState: SessionState = {
    currentSlideIndex: 0,
    totalSlides: 0,
    timestamp: new Date().toISOString()
  };

  const result = await db.query(`
    INSERT INTO live_sessions (assignment_id, teacher_id, state_snapshot_json, status)
    VALUES ($1, $2, $3, 'live')
    RETURNING *
  `, [assignmentId, teacherId, JSON.stringify(initialState)]);

  return result.rows[0] as LiveSession;
}

export async function updateSessionState(sessionId: string, state: Partial<SessionState>): Promise<LiveSession | null> {
  const db = getDb();

  const currentResult = await db.query('SELECT state_snapshot_json FROM live_sessions WHERE id = $1', [sessionId]);
  const current = currentResult.rows[0] as { state_snapshot_json: string } | undefined;
  if (!current) {
    return null;
  }

  const currentState: SessionState = JSON.parse(current.state_snapshot_json);
  const updatedState: SessionState = {
    ...currentState,
    ...state,
    timestamp: new Date().toISOString()
  };

  await db.query(`
    UPDATE live_sessions
    SET state_snapshot_json = $1, updated_at = NOW()
    WHERE id = $2
  `, [JSON.stringify(updatedState), sessionId]);

  const result = await db.query('SELECT * FROM live_sessions WHERE id = $1', [sessionId]);
  return result.rows[0] as LiveSession;
}

export async function endSession(sessionId: string): Promise<LiveSession | null> {
  const db = getDb();

  const currentResult = await db.query('SELECT status FROM live_sessions WHERE id = $1', [sessionId]);
  const current = currentResult.rows[0] as { status: string } | undefined;
  if (!current) {
    return null;
  }

  if (current.status !== 'live') {
    throw new Error(`Cannot end session with status '${current.status}'`);
  }

  await db.query(`
    UPDATE live_sessions
    SET status = 'ended', ended_at = NOW(), updated_at = NOW()
    WHERE id = $1
  `, [sessionId]);

  // Mark all active participants as left
  await db.query(`
    UPDATE live_session_participants
    SET left_at = NOW()
    WHERE live_session_id = $1 AND left_at IS NULL
  `, [sessionId]);

  const result = await db.query('SELECT * FROM live_sessions WHERE id = $1', [sessionId]);
  return result.rows[0] as LiveSession;
}

export async function getSessionById(sessionId: string): Promise<LiveSession | null> {
  const db = getDb();
  const result = await db.query('SELECT * FROM live_sessions WHERE id = $1', [sessionId]);
  return (result.rows[0] as LiveSession) || null;
}

export async function getSessionWithParticipants(sessionId: string): Promise<LiveSessionWithParticipants | null> {
  const db = getDb();

  const sessionResult = await db.query('SELECT * FROM live_sessions WHERE id = $1', [sessionId]);
  const session = sessionResult.rows[0] as LiveSession | undefined;
  if (!session) {
    return null;
  }

  const participantsResult = await db.query(`
    SELECT lsp.*, u.name as user_name, u.phone_e164 as user_phone
    FROM live_session_participants lsp
    JOIN users u ON lsp.user_id = u.id
    WHERE lsp.live_session_id = $1
    ORDER BY lsp.joined_at ASC
  `, [sessionId]);

  const participants = participantsResult.rows as (LiveSessionParticipant & { user_name?: string; user_phone?: string })[];

  return {
    ...session,
    participants,
    participantCount: participants.length
  };
}

export async function joinSession(sessionId: string, userId: string): Promise<LiveSessionParticipant | null> {
  const db = getDb();

  const sessionResult = await db.query('SELECT status FROM live_sessions WHERE id = $1', [sessionId]);
  const session = sessionResult.rows[0] as { status: string } | undefined;
  if (!session) {
    return null;
  }

  if (session.status === 'ended') {
    throw new Error('Cannot join ended session');
  }

  const existingResult = await db.query(`
    SELECT * FROM live_session_participants
    WHERE live_session_id = $1 AND user_id = $2
  `, [sessionId, userId]);

  const existing = existingResult.rows[0] as LiveSessionParticipant | undefined;

  if (existing) {
    // Update left_at to NULL if they rejoin
    if (existing.left_at) {
      await db.query(`
        UPDATE live_session_participants
        SET left_at = NULL, completion_state = 'pending'
        WHERE id = $1
      `, [existing.id]);
    }
    const result = await db.query('SELECT * FROM live_session_participants WHERE id = $1', [existing.id]);
    return result.rows[0] as LiveSessionParticipant;
  }

  const participantResult = await db.query(`
    INSERT INTO live_session_participants (live_session_id, user_id)
    VALUES ($1, $2)
    RETURNING *
  `, [sessionId, userId]);

  return participantResult.rows[0] as LiveSessionParticipant;
}

export async function markParticipantComplete(sessionId: string, userId: string): Promise<LiveSessionParticipant | null> {
  const db = getDb();

  const participantResult = await db.query(`
    SELECT * FROM live_session_participants
    WHERE live_session_id = $1 AND user_id = $2
  `, [sessionId, userId]);

  const participant = participantResult.rows[0] as LiveSessionParticipant | undefined;

  if (!participant) {
    return null;
  }

  await db.query(`
    UPDATE live_session_participants
    SET completion_state = 'completed', left_at = NOW()
    WHERE id = $1
  `, [participant.id]);

  const result = await db.query('SELECT * FROM live_session_participants WHERE id = $1', [participant.id]);
  return result.rows[0] as LiveSessionParticipant;
}

export async function getParticipantCompletionState(sessionId: string, userId: string): Promise<{ completed: boolean; completed_at: string | null }> {
  const db = getDb();

  const participantResult = await db.query(`
    SELECT completion_state, left_at FROM live_session_participants
    WHERE live_session_id = $1 AND user_id = $2
  `, [sessionId, userId]);

  const participant = participantResult.rows[0] as { completion_state: string; left_at: string | null } | undefined;

  return {
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at || null
  };
}

export async function getActiveSessionsForAssignment(assignmentId: string): Promise<LiveSession[]> {
  const db = getDb();
  const result = await db.query(`
    SELECT * FROM live_sessions
    WHERE assignment_id = $1 AND status = 'live'
    ORDER BY started_at DESC
  `, [assignmentId]);
  return result.rows as LiveSession[];
}
