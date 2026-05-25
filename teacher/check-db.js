import { getDb } from './lib/db/index.js';

async function checkAssets() {
  const db = getDb();
  
  console.log('=== Recent Content Assets ===');
  const assets = await db.query(`
    SELECT id, title, type, source_kind, source_ref, created_at 
    FROM content_assets 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  
  assets.rows.forEach(a => {
    console.log(`ID: ${a.id.substring(0, 8)}... | Title: ${a.title.substring(0, 40)} | Type: ${a.type} | Source: ${a.source_ref || 'none'} | Created: ${a.created_at}`);
  });
  
  console.log('\n=== Recent Asset Versions ===');
  const versions = await db.query(`
    SELECT av.id, av.asset_id, av.version_number, av.payload_json, av.status, av.created_at
    FROM content_asset_versions av
    ORDER BY av.created_at DESC
    LIMIT 5
  `);
  
  versions.rows.forEach(v => {
    const payload = typeof v.payload_json === 'string' ? JSON.parse(v.payload_json) : v.payload_json;
    console.log(`Asset: ${v.asset_id.substring(0, 8)}... | Version: ${v.version_number} | Status: ${v.status} | openmaicUrl: ${payload?.openmaicUrl || 'none'} | mock: ${payload?.mockGenerated || false}`);
  });
  
  await db.close();
}

checkAssets().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
