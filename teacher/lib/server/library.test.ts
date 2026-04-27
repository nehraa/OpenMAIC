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
  saveGeneratedContent,
  getLibraryAssets,
  getAssetWithVersions,
  reuseAsset,
  tagAsset,
  updateAssetTitle
} from './library';
import type { ContentAsset, ContentAssetVersion } from '@shared/types/assignment';

describe('Library Domain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReset();
  });

  describe('saveGeneratedContent', () => {
    it('creates asset and initial version', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: 'gen-ref-1',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      let insertCallCount = 0;
      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO content_assets')) {
          insertCallCount++;
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'asset-123' }) };
        }
        if (sql.includes('INSERT INTO content_asset_versions')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(mockAsset) };
      });

      const result = saveGeneratedContent({
        teacherId: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        payload: { slides: [] },
        subjectTag: 'Math'
      });

      expect(result.title).toBe('Test Slides');
      expect(result.type).toBe('slide_deck');
      expect(insertCallCount).toBe(1);
    });

    it('creates quiz asset with correct type', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-quiz-123',
        owner_teacher_id: 'teacher-456',
        type: 'quiz',
        title: 'Math Quiz',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('INSERT INTO content_assets')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'asset-quiz-123' }) };
        }
        if (sql.includes('INSERT INTO content_asset_versions')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(mockAsset) };
      });

      const result = saveGeneratedContent({
        teacherId: 'teacher-456',
        type: 'quiz',
        title: 'Math Quiz',
        payload: { questions: [] }
      });

      expect(result.type).toBe('quiz');
    });
  });

  describe('getLibraryAssets', () => {
    it('returns assets for teacher', () => {
      const mockAssets = [
        { id: 'asset-1', title: 'Slide Deck 1', type: 'slide_deck', subject_tag: 'Math', owner_teacher_id: 'teacher-456', source_kind: 'ai_generated', source_ref: '', created_at: '', updated_at: '', version_count: 2, latest_version_id: 'v2' },
        { id: 'asset-2', title: 'Quiz 1', type: 'quiz', subject_tag: 'Science', owner_teacher_id: 'teacher-456', source_kind: 'ai_generated', source_ref: '', created_at: '', updated_at: '', version_count: 1, latest_version_id: 'v1' }
      ];

      mockDb.prepare.mockReturnValue({
        get: () => ({ count: 2 }),
        all: () => mockAssets
      } as Record<string, unknown>);

      const result = getLibraryAssets('teacher-456');

      expect(result.assets).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('filters by type', () => {
      const mockAssets = [
        { id: 'asset-1', title: 'Slide Deck 1', type: 'slide_deck', subject_tag: '', owner_teacher_id: 'teacher-456', source_kind: '', source_ref: '', created_at: '', updated_at: '', version_count: 1, latest_version_id: 'v1' }
      ];

      mockDb.prepare.mockReturnValue({
        get: () => ({ count: 1 }),
        all: () => mockAssets
      } as Record<string, unknown>);

      const result = getLibraryAssets('teacher-456', { type: 'slide_deck' });

      expect(result.assets[0].type).toBe('slide_deck');
    });

    it('filters by subject', () => {
      const mockAssets = [
        { id: 'asset-1', title: 'Math Slides', type: 'slide_deck', subject_tag: 'Math', owner_teacher_id: 'teacher-456', source_kind: '', source_ref: '', created_at: '', updated_at: '', version_count: 1, latest_version_id: 'v1' }
      ];

      mockDb.prepare.mockReturnValue({
        get: () => ({ count: 1 }),
        all: () => mockAssets
      } as Record<string, unknown>);

      const result = getLibraryAssets('teacher-456', { subject: 'Math' });

      expect(result.assets[0].subject_tag).toBe('Math');
    });

    it('filters by search term', () => {
      const mockAssets = [
        { id: 'asset-1', title: 'Algebra Slides', type: 'slide_deck', subject_tag: 'Math', owner_teacher_id: 'teacher-456', source_kind: '', source_ref: '', created_at: '', updated_at: '', version_count: 1, latest_version_id: 'v1' }
      ];

      mockDb.prepare.mockReturnValue({
        get: () => ({ count: 1 }),
        all: () => mockAssets
      } as Record<string, unknown>);

      const result = getLibraryAssets('teacher-456', { search: 'Algebra' });

      expect(result.assets[0].title).toContain('Algebra');
    });
  });

  describe('getAssetWithVersions', () => {
    it('returns asset with versions', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersions: ContentAssetVersion[] = [
        { id: 'v2', asset_id: 'asset-123', version_number: 2, payload_json: '{}', status: 'published', created_at: '2026-04-26T12:00:00.000Z' },
        { id: 'v1', asset_id: 'asset-123', version_number: 1, payload_json: '{}', status: 'archived', created_at: '2026-04-26T10:00:00.000Z' }
      ];

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockAsset) };
        }
        if (sql.includes('SELECT * FROM content_asset_versions')) {
          return { all: vi.fn().mockReturnValue(mockVersions) };
        }
        return { get: vi.fn(), all: vi.fn() };
      });

      const result = getAssetWithVersions('asset-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('asset-123');
      expect(result?.versions).toHaveLength(2);
      expect(result?.currentVersion?.version_number).toBe(2);
    });

    it('returns null when asset not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = getAssetWithVersions('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('reuseAsset', () => {
    it('creates assignment from asset', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      const mockVersion: ContentAssetVersion = {
        id: 'v1',
        asset_id: 'asset-123',
        version_number: 1,
        payload_json: '{}',
        status: 'published',
        created_at: '2026-04-26T10:00:00.000Z'
      };

      const mockAssignment = {
        id: 'assign-new',
        class_id: 'class-789',
        teacher_id: 'teacher-456',
        title: 'Test Slides',
        description: '',
        slide_asset_version_id: 'v1',
        quiz_asset_version_id: null,
        release_at: null,
        due_at: null,
        status: 'draft',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockAsset) };
        }
        if (sql.includes('SELECT * FROM content_asset_versions')) {
          return { get: vi.fn().mockReturnValue(mockVersion) };
        }
        if (sql.includes('INSERT INTO assignments')) {
          return { run: vi.fn().mockReturnValue({ lastInsertRowid: 'assign-new' }) };
        }
        return { get: vi.fn().mockReturnValue(mockAssignment) };
      });

      const result = reuseAsset('teacher-456', {
        assetId: 'asset-123',
        targetClassId: 'class-789'
      });

      expect(result.slide_asset_version_id).toBe('v1');
      expect(result.status).toBe('draft');
    });

    it('throws when asset not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      expect(() => reuseAsset('teacher-456', {
        assetId: 'non-existent',
        targetClassId: 'class-789'
      })).toThrow('Asset not found or access denied');
    });

    it('throws when no version exists', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockAsset) };
        }
        return { get: vi.fn().mockReturnValue(undefined) };
      });

      expect(() => reuseAsset('teacher-456', {
        assetId: 'asset-123',
        targetClassId: 'class-789'
      })).toThrow('No version found for asset');
    });
  });

  describe('tagAsset', () => {
    it('updates subject tag', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Test Slides',
        subject_tag: 'Science',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue(mockAsset) };
        }
        if (sql.includes('UPDATE content_assets')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn(), run: vi.fn() };
      });

      const result = tagAsset('teacher-456', { assetId: 'asset-123', subjectTag: 'Science' });

      expect(result).not.toBeNull();
      expect(result?.subject_tag).toBe('Science');
    });

    it('returns null when asset not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = tagAsset('teacher-456', { assetId: 'non-existent', subjectTag: 'Math' });

      expect(result).toBeNull();
    });
  });

  describe('updateAssetTitle', () => {
    it('updates asset title', () => {
      const mockAsset: ContentAsset = {
        id: 'asset-123',
        owner_teacher_id: 'teacher-456',
        type: 'slide_deck',
        title: 'Updated Title',
        subject_tag: 'Math',
        source_kind: 'ai_generated',
        source_ref: '',
        created_at: '2026-04-26T10:00:00.000Z',
        updated_at: '2026-04-26T10:00:00.000Z'
      };

      mockDb.prepare.mockImplementation((sql: string) => {
        if (sql.includes('SELECT * FROM content_assets')) {
          return { get: vi.fn().mockReturnValue({ id: 'asset-123', owner_teacher_id: 'teacher-456', type: 'slide_deck', title: 'Old Title', subject_tag: '', source_kind: 'ai_generated', source_ref: '', created_at: '', updated_at: '' }) };
        }
        if (sql.includes('UPDATE content_assets')) {
          return { run: vi.fn() };
        }
        return { get: vi.fn().mockReturnValue(mockAsset) };
      });

      const result = updateAssetTitle('teacher-456', 'asset-123', 'Updated Title');

      expect(result).not.toBeNull();
    });

    it('returns null when asset not found', () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue(undefined)
      });

      const result = updateAssetTitle('teacher-456', 'non-existent', 'New Title');

      expect(result).toBeNull();
    });
  });
});