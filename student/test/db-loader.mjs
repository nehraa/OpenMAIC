// Test-only ESM loader: redirects imports of the lib/db pool module to a
// in-memory stub file. The stub exposes a `getDb()` returning a fake
// `query()` that the test cases drive directly.
//
// This is the standard node:test pattern when the production module pulls in
// a CJS dependency (pg) that node --experimental-strip-types can't resolve
// in ESM mode. We don't touch the real db module — we just short-circuit
// resolution for the test runner.

import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

const STUB_URL = pathToFileURL(
  path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    'db-stub.mjs'
  )
).href;

export async function resolve(specifier, context, nextResolve) {
  if (
    specifier === '../db/index.ts' ||
    specifier === '../db/index' ||
    specifier === '../db' ||
    specifier === '@/lib/db' ||
    specifier === '../db.ts'
  ) {
    return { url: STUB_URL, shortCircuit: true, format: 'module' };
  }
  return nextResolve(specifier, context);
}
