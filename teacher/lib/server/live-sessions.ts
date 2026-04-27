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

export function createLiveSession(assignmentId: string, teacherId: string): LiveSession {
  const db = getDb();

  const initialState: SessionState = {
    currentSlideIndex: 0,
    totalSlides: 0,
    timestamp: new Date().toISOString()
  };

  const result = db.prepare(`
    INSERT INTO live_sessions (assignment_id, teacher_id, state_snapshot_json, status)
    VALUES (?, ?, ?, 'live')
  `).run(
    assignmentId,
    teacherId,
    JSON.stringify(initialState)
  );

  const session = db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(result.lastInsertRowid) as LiveSession;
  return session;
}

export function updateSessionState(sessionId: string, state: Partial<SessionState>): LiveSession | null {
  const db = getDb();

  const current = db.prepare('SELECT state_snapshot_json FROM live_sessions WHERE id = ?').get(sessionId) as { state_snapshot_json: string } | undefined;
  if (!current) {
    return null;
  }

  const currentState: SessionState = JSON.parse(current.state_snapshot_json);
  const updatedState: SessionState = {
    ...currentState,
    ...state,
    timestamp: new Date().toISOString()
  };

  db.prepare(`
    UPDATE live_sessions
    SET state_snapshot_json = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(JSON.stringify(updatedState), sessionId);

  return db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(sessionId) as LiveSession;
}

export function endSession(sessionId: string): LiveSession | null {
  const db = getDb();

  const current = db.prepare('SELECT status FROM live_sessions WHERE id = ?').get(sessionId) as { status: string } | undefined;
  if (!current) {
    return null;
  }

  if (current.status !== 'live') {
    throw new Error(`Cannot end session with status '${current.status}'`);
  }

  db.prepare(`
    UPDATE live_sessions
    SET status = 'ended', ended_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(sessionId);

  // Mark all active participants as left
  db.prepare(`
    UPDATE live_session_participants
    SET left_at = datetime('now')
    WHERE live_session_id = ? AND left_at IS NULL
  `).run(sessionId);

  return db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(sessionId) as LiveSession;
}

export function getSessionById(sessionId: string): LiveSession | null {
  const db = getDb();
  const session = db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(sessionId) as LiveSession | undefined;
  return session || null;
}

export function getSessionWithParticipants(sessionId: string): LiveSessionWithParticipants | null {
  const db = getDb();

  const session = db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(sessionId) as LiveSession | undefined;
  if (!session) {
    return null;
  }

  const participants = db.prepare(`
    SELECT lsp.*, u.name as user_name, u.phone_e164 as user_phone
    FROM live_session_participants lsp
    JOIN users u ON lsp.user_id = u.id
    WHERE lsp.live_session_id = ?
    ORDER BY lsp.joined_at ASC
  `).all(sessionId) as (LiveSessionParticipant & { user_name?: string; user_phone?: string })[];

  return {
    ...session,
    participants,
    participantCount: participants.length
  };
}

export function joinSession(sessionId: string, userId: string): LiveSessionParticipant | null {
  const db = getDb();

  const session = db.prepare('SELECT status FROM live_sessions WHERE id = ?').get(sessionId) as { status: string } | undefined;
  if (!session) {
    return null;
  }

  if (session.status === 'ended') {
    throw new Error('Cannot join ended session');
  }

  const existing = db.prepare(`
    SELECT * FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, userId) as LiveSessionParticipant | undefined;

  if (existing) {
    // Update left_at to NULL if they rejoin
    if (existing.left_at) {
      db.prepare(`
        UPDATE live_session_participants
        SET left_at = NULL, completion_state = 'pending'
        WHERE id = ?
      `).run(existing.id);
    }
    return db.prepare('SELECT * FROM live_session_participants WHERE id = ?').get(existing.id) as LiveSessionParticipant;
  }

  const result = db.prepare(`
    INSERT INTO live_session_participants (live_session_id, user_id)
    VALUES (?, ?)
  `).run(sessionId, userId);

  return db.prepare('SELECT * FROM live_session_participants WHERE id = ?').get(result.lastInsertRowid) as LiveSessionParticipant;
}

export function markParticipantComplete(sessionId: string, userId: string): LiveSessionParticipant | null {
  const db = getDb();

  const participant = db.prepare(`
    SELECT * FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, userId) as LiveSessionParticipant | undefined;

  if (!participant) {
    return null;
  }

  db.prepare(`
    UPDATE live_session_participants
    SET completion_state = 'completed', left_at = datetime('now')
    WHERE id = ?
  `).run(participant.id);

  return db.prepare('SELECT * FROM live_session_participants WHERE id = ?').get(participant.id) as LiveSessionParticipant;
}

export function getParticipantCompletionState(sessionId: string, userId: string): { completed: boolean; completed_at: string | null } {
  const db = getDb();

  const participant = db.prepare(`
    SELECT completion_state, left_at FROM live_session_participants
    WHERE live_session_id = ? AND user_id = ?
  `).get(sessionId, userId) as { completion_state: string; left_at: string | null } | undefined;

  return {
    completed: participant?.completion_state === 'completed',
    completed_at: participant?.left_at || null
  };
}

export function getActiveSessionsForAssignment(assignmentId: string): LiveSession[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM live_sessions
    WHERE assignment_id = ? AND status = 'live'
    ORDER BY started_at DESC
  `).all(assignmentId) as LiveSession[];
}
