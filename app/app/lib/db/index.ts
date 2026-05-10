import { Pool, PoolConfig, PoolClient } from 'pg';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
};

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

export function getDb() {
  return pool;
}

/**
 * Set the current tenant context for RLS policies.
 * Do not use this with pooled queries; use getDbWithTenant() and run all
 * request queries on the returned client instead.
 */
export async function setCurrentTenant(tenantId: string): Promise<void> {
  throw new Error(
    `setCurrentTenant(${tenantId}) is not supported with pooled queries. Use a single PoolClient for all request-scoped queries.`
  );
}

/**
 * Get a db client with tenant context already set.
 * Use this for operations that need consistent RLS within a request.
 */
export async function getDbWithTenant(tenantId: string): Promise<PoolClient> {
  const client = await pool.connect();
  await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
  return client;
}

export default { getDb, setCurrentTenant, getDbWithTenant };
