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

export async function saveGeneratedContent(data: SaveAssetData): Promise<ContentAsset> {
  const db = getDb();

  const assetResult = await db.query(`
    INSERT INTO content_assets (owner_teacher_id, type, title, subject_tag, source_kind, source_ref)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [
    data.teacherId,
    data.type,
    data.title,
    data.subjectTag || '',
    data.sourceKind || 'ai_generated',
    data.sourceRef || ''
  ]);

  const asset = assetResult.rows[0] as ContentAsset;
  const assetId = asset.id;

  await db.query(`
    INSERT INTO content_asset_versions (asset_id, version_number, payload_json, status)
    VALUES ($1, 1, $2, 'published')
  `, [assetId, JSON.stringify(data.payload)]);

  return asset;
}

export interface LibraryAsset extends ContentAsset {
  version_count: number;
  latest_version_id: string | null;
}

export async function getLibraryAssets(teacherId: string, filters?: LibraryFilters): Promise<{ assets: LibraryAsset[]; total: number }> {
  const db = getDb();

  const conditions: string[] = ['owner_teacher_id = $1'];
  const values: (string | number)[] = [teacherId];
  let paramIndex = 2;

  if (filters?.type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(filters.type);
  }

  if (filters?.subject) {
    conditions.push(`subject_tag = $${paramIndex++}`);
    values.push(filters.subject);
  }

  if (filters?.search) {
    conditions.push(`title LIKE $${paramIndex++}`);
    values.push(`%${filters.search}%`);
  }

  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  const countQuery = `SELECT COUNT(*) as count FROM content_assets WHERE ${conditions.join(' AND ')}`;
  const countResult = await db.query(countQuery, values);
  const total = countResult.rows[0].count as number;

  const assetsQuery = `
    SELECT ca.*,
      (SELECT COUNT(*) FROM content_asset_versions WHERE asset_id = ca.id) as version_count,
      (SELECT id FROM content_asset_versions WHERE asset_id = ca.id ORDER BY version_number DESC LIMIT 1) as latest_version_id
    FROM content_assets ca
    WHERE ${conditions.join(' AND ')}
    ORDER BY ca.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex}
  `;

  values.push(limit, offset);
  const assetsResult = await db.query(assetsQuery, values);

  return { assets: assetsResult.rows as LibraryAsset[], total };
}

export async function getAssetWithVersions(assetId: string): Promise<AssetWithVersions | null> {
  const db = getDb();

  const assetResult = await db.query('SELECT * FROM content_assets WHERE id = $1', [assetId]);
  const asset = assetResult.rows[0] as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  const versionsResult = await db.query(`
    SELECT * FROM content_asset_versions
    WHERE asset_id = $1
    ORDER BY version_number DESC
  `, [assetId]);

  const versions = versionsResult.rows as ContentAssetVersion[];
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

export async function reuseAsset(teacherId: string, data: ReuseAssetData): Promise<import('@shared/types/assignment').Assignment> {
  const db = getDb();

  const assetResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND owner_teacher_id = $2', [data.assetId, teacherId]);
  const asset = assetResult.rows[0] as ContentAsset | undefined;
  if (!asset) {
    throw new Error('Asset not found or access denied');
  }

  const versionResult = await db.query(`
    SELECT * FROM content_asset_versions
    WHERE asset_id = $1
    ORDER BY version_number DESC
    LIMIT 1
  `, [data.assetId]);

  const currentVersion = versionResult.rows[0] as ContentAssetVersion | undefined;

  if (!currentVersion) {
    throw new Error('No version found for asset');
  }

  const assignmentTitle = data.title || asset.title;

  const assignmentResult = await db.query(`
    INSERT INTO assignments (class_id, teacher_id, title, slide_asset_version_id, quiz_asset_version_id, release_at, due_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
    RETURNING *
  `, [
    data.targetClassId,
    teacherId,
    assignmentTitle,
    asset.type === 'slide_deck' ? currentVersion.id : null,
    asset.type === 'quiz' ? currentVersion.id : null,
    data.releaseAt || null,
    data.dueAt || null
  ]);

  return assignmentResult.rows[0] as import('@shared/types/assignment').Assignment;
}

export interface TagAssetData {
  assetId: string;
  subjectTag: string;
}

export async function tagAsset(teacherId: string, data: TagAssetData): Promise<ContentAsset | null> {
  const db = getDb();

  const assetResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND owner_teacher_id = $2', [data.assetId, teacherId]);
  const asset = assetResult.rows[0] as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  await db.query(`
    UPDATE content_assets SET subject_tag = $1, updated_at = NOW() WHERE id = $2
  `, [data.subjectTag, data.assetId]);

  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [data.assetId]);
  return result.rows[0] as ContentAsset;
}

export async function updateAssetTitle(teacherId: string, assetId: string, title: string): Promise<ContentAsset | null> {
  const db = getDb();

  const assetResult = await db.query('SELECT * FROM content_assets WHERE id = $1 AND owner_teacher_id = $2', [assetId, teacherId]);
  const asset = assetResult.rows[0] as ContentAsset | undefined;
  if (!asset) {
    return null;
  }

  await db.query(`
    UPDATE content_assets SET title = $1, updated_at = NOW() WHERE id = $2
  `, [title, assetId]);

  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [assetId]);
  return result.rows[0] as ContentAsset;
}

export async function getAssetById(assetId: string): Promise<ContentAsset | null> {
  const db = getDb();
  const result = await db.query('SELECT * FROM content_assets WHERE id = $1', [assetId]);
  return (result.rows[0] as ContentAsset) || null;
}
