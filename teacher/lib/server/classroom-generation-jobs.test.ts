import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockQuery } = vi.hoisted(() => ({
  mockQuery: vi.fn(),
}));

vi.mock('../db', () => ({
  getDb: () => ({ query: mockQuery }),
}));

vi.mock('./library', () => ({
  saveGeneratedContent: vi.fn(),
}));

vi.mock('./usage', () => ({
  recordUsage: vi.fn(),
}));

import {
  advanceClassroomGenerationJob,
  type ClassroomGenerationJob,
} from './classroom-generation-jobs';

const pendingJob: ClassroomGenerationJob = {
  id: 'teacher-job-1',
  tenantId: 'tenant-1',
  teacherId: 'teacher-1',
  prompt: 'Teach photosynthesis',
  coreJobId: 'core-job-1',
  corePollUrl: 'https://core.example/api/generate-classroom/core-job-1',
  status: 'pending',
  pollFailures: 0,
  fallback: false,
  createdAt: new Date('2026-07-23T10:00:00.000Z'),
  updatedAt: new Date('2026-07-23T10:00:00.000Z'),
};

describe('advanceClassroomGenerationJob', () => {
  beforeEach(() => {
    mockQuery.mockReset().mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns live progress from a pending Core job without persisting it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        done: false,
        status: 'running',
        step: 'generating_scenes',
        progress: 54,
        message: 'Generating scene 3 of 5',
        scenesGenerated: 3,
        totalScenes: 5,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await advanceClassroomGenerationJob(pendingJob);

    expect(result).toMatchObject({
      progress: 54,
      step: 'generating_scenes',
      message: 'Generating scene 3 of 5',
      scenesGenerated: 3,
      totalScenes: 5,
    });
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(String(mockQuery.mock.calls[0][0])).toContain('poll_failures = 0');

    // Core's middleware rejects unauthenticated calls, so the outbound request
    // must carry the HMAC-signed `openmaic_access` cookie.
    const outboundCookie = (fetchMock.mock.calls[0][1] as RequestInit).headers?.Cookie as string;
    expect(outboundCookie).toMatch(/^openmaic_access=\d+\.[0-9a-f]+$/);
  });
});
