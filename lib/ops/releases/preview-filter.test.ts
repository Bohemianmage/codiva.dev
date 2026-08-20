import { describe, expect, it } from 'vitest';
import {
  dedupePreviewsBySha,
  filterPromotedPreviews,
  incomingEmptyHint,
  isDirtyVercelMeta,
  isIntegrationGitRef,
  previewHasGitAlias,
  selectStalePreviewIds,
} from './preview-filter';

describe('isDirtyVercelMeta', () => {
  it('flags gitDirty and cursor-cli', () => {
    expect(isDirtyVercelMeta({ gitDirty: '1' })).toBe(true);
    expect(isDirtyVercelMeta({ actor: 'cursor-cli' })).toBe(true);
    expect(isDirtyVercelMeta({ githubCommitSha: 'abc' })).toBe(false);
  });
});

describe('isIntegrationGitRef', () => {
  it('treats main/master as integration', () => {
    expect(isIntegrationGitRef('main')).toBe(true);
    expect(isIntegrationGitRef('refs/heads/master')).toBe(true);
    expect(isIntegrationGitRef('preview/ops-release')).toBe(false);
  });
});

describe('incomingEmptyHint', () => {
  it('reports behind vs waiting on CI', () => {
    expect(incomingEmptyHint({ mainSha: 'aaaaaaaa', previewSha: 'bbbbbbbb' })).toBe('preview_behind');
    expect(incomingEmptyHint({ mainSha: 'aaaaaaaa', previewSha: null })).toBe('preview_behind');
    expect(incomingEmptyHint({ mainSha: 'aaaaaaaa', previewSha: 'aaaaaaaa' })).toBe('preview_waiting');
    expect(incomingEmptyHint({ mainSha: null, previewSha: null })).toBe(null);
  });
});

describe('previewHasGitAlias', () => {
  it('detects -git- hosts', () => {
    expect(previewHasGitAlias('https://nirc-abc-codiva-dev.vercel.app', [
      'nirc-git-preview-ops-release-codiva-dev.vercel.app',
    ])).toBe(true);
    expect(previewHasGitAlias('https://nirc-abc-codiva-dev.vercel.app')).toBe(false);
  });
});

describe('dedupePreviewsBySha', () => {
  it('keeps newest and prefers git alias', () => {
    const items = dedupePreviewsBySha([
      {
        deploymentId: 'dpl_old',
        previewUrl: 'https://nirc-old-codiva-dev.vercel.app',
        sha: 'abcdef1',
        createdAt: '2026-08-19T10:00:00.000Z',
        hasGitAlias: false,
      },
      {
        deploymentId: 'dpl_git',
        previewUrl: 'https://nirc-git-preview-ops-release-codiva-dev.vercel.app',
        sha: 'abcdef1',
        createdAt: '2026-08-19T09:00:00.000Z',
        hasGitAlias: true,
      },
      {
        deploymentId: 'dpl_other',
        previewUrl: 'https://nirc-other-codiva-dev.vercel.app',
        sha: 'bbbbbbb',
        createdAt: '2026-08-19T11:00:00.000Z',
      },
    ]);
    expect(items.map((i) => i.deploymentId)).toEqual(['dpl_other', 'dpl_git']);
  });
});

describe('filterPromotedPreviews', () => {
  it('hides matching sha and opaque host, not reused git aliases', () => {
    const kept = filterPromotedPreviews(
      [
        { sha: 'aaaaaaaa', previewUrl: 'https://nirc-a.vercel.app' },
        { sha: 'bbbbbbbb', previewUrl: 'https://nirc-git-preview-ops-release-codiva-dev.vercel.app' },
        { sha: 'cccccccc', previewUrl: 'https://nirc-opaque.vercel.app' },
      ],
      [
        { sha: 'aaaaaaaa', previewUrl: 'https://old.vercel.app' },
        {
          sha: 'dddddddd',
          previewUrl: 'https://nirc-git-preview-ops-release-codiva-dev.vercel.app',
        },
        { sha: 'eeeeeeee', previewUrl: 'https://nirc-opaque.vercel.app' },
      ]
    );
    expect(kept.map((i) => i.sha)).toEqual(['bbbbbbbb']);
  });
});

describe('selectStalePreviewIds', () => {
  it('returns old non-kept deploys', () => {
    const now = Date.parse('2026-08-20T00:00:00.000Z');
    const ids = selectStalePreviewIds(
      [
        {
          deploymentId: 'dpl_keep',
          previewUrl: 'https://nirc-git-keep.vercel.app',
          sha: 'ccccccc',
          createdAt: '2026-08-19T00:00:00.000Z',
          hasGitAlias: true,
        },
        {
          deploymentId: 'dpl_stale',
          previewUrl: 'https://nirc-stale.vercel.app',
          sha: 'ddddddd',
          createdAt: '2026-08-01T00:00:00.000Z',
          hasGitAlias: false,
        },
      ],
      now
    );
    expect(ids).toEqual(['dpl_stale']);
  });
});
