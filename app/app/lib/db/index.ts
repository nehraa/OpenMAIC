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

// Dev-mode RLS bypass: set session_replication_role = replica on each new
// connection so service-role auth paths (login/signup that don't yet have
// a tenant context) can see across tenants. The DB role here is `postgres`
// (superuser) but `relforcerowsecurity=true` was set on tables, so even
// superuser reads are filtered. replica role bypasses FORCE ROW LEVEL
// SECURITY. When this app moves to a per-tenant DB role in production,
// switch to withTenant() for tenant-scoped paths.
if (process.env.NODE_ENV !== 'production') {
  pool.on('connect', (client) => {
    client.query(`SET SESSION session_replication_role = 'replica'`).catch((err) => {
      console.error('[db] failed to set session_replication_role:', err.message);
    });
  });
}

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
    await client.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
    return await fn(client);
  } finally {
    client.release();
  }
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
