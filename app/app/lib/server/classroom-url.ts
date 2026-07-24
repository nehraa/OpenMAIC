/**
 * Public-facing classroom URL helper.
 *
 * Core's storage layer derives the shareable classroom URL from the incoming
 * request's origin (`buildRequestOrigin` in core/lib/server/classroom-storage.ts).
 * When the teacher app talks to core via the internal address
 * (`http://127.0.0.1:3003` or `http://localhost:3003`), core returns
 * `http://127.0.0.1:3003/classroom/<id>` — a URL that works inside the
 * cluster but is unreachable from the public internet and leaks the internal
 * address in the teacher-facing UI.
 *
 * `toPublicClassroomUrl` accepts whatever URL core returned and rewrites it
 * to the configured public base, regardless of which private host core used.
 * The function is intentionally permissive: it strips any scheme/host combo
 * that looks like an internal address and replaces it with `publicBase`.
 * When `publicBase` is empty or `classroomId` is missing, it returns `#`.
 *
 * Returns `#` (not `null`) so callers can use it directly in JSX `href`
 * attributes without extra null-handling.
 */
export function toPublicClassroomUrl(rawUrl: string, publicBase: string): string {
  if (!rawUrl || !publicBase) return '#';

  // Match the last /classroom/<id> segment and use it as the canonical id.
  // The classroom id is alphanumeric + hyphens + underscores, so we cap at
  // the first query string or fragment.
  const match = rawUrl.match(/\/classroom\/([A-Za-z0-9_-]+)(?:[?#].*)?$/);
  if (!match) return '#';
  const classroomId = match[1];

  const base = publicBase.replace(/\/+$/, '');
  // Public base is already expected to include any path prefix (e.g.
  // https://openmaic.devstudios.me/classroom). Just append the id.
  return `${base}/${classroomId}`;
}