import { describe, expect, it } from 'vitest';
import { buildClassroomUrl } from './classroom-url';

describe('buildClassroomUrl', () => {
  it('builds the deployed public classroom URL without localhost leakage', () => {
    expect(
      buildClassroomUrl('abc_123', 'https://openmaic.devstudios.me/classroom')
    ).toBe('https://openmaic.devstudios.me/classroom/abc_123');
  });

  it('accepts a public origin and adds the classroom base path once', () => {
    expect(
      buildClassroomUrl('abc_123', 'https://openmaic.devstudios.me/')
    ).toBe('https://openmaic.devstudios.me/classroom/abc_123');
  });

  it('encodes classroom ids and rejects missing configuration', () => {
    expect(buildClassroomUrl('room with spaces', 'https://example.com/classroom/')).toBe(
      'https://example.com/classroom/room%20with%20spaces'
    );
    expect(buildClassroomUrl('abc', '')).toBe('#');
  });
});
