import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock database
const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function(this: any, ...args: any[]) {
      return fn.apply(this, args);
    };
  }),
  exec: vi.fn()
};

// Mock the db module
vi.mock('@/lib/db', () => ({
  getDb: () => mockDb,
  default: { getDb: () => mockDb }
}));

// Import after mocking
import {
  createLiveSession,
  updateSessionState,
  endSession,
  getSessionById,
  getSessionWithParticipants,
  joinSession,
  markParticipantComplete,
  getParticipantCompletionState
} from './live-sessions';

describe('Live Sessions Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('createLiveSession', () => {
    it('creates a record with live status', () => {
      const mockSession = {
        id: 'live-session-1',
        assignment_id: 'assignment-123',
        teacher_id: 'teacher-456',
        state_snapshot_json: JSON.stringify({
          currentSlideIndex: 0,
          totalSlides: 0,
          timestamp: '2026-04-26T10:00:00.000Z'
        }),
        status: 'live',
        started_at: '2026-04-26T10:00:00.000Z',
        ended_at: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const runMock = vi.fn().mockReturnValue({ lastInsertRowid: 'live-session-1' });
      const getMock = vi.fn().mockReturnValue(mockSession);

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO live_sessions')) {
          return { run: runMock };
        }
        return { get: getMock };
      });

      const result = createLiveSession('assignment-123', 'teacher-456');

      expect(result.status).toBe('live');
      expect(result.assignment_id).toBe('assignment-123');
      expect(result.teacher_id).toBe('teacher-456');

      // Verify initial state
      const parsedState = JSON.parse(result.state_snapshot_json);
      expect(parsedState.currentSlideIndex).toBe(0);
      expect(parsedState.totalSlides).toBe(0);
    });

    it('creates session with initial state containing timestamp', () => {
      const mockSession = {
        id: 'live-session-2',
        assignment_id: 'assignment-123',
        teacher_id: 'teacher-456',
        state_snapshot_json: JSON.stringify({
          currentSlideIndex: 0,
          totalSlides: 5,
          timestamp: '2026-04-26T10:00:00.000Z'
        }),
        status: 'live',
        started_at: '2026-04-26T10:00:00.000Z',
        ended_at: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const runMock = vi.fn().mockReturnValue({ lastInsertRowid: 'live-session-2' });
      const getMock = vi.fn().mockReturnValue(mockSession);

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO live_sessions')) {
          return { run: runMock };
        }
        return { get: getMock };
      });

      const result = createLiveSession('assignment-123', 'teacher-456');
      const parsedState = JSON.parse(result.state_snapshot_json);

      expect(parsedState.timestamp).toBeDefined();
      expect(typeof parsedState.timestamp).toBe('string');
    });
  });

  describe('updateSessionState', () => {
    it('persists state changes', () => {
      const currentSession = {
        state_snapshot_json: JSON.stringify({
          currentSlideIndex: 0,
          totalSlides: 10,
          timestamp: '2026-04-26T10:00:00.000Z'
        })
      };

      const updatedSession = {
        id: 'live-session-1',
        assignment_id: 'assignment-123',
        teacher_id: 'teacher-456',
        state_snapshot_json: JSON.stringify({
          currentSlideIndex: 2,
          totalSlides: 10,
          timestamp: '2026-04-26T10:05:00.000Z'
        }),
        status: 'live',
        started_at: '2026-04-26T10:00:00.000Z',
        ended_at: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:05:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT state_snapshot_json')) {
          return { get: vi.fn().mockReturnValue(currentSession) };
        }
        if (sql.includes('UPDATE live_sessions')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(updatedSession) };
      });

      const result = updateSessionState('live-session-1', { currentSlideIndex: 2 });

      expect(result).not.toBeNull();
      const parsedState = JSON.parse(result!.state_snapshot_json);
      expect(parsedState.currentSlideIndex).toBe(2);
    });

    it('returns null when session not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = updateSessionState('non-existent', { currentSlideIndex: 2 });

      expect(result).toBeNull();
    });
  });

  describe('endSession', () => {
    it('marks session as ended', () => {
      const currentSession = { status: 'live' };

      const endedSession = {
        id: 'live-session-1',
        assignment_id: 'assignment-123',
        teacher_id: 'teacher-456',
        state_snapshot_json: '{}',
        status: 'ended',
        started_at: '2026-04-26T10:00:00.000Z',
        ended_at: '2026-04-26T10:30:00.000Z',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:30:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT status')) {
          return { get: vi.fn().mockReturnValue(currentSession) };
        }
        if (sql.includes('UPDATE live_sessions')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE live_session_participants')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(endedSession) };
      });

      const result = endSession('live-session-1');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('ended');
    });

    it('throws when trying to end non-live session', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ status: 'ended' })
      });

      expect(() => endSession('live-session-1'))
        .toThrow("Cannot end session with status 'ended'");
    });

    it('returns null when session not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = endSession('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getSessionById', () => {
    it('returns session when found', () => {
      const mockSession = {
        id: 'live-session-1',
        status: 'live'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockSession)
      });

      const result = getSessionById('live-session-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('live-session-1');
    });

    it('returns null when not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getSessionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('joinSession', () => {
    it('throws when trying to join ended session', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ status: 'ended' })
      });

      expect(() => joinSession('live-session-1', 'student-789'))
        .toThrow('Cannot join ended session');
    });

    it('returns null when session not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = joinSession('non-existent', 'student-789');

      expect(result).toBeNull();
    });
  });

  describe('Student cannot join ended session', () => {
    it('throws error when session is ended', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ status: 'ended' })
      });

      expect(() => joinSession('live-session-1', 'student-789'))
        .toThrow('Cannot join ended session');
    });
  });

  describe('getSessionWithParticipants', () => {
    it('returns session with participants list', () => {
      const mockSession = {
        id: 'live-session-1',
        assignment_id: 'assignment-123',
        teacher_id: 'teacher-456',
        state_snapshot_json: '{}',
        status: 'live',
        started_at: '2026-04-26T10:00:00.000Z',
        ended_at: null,
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockParticipants = [
        { id: 'p1', live_session_id: 'live-session-1', user_id: 'student-1', user_name: 'Student One', user_phone: '+1234567890', joined_at: '2026-04-26T10:05:00.000Z', left_at: null, completion_state: 'pending' },
        { id: 'p2', live_session_id: 'live-session-1', user_id: 'student-2', user_name: 'Student Two', user_phone: '+1234567891', joined_at: '2026-04-26T10:07:00.000Z', left_at: null, completion_state: 'completed' }
      ];

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM live_sessions WHERE id = ?')) {
          return { get: vi.fn().mockReturnValue(mockSession) };
        }
        if (sql.includes('SELECT lsp.*, u.name') || (sql.includes('users u') && sql.includes('live_session_participants lsp'))) {
          return { all: vi.fn().mockReturnValue(mockParticipants) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = getSessionWithParticipants('live-session-1');

      expect(result).not.toBeNull();
      expect(result!.participantCount).toBe(2);
      expect(result!.participants).toHaveLength(2);
      expect(result!.participants[0].user_name).toBe('Student One');
    });

    it('returns null when session not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getSessionWithParticipants('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('markParticipantComplete', () => {
    it('updates participant completion state', () => {
      const mockParticipant = {
        id: 'participant-1',
        live_session_id: 'live-session-1',
        user_id: 'student-789',
        joined_at: '2026-04-26T10:05:00.000Z',
        left_at: null,
        completion_state: 'pending'
      };

      const completedParticipant = {
        id: 'participant-1',
        live_session_id: 'live-session-1',
        user_id: 'student-789',
        joined_at: '2026-04-26T10:05:00.000Z',
        left_at: '2026-04-26T10:30:00.000Z',
        completion_state: 'completed'
      };

      let callCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM live_session_participants')) {
          callCount++;
          if (callCount === 1) {
            return { get: vi.fn().mockReturnValue(mockParticipant) };
          }
          return { get: vi.fn().mockReturnValue(completedParticipant) };
        }
        if (sql.includes('UPDATE live_session_participants')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = markParticipantComplete('live-session-1', 'student-789');

      expect(result).not.toBeNull();
      expect(result!.completion_state).toBe('completed');
    });

    it('returns null when participant not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = markParticipantComplete('live-session-1', 'non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getParticipantCompletionState', () => {
    it('returns completed true when participant is completed', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({
          completion_state: 'completed',
          left_at: '2026-04-26T10:30:00.000Z'
        })
      });

      const result = getParticipantCompletionState('live-session-1', 'student-789');

      expect(result.completed).toBe(true);
      expect(result.completed_at).toBe('2026-04-26T10:30:00.000Z');
    });

    it('returns completed false when participant is pending', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({
          completion_state: 'pending',
          left_at: null
        })
      });

      const result = getParticipantCompletionState('live-session-1', 'student-789');

      expect(result.completed).toBe(false);
      expect(result.completed_at).toBeNull();
    });

    it('returns completed false when participant not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getParticipantCompletionState('live-session-1', 'non-existent');

      expect(result.completed).toBe(false);
      expect(result.completed_at).toBeNull();
    });
  });
});
