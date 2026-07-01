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
 * Acquire a connection, set the tenant context, run the callback, release.
 * Use this for any tenant-scoped query path. Replaces ad-hoc
 * getDb().query() calls when RLS is enforced.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    // set_config is_local=true only scopes to a single statement; wrap in a
    // transaction so app.current_tenant_id is set for every query in fn().
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    try {
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    }
  } finally {
    client.release();
  }
}

/**
 * Set the current tenant context for RLS policies.
 * Must be called before any tenant-scoped queries.
 */
export async function setCurrentTenant(tenantId: string): Promise<void> {
  await pool.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
}

/**
 * Get a db client with tenant context already set.
 */
export async function getDbWithTenant(tenantId: string): Promise<PoolClient> {
  const client = await pool.connect();
  await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
  return client;
}

export default { getDb, setCurrentTenant, getDbWithTenant };
