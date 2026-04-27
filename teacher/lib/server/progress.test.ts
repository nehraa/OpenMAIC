import { describe, it, expect, beforeEach, vi } from 'vitest';

// Create mock database
const mockDb = {
  prepare: vi.fn(),
  transaction: vi.fn((fn: Function) => {
    return function (this: any, ...args: any[]) {
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
  getClassProgress,
  getAssignmentProgress,
  exportToCSV
} from './progress';

describe('Progress Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('getClassProgress', () => {
    it('returns null when class not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getClassProgress('non-existent-class');

      expect(result).toBeNull();
    });

    it('returns all enrolled students for a class', () => {
      // Mock class exists
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, name FROM classes')) {
          return { get: vi.fn().mockReturnValue({ id: 'class-1', name: 'Test Class' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice', student_phone: '+1234567890' },
              { student_id: 'student-2', student_name: 'Bob', student_phone: '+0987654321' }
            ])
          };
        }
        if (sql.includes('SELECT a.id, a.title')) {
          return { all: vi.fn().mockReturnValue([]) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = getClassProgress('class-1');

      expect(result).not.toBeNull();
      expect(result!.classId).toBe('class-1');
      expect(result!.className).toBe('Test Class');
      expect(result!.students).toHaveLength(2);
      expect(result!.students[0].studentName).toBe('Alice');
      expect(result!.students[1].studentName).toBe('Bob');
    });

    it('filters students by status when provided', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, name FROM classes')) {
          return { get: vi.fn().mockReturnValue({ id: 'class-1', name: 'Test Class' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice', student_phone: '+1234567890' },
              { student_id: 'student-2', student_name: 'Bob', student_phone: '+0987654321' }
            ])
          };
        }
        if (sql.includes('SELECT a.id, a.title')) {
          return {
            all: vi.fn().mockReturnValue([
              { id: 'assign-1', title: 'Assignment 1' }
            ])
          };
        }
        if (sql.includes('COUNT(DISTINCT slide_id)')) {
          return { get: vi.fn().mockReturnValue({ slides_viewed: 10 }) };
        }
        if (sql.includes('COUNT(*) as total_slides')) {
          return { get: vi.fn().mockReturnValue({ total_slides: 10 }) };
        }
        if (sql.includes('SELECT score_percent')) {
          return { get: vi.fn().mockReturnValue({ score_percent: 85, submitted_at: '2026-04-26', started_at: '2026-04-26' }) };
        }
        if (sql.includes('MAX(viewed_at)')) {
          return { all: vi.fn().mockReturnValue([{ last_view: '2026-04-26' }]) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = getClassProgress('class-1', { status: 'completed' });

      expect(result).not.toBeNull();
      // Students with all assignments completed will be returned
    });
  });

  describe('getAssignmentProgress', () => {
    it('returns null when assignment not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAssignmentProgress('non-existent-assignment');

      expect(result).toBeNull();
    });

    it('returns progress for assignment with correct stats', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT a.id, a.title, a.class_id')) {
          return { get: vi.fn().mockReturnValue({ id: 'assign-1', title: 'Test Assignment', class_id: 'class-1' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice', student_phone: '+1234567890' },
              { student_id: 'student-2', student_name: 'Bob', student_phone: '+0987654321' }
            ])
          };
        }
        if (sql.includes('slides_viewed')) {
          return { all: vi.fn().mockReturnValue([{ student_id: 'student-1', slides_viewed: 10 }]) };
        }
        if (sql.includes('total_slides')) {
          return { get: vi.fn().mockReturnValue({ total_slides: 10 }) };
        }
        if (sql.includes('SELECT student_id, score_percent')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', score_percent: 85, submitted_at: '2026-04-26', started_at: '2026-04-26' }
            ])
          };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = getAssignmentProgress('assign-1');

      expect(result).not.toBeNull();
      expect(result!.assignmentId).toBe('assign-1');
      expect(result!.assignmentTitle).toBe('Test Assignment');
      expect(result!.totalStudents).toBe(2);
    });
  });

  describe('exportToCSV', () => {
    it('returns empty string when class not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = exportToCSV('non-existent-class');

      expect(result).toBe('');
    });

    it('generates valid CSV with correct columns', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, name FROM classes')) {
          return { get: vi.fn().mockReturnValue({ id: 'class-1', name: 'Test Class' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice', student_phone: '+1234567890' }
            ])
          };
        }
        if (sql.includes('SELECT a.id, a.title')) {
          return {
            all: vi.fn().mockReturnValue([
              { id: 'assign-1', title: 'Assignment 1' }
            ])
          };
        }
        if (sql.includes('COUNT(DISTINCT slide_id)')) {
          return { get: vi.fn().mockReturnValue({ slides_viewed: 10 }) };
        }
        if (sql.includes('COUNT(*) as total_slides')) {
          return { get: vi.fn().mockReturnValue({ total_slides: 10 }) };
        }
        if (sql.includes('SELECT score_percent')) {
          return { get: vi.fn().mockReturnValue({ score_percent: 85, submitted_at: '2026-04-26T10:00:00', started_at: '2026-04-26T09:00:00' }) };
        }
        if (sql.includes('MAX(viewed_at)')) {
          return { all: vi.fn().mockReturnValue([{ last_view: '2026-04-26T10:00:00' }]) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = exportToCSV('class-1');

      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + at least 1 data row

      // Check header
      const header = lines[0];
      expect(header).toContain('student_name');
      expect(header).toContain('student_phone');
      expect(header).toContain('assignment_title');
      expect(header).toContain('slides_viewed');
      expect(header).toContain('quiz_completed');
      expect(header).toContain('quiz_score_percent');
      expect(header).toContain('total_time_minutes');
      expect(header).toContain('last_activity_at');
    });

    it('escapes CSV values with commas and quotes', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, name FROM classes')) {
          return { get: vi.fn().mockReturnValue({ id: 'class-1', name: 'Test, Class' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice "quotes"', student_phone: '+1234567890' }
            ])
          };
        }
        if (sql.includes('SELECT a.id, a.title')) {
          return { all: vi.fn().mockReturnValue([]) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = exportToCSV('class-1');

      // Check that the student name with quotes is properly escaped
      expect(result).toContain('"Alice ""quotes"""');
    });

    it('handles students with no assignments', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT id, name FROM classes')) {
          return { get: vi.fn().mockReturnValue({ id: 'class-1', name: 'Test Class' }) };
        }
        if (sql.includes('SELECT DISTINCT u.id')) {
          return {
            all: vi.fn().mockReturnValue([
              { student_id: 'student-1', student_name: 'Alice', student_phone: '+1234567890' }
            ])
          };
        }
        if (sql.includes('SELECT a.id, a.title')) {
          return { all: vi.fn().mockReturnValue([]) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = exportToCSV('class-1');

      const lines = result.split('\n');
      // Header + 1 student row with empty assignment fields
      expect(lines.length).toBe(2);
      expect(lines[1]).toContain('Alice');
      expect(lines[1]).toContain('+1234567890');
    });
  });
});
