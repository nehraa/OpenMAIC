// Registers the test-only ESM loader that redirects lib/db imports to
// the in-memory stub. Loaded via node --import from the test script.
//
// Usage:
//   node --import ./test/register.mjs --test 'lib/**/*.test.ts'

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
register(pathToFileURL(path.join(here, 'db-loader.mjs')).href);
