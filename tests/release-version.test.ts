import { describe, expect, it } from 'vitest';
import { nextVersion, releaseLevel } from '../scripts/next-release-version.mjs';

describe('releaseLevel', () => {
  it('returns no release for unrecognized commits', () => {
    expect(releaseLevel([{ subject: 'Update documentation', body: '' }])).toBeNull();
  });

  it.each(['fix', 'perf', 'revert', 'style', 'refactor', 'test', 'build', 'ci', 'chore'])(
    'treats %s commits as patches',
    (type) => {
      expect(releaseLevel([{ subject: `${type}: update package`, body: '' }])).toBe('patch');
    },
  );

  it('lets a feature override patch commits', () => {
    expect(
      releaseLevel([
        { subject: 'fix: repair package', body: '' },
        { subject: 'feat(theme): add navigation', body: '' },
      ]),
    ).toBe('minor');
  });

  it.each([
    { subject: 'feat!: replace the theme API', body: '' },
    { subject: 'fix(theme)!: replace the theme API', body: '' },
    { subject: 'fix: replace the theme API', body: 'BREAKING CHANGE: the old API was removed' },
  ])('recognizes a breaking change', (commit) => {
    expect(releaseLevel([commit])).toBe('major');
  });
});

describe('nextVersion', () => {
  it.each([
    ['v3.9.36', 'patch', '3.9.37'],
    ['v3.9.36', 'minor', '3.10.0'],
    ['v3.9.36', 'major', '4.0.0'],
  ] as const)('increments %s with a %s release', (tag, level, expected) => {
    expect(nextVersion(tag, level)).toBe(expected);
  });

  it('rejects non-semantic release tags', () => {
    expect(() => nextVersion('release-3.9.36', 'patch')).toThrow('stable semantic version tag');
  });
});
