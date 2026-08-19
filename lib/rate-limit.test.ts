import { describe, expect, it } from 'vitest';
import { consumeRateLimitMemory, type RateBucket } from './rate-limit';

describe('consumeRateLimitMemory', () => {
  it('allows up to max requests in the window', () => {
    const store = new Map<string, RateBucket>();
    const now = 1_000_000;
    expect(consumeRateLimitMemory(store, 'ip:a', 60_000, 2, now).ok).toBe(true);
    expect(consumeRateLimitMemory(store, 'ip:a', 60_000, 2, now + 10).ok).toBe(true);
    const blocked = consumeRateLimitMemory(store, 'ip:a', 60_000, 2, now + 20);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after the window', () => {
    const store = new Map<string, RateBucket>();
    const now = 1_000_000;
    consumeRateLimitMemory(store, 'k', 1_000, 1, now);
    expect(consumeRateLimitMemory(store, 'k', 1_000, 1, now + 10).ok).toBe(false);
    expect(consumeRateLimitMemory(store, 'k', 1_000, 1, now + 1_001).ok).toBe(true);
  });

  it('isolates keys', () => {
    const store = new Map<string, RateBucket>();
    const now = 1_000_000;
    consumeRateLimitMemory(store, 'a', 60_000, 1, now);
    expect(consumeRateLimitMemory(store, 'a', 60_000, 1, now).ok).toBe(false);
    expect(consumeRateLimitMemory(store, 'b', 60_000, 1, now).ok).toBe(true);
  });
});
