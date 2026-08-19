import { describe, expect, it } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from './security-headers';

describe('security headers', () => {
  it('forbids framing the app from other origins', () => {
    const csp = contentSecurityPolicy(false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    const keys = securityHeaders(false).map((h) => h.key);
    expect(keys).toContain('Content-Security-Policy');
    expect(keys).toContain('X-Frame-Options');
  });

  it('allows eval only in development for Next HMR', () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
  });
});
