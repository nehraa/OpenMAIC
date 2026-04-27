import { getDb } from '../db';
import type { ContentAsset, ContentAssetVersion } from '@shared/types/assignment';

export interface SaveAssetData {
  teacherId: string;
  type: 'slide_deck' | 'quiz';
  title: string;
  payload: Record<string, unknown>;
  subjectTag?: string;
  sourceKind?: 'manual' | 'ai_generated' | 'imported';
  sourceRef?: string;
}

export interface LibraryFilters {
  type?: 'slide_deck' | 'quiz';
  subject?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssetWithVersions extends ContentAsset {
  versions: ContentAssetVersion[];
  currentVersion: ContentAssetVersion | null;
}

export function saveGeneratedContent(data: SaveAssetData): ContentAsset {
  const db = getDb();

  // Create the asset
  const result = db.prepare(`
    INSERT INTO content_assets (owner_teacher_id, type, title, subject_tag, source_kind, source_ref)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.teacherId,
    data.type,
    data.title,
    data.subjectTag || '',
    data.sourceKind || 'ai_generated',
    data.sourceRef || ''
  );

  const assetId = String(result.lastInsertRowid) as string;

  // Create the first version
  db.prepare(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES (?, 1, ?, 'published')
  `).run(assetId, JSON.stringify(data.payload));

  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ?').get(assetId) as ContentAsset;
  return asset;
}

export interface LibraryAsset extends ContentAsset {
  version_count: number;
  latest_version_id: string | null;
}

export function getLibraryAssets(teacherId: string, filters?: LibraryFilters): { assets: LibraryAsset[]; total: number } {
  const db = getDb();

  const conditions: string[] = ['owner_teacher_id = ?'];
  const values: (string | number)[] = [teacherId];

  if (filters?.type) {
    conditions.push('type = ?');
    values.push(filters.type);
  }

  if (filters?.subject) {
    conditions.push('subject_tag = ?');
    values.push(filters.subject);
  }

  if (filters?.search) {
    conditions.push('title LIKE ?');
    values.push(`%${filters.search}%`);
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM content_assets WHERE ${conditions.join(' AND ')}`;
  const countResult = db.prepare(countQuery).get(...values) as { count: number };

  // Get assets with version counts
  const assetsQuery = `
    SELECT ca.*,
      (SELECT COUNT(*) FROM content_asset_versions WHERE asset_id = ca.id) as version_count,
      (SELECT id FROM content_asset_versions WHERE asset_id = ca.id ORDER BY version_number DESC LIMIT 1) as latest_version_id
    FROM content_assets ca
    WHERE ${conditions.join(' AND ')}
    ORDER BY ca.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const assets = db.prepare(assetsQuery).all(...values, limit, offset) as LibraryAsset[];

  return { assets, total: countResult.count };
}

export function getAssetWithVersions(assetId: string): AssetWithVersions | null {
  const db = getDb();

  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ?').get(assetId) as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  const versions = db.prepare(`
    SELECT * FROM content_asset_versions
    WHERE asset_id = ?
    ORDER BY version_number DESC
  `).all(assetId) as ContentAssetVersion[];

  const currentVersion = versions.length > 0 ? versions[0] : null;

  return {
    ...asset,
    versions,
    currentVersion
  };
}

export interface ReuseAssetData {
  assetId: string;
  targetClassId: string;
  title?: string;
  releaseAt?: string;
  dueAt?: string;
}

export function reuseAsset(teacherId: string, data: ReuseAssetData): import('@shared/types/assignment').Assignment {
  const db = getDb();

  // Verify the asset belongs to the teacher
  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ? AND owner_teacher_id = ?').get(data.assetId, teacherId) as ContentAsset | undefined;
  if (!asset) {
    throw new Error('Asset not found or access denied');
  }

  // Get the current (latest) version
  const currentVersion = db.prepare(`
    SELECT * FROM content_asset_versions
    WHERE asset_id = ?
    ORDER BY version_number DESC
    LIMIT 1
  `).get(data.assetId) as ContentAssetVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for asset');
  }

  // Create assignment referencing the asset version
  const assignmentTitle = data.title || asset.title;

  const result = db.prepare(`
    INSERT INTO assignments (class_id, teacher_id, title, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(
    data.targetClassId,
    teacherId,
    assignmentTitle,
    asset.type === 'slide_deck' ? currentVersion.id : null,
    asset.type === 'quiz' ? currentVersion.id : null,
    data.releaseAt || null,
    data.dueAt || null
  );

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid) as import('@shared/types/assignment').Assignment;
  return assignment;
}

export interface TagAssetData {
  assetId: string;
  subjectTag: string;
}

export function tagAsset(teacherId: string, data: TagAssetData): ContentAsset | null {
  const db = getDb();

  // Verify asset belongs to teacher
  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ? AND owner_teacher_id = ?').get(data.assetId, teacherId) as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  db.prepare(`
    UPDATE content_assets SET subject_tag = ?, updated_at = datetime('now') WHERE id = ?
  `).run(data.subjectTag, data.assetId);

  return db.prepare('SELECT * FROM content_assets WHERE id = ?').get(data.assetId) as ContentAsset;
}

export function updateAssetTitle(teacherId: string, assetId: string, title: string): ContentAsset | null {
  const db = getDb();

  // Verify asset belongs to teacher
  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ? AND owner_teacher_id = ?').get(assetId, teacherId) as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  db.prepare(`
    UPDATE content_assets SET title = ?, updated_at = datetime('now') WHERE id = ?
  `).run(title, assetId);

  return db.prepare('SELECT * FROM content_assets WHERE id = ?').get(assetId) as ContentAsset;
}

export function getAssetById(assetId: string): ContentAsset | null {
  const db = getDb();
  const asset = db.prepare('SELECT * FROM content_assets WHERE id = ?').get(assetId) as ContentAsset | undefined;
  return asset || null;
}