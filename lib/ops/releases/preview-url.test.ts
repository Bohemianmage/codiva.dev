import { describe, expect, it } from 'vitest';
import { withVercelPreviewBypass } from './preview-url';

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
