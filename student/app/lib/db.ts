// Re-export from the shared lib/db which uses pg pool
export { getDb, setCurrentTenant, getDbWithTenant, withTenant } from '../../lib/db/index';
export { default } from '../../lib/db/index';