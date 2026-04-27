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
  createAssignment,
  addRecipients,
  releaseAssignment,
  getAssignmentsForTeacher,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} from './assignments';
import type { Assignment, AssignmentRecipient } from '@shared/types/assignment';

describe('Assignments Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
    mockDb.transaction.mockReset();
  });

  describe('createAssignment', () => {
    it('creates a draft assignment with required fields', () => {
      const mockAssignment: Assignment = {
        id: 'test-assignment-id',
        class_id: 'class-123',
        teacher_id: 'teacher-456',
        title: 'Test Assignment',
        description: '',
        slide_asset_version_id: null,
        quiz_asset_version_id: null,
        release_at: null,
        due_at: null,
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const runMock = vi.fn().mockReturnValue({ lastInsertRowid: 'test-assignment-id' });
      const getMock = vi.fn().mockReturnValue(mockAssignment);

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO assignments')) {
          return { run: runMock };
        }
        return { get: getMock };
      });

      const result = createAssignment({
        classId: 'class-123',
        teacherId: 'teacher-456',
        title: 'Test Assignment'
      });

      expect(result.status).toBe('draft');
      expect(result.title).toBe('Test Assignment');
    });
  });

  describe('getAssignmentById', () => {
    it('returns null when assignment not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAssignmentById('non-existent-id');

      expect(result).toBeNull();
    });

    it('returns assignment when found', () => {
      const mockAssignment: Assignment = {
        id: 'assign-1',
        class_id: 'class-123',
        teacher_id: 'teacher-456',
        title: 'Test Assignment',
        description: 'Test description',
        slide_asset_version_id: null,
        quiz_asset_version_id: null,
        release_at: null,
        due_at: null,
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockAssignment)
      });

      const result = getAssignmentById('assign-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('assign-1');
    });
  });

  describe('updateAssignment', () => {
    it('updates assignment title', () => {
      const currentAssignment = { status: 'draft' };
      const updatedAssignment: Assignment = {
        id: 'assign-1',
        class_id: 'class-123',
        teacher_id: 'teacher-456',
        title: 'Updated Title',
        description: '',
        slide_asset_version_id: null,
        quiz_asset_version_id: null,
        release_at: null,
        due_at: null,
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T11:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT status')) {
          return { get: vi.fn().mockReturnValue(currentAssignment) };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(updatedAssignment) };
      });

      const result = updateAssignment('assign-1', { title: 'Updated Title' });

      expect(result).not.toBeNull();
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('throws when trying to update released assignment', () => {
      const releasedAssignment = { status: 'released' };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(releasedAssignment)
      });

      expect(() => updateAssignment('assign-1', { title: 'New Title' }))
        .toThrow("Cannot update assignment with status 'released'");
    });
  });

  describe('addRecipients', () => {
    beforeEach(() => {
      mockDb.prepare.mockReset();
      mockDb.transaction.mockReset();
    });

    it('creates records for each student', () => {
      const mockRecipients: AssignmentRecipient[] = [
        { id: 'recipient-1', assignment_id: 'assign-1', student_id: 'student-1', visibility_status: 'hidden', assigned_at: '2026-04-26T10:00:00.000Z' },
        { id: 'recipient-2', assignment_id: 'assign-1', student_id: 'student-2', visibility_status: 'hidden', assigned_at: '2026-04-26T10:00:00.000Z' }
      ];

      // Track insert count via a mutable object reference
      const insertCounter = { value: 0 };
      // Track sequence of mock returns
      const returnIndex = { value: 0 };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('assignment_id = ?') && sql.includes('student_id = ?')) {
          // For checking existing recipients
          return { get: vi.fn().mockReturnValue(undefined) };
        }
        if (sql.includes('INSERT INTO assignment_recipients')) {
          insertCounter.value++;
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: `new-recipient-id-${insertCounter.value}` }) };
        }
        if (sql.includes('SELECT') && sql.includes('id = ?')) {
          // Return mockRecipients based on incrementing returnIndex
          const idx = returnIndex.value++;
          return { get: vi.fn().mockReturnValue(mockRecipients[idx]) };
        }
        return { get: vi.fn(), run: vi.fn(), all: vi.fn() };
      });

      mockDb.transaction.mockImplementation((fn: Function) => {
        return function(...args: any[]) {
          return fn(...args);
        };
      });

      const result = addRecipients('assign-1', ['student-1', 'student-2']);

      expect(result).toHaveLength(2);
      expect(result[0].student_id).toBe('student-1');
      expect(result[1].student_id).toBe('student-2');
    });

    it('does not duplicate existing recipients', () => {
      const existingRecipient: AssignmentRecipient = {
        id: 'existing-1',
        assignment_id: 'assign-1',
        student_id: 'student-1',
        visibility_status: 'hidden',
        assigned_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT') && sql.includes('assignment_id = ?') && sql.includes('student_id = ?')) {
          return { get: vi.fn().mockReturnValue(existingRecipient) };
        }
        return { get: vi.fn(), run: vi.fn(), all: vi.fn() };
      });

      mockDb.transaction.mockImplementation((fn: Function) => {
        return function(...args: any[]) {
          return fn(...args);
        };
      });

      const result = addRecipients('assign-1', ['student-1']);

      // No insert happens, so insertedRecipients stays empty
      expect(result).toHaveLength(0);
    });
  });

  describe('releaseAssignment', () => {
    it('changes status to released and sets visibility to visible', () => {
      const draftAssignment: Assignment = {
        id: 'assign-1',
        class_id: 'class-123',
        teacher_id: 'teacher-456',
        title: 'Test Assignment',
        description: '',
        slide_asset_version_id: null,
        quiz_asset_version_id: null,
        release_at: null,
        due_at: null,
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const releasedAssignment: Assignment = {
        ...draftAssignment,
        status: 'released'
      };

      let callCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        callCount++;
        if (sql.includes('SELECT * FROM assignments WHERE id = ?')) {
          return { get: vi.fn().mockReturnValue(callCount === 1 ? draftAssignment : releasedAssignment) };
        }
        if (sql.includes('UPDATE assignments')) {
          return { run: vi.fn() };
        }
        if (sql.includes('UPDATE assignment_recipients')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = releaseAssignment('assign-1');

      expect(result).not.toBeNull();
      expect(result?.status).toBe('released');
    });

    it('throws error when trying to release non-draft assignment', () => {
      const mockAssignment = { status: 'released' };

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(mockAssignment)
      });

      expect(() => releaseAssignment('assign-1'))
        .toThrow("Cannot release assignment with status 'released'");
    });
  });

  describe('getAssignmentsForTeacher', () => {
    it('returns all assignments for teacher', () => {
      const mockAssignments: Assignment[] = [
        { id: 'assign-1', teacher_id: 'teacher-456', status: 'draft', class_id: 'class-1', title: 'Assignment 1', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, created_at: '', updated_at: '' },
        { id: 'assign-2', teacher_id: 'teacher-456', status: 'released', class_id: 'class-1', title: 'Assignment 2', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAssignments)
      });

      const result = getAssignmentsForTeacher('teacher-456');

      expect(result).toHaveLength(2);
      expect(mockDb.prepare).toHaveBeenCalled();
    });

    it('filters by classId when provided', () => {
      const mockAssignments: Assignment[] = [
        { id: 'assign-1', teacher_id: 'teacher-456', class_id: 'class-123', status: 'draft', title: 'Assignment 1', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAssignments)
      });

      const result = getAssignmentsForTeacher('teacher-456', { classId: 'class-123' });

      expect(result).toHaveLength(1);
      expect(result[0].class_id).toBe('class-123');
    });

    it('filters by status when provided', () => {
      const mockAssignments: Assignment[] = [
        { id: 'assign-1', teacher_id: 'teacher-456', status: 'draft', class_id: 'class-1', title: 'Assignment 1', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAssignments)
      });

      const result = getAssignmentsForTeacher('teacher-456', { status: 'draft' });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('draft');
    });

    it('filters by both classId and status when both provided', () => {
      const mockAssignments: Assignment[] = [
        { id: 'assign-1', teacher_id: 'teacher-456', class_id: 'class-123', status: 'draft', title: 'Assignment 1', description: '', slide_asset_version_id: null, quiz_asset_version_id: null, release_at: null, due_at: null, created_at: '', updated_at: '' }
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockAssignments)
      });

      const result = getAssignmentsForTeacher('teacher-456', { classId: 'class-123', status: 'draft' });

      expect(result).toHaveLength(1);
    });
  });

  describe('deleteAssignment', () => {
    it('deletes draft assignment', () => {
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT status')) {
          return { get: vi.fn().mockReturnValue({ status: 'draft' }) };
        }
        if (sql.includes('DELETE FROM assignments')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn() };
      });

      const result = deleteAssignment('assign-1');

      expect(result).toBe(true);
    });

    it('throws when trying to delete non-draft assignment', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ status: 'released' })
      });

      expect(() => deleteAssignment('assign-1'))
        .toThrow("Cannot delete assignment with status 'released'");
    });

    it('returns false when assignment not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = deleteAssignment('non-existent');

      expect(result).toBe(false);
    });
  });
});