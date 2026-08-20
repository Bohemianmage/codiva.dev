import { describe, expect, it } from 'vitest';
import { releaseHistoryHref, withVercelPreviewBypass } from './preview-url';

describe('releaseHistoryHref', () => {
  it('uses the production build URL after a successful promote', () => {
    expect(
      releaseHistoryHref({
        status: 'succeeded',
        production_url: 'https://nirc-prod.vercel.app',
        preview_url: 'https://nirc-git-preview-ops-release-codiva-dev.vercel.app',
      })
    ).toEqual({ href: 'https://nirc-prod.vercel.app', live: true });
  });

  it('falls back to preview when production is missing', () => {
    expect(
      releaseHistoryHref({
        status: 'succeeded',
        production_url: null,
        preview_url: 'https://nirc-preview.vercel.app',
      })
    ).toEqual({ href: 'https://nirc-preview.vercel.app', live: false });
  });
});

describe('withVercelPreviewBypass', () => {
  it('leaves the URL unchanged without a secret', () => {
    expect(withVercelPreviewBypass('https://nirc-git-feat.vercel.app', null)).toBe(
      'https://nirc-git-feat.vercel.app'
    );
  });

  it('adds bypass query params so the browser can skip Vercel login', () => {
    const href = withVercelPreviewBypass('nirc-git-feat.vercel.app', 'secret-1');
    const parsed = new URL(href);
    expect(parsed.searchParams.get('x-vercel-protection-bypass')).toBe('secret-1');
    expect(parsed.searchParams.get('x-vercel-set-bypass-cookie')).toBe('true');
  });
});
