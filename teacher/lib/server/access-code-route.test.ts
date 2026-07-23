import { afterEach, describe, expect, it, vi } from 'vitest';

const { withRoleMock } = vi.hoisted(() => ({
  withRoleMock: vi.fn((roles: string[], handler: (...args: unknown[]) => Promise<Response>) => handler),
}));

vi.mock('@/lib/server/middleware', () => ({
  withRole: withRoleMock,
}));

import { GET } from '@/app/api/teacher/access-code/route';

const invokeGet = GET as unknown as () => Promise<Response>;

describe('teacher access code route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is teacher-only and returns a configured code without allowing caching', async () => {
    vi.stubEnv('ACCESS_CODE', 'CLASS-2026');

    const response = await invokeGet();

    expect(withRoleMock).toHaveBeenCalledWith(['teacher'], expect.any(Function));
    await expect(response.json()).resolves.toEqual({ enabled: true, code: 'CLASS-2026' });
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('reports a disabled gate when no code is configured', async () => {
    vi.stubEnv('ACCESS_CODE', '');

    const response = await invokeGet();

    await expect(response.json()).resolves.toEqual({ enabled: false, code: '' });
  });
});
