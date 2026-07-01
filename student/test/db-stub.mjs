// In-memory test stub for student/lib/db.
//
// The production module's exports are { getDb, setCurrentTenant, getDbWithTenant, default }.
// We mirror that surface, but getDb() returns a queryable whose behaviour
// is driven by a global the test file controls. This lets the test cases
// stub responses per-case without ever touching the real `pg` module
// (which can't be loaded by node --experimental-strip-types at the moment).

const g = globalThis;
if (!g.__OPENMAIC_STUDENT_DB_MOCK__) {
  g.__OPENMAIC_STUDENT_DB_MOCK__ = { handler: null };
}

export function getDb() {
  const mock = g.__OPENMAIC_STUDENT_DB_MOCK__;
  return {
    async query(sql, params) {
      if (!mock.handler) {
        throw new Error(
          'Test forgot to install a __OPENMAIC_STUDENT_DB_MOCK__.handler'
        );
      }
      return mock.handler(sql, params);
    },
  };
}

export async function setCurrentTenant(_tenantId) {
  // No-op for tests.
}

export async function getDbWithTenant(_tenantId) {
  return getDb();
}

export default { getDb, setCurrentTenant, getDbWithTenant };
