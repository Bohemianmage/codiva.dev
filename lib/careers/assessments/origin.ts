/** Short staff-facing code from the stored IP hash. Not reversible to the IP. */
export function originFingerprint(ipHash: string | null | undefined): string | null {
  const hash = String(ipHash || '')
    .trim()
    .toLowerCase();
  if (hash.length < 16 || !/^[0-9a-f]+$/.test(hash)) return null;
  return hash.slice(0, 8).toUpperCase();
}

export function deviceLabelFromUserAgent(ua: string | null | undefined): string | null {
  const value = String(ua || '');
  if (!value) return null;
  const os = /Android/i.test(value)
    ? 'Android'
    : /iPhone|iPad|iPod/i.test(value)
      ? 'iOS'
      : /Windows/i.test(value)
        ? 'Windows'
        : /Mac OS X/i.test(value)
          ? 'macOS'
          : /Linux/i.test(value)
            ? 'Linux'
            : null;
  const browser = /Edg\//i.test(value)
    ? 'Edge'
    : /Chrome\//i.test(value)
      ? 'Chrome'
      : /Firefox\//i.test(value)
        ? 'Firefox'
        : /Safari/i.test(value) && !/Chrome/i.test(value)
          ? 'Safari'
          : null;
  if (os && browser) return `${os} · ${browser}`;
  return os || browser;
}

export function attemptsSharingOrigin<T extends { ip_hash?: string | null }>(
  attempts: T[],
  ipHash: string | null | undefined
): T[] {
  const hash = String(ipHash || '').trim();
  if (!hash) return [];
  return attempts.filter((row) => row.ip_hash === hash);
}

export function sharedOriginAttemptCount<T extends { ip_hash?: string | null }>(attempts: T[]): number {
  const counts = new Map<string, number>();
  for (const row of attempts) {
    const hash = String(row.ip_hash || '').trim();
    if (!hash) continue;
    counts.set(hash, (counts.get(hash) || 0) + 1);
  }
  let n = 0;
  for (const row of attempts) {
    const hash = String(row.ip_hash || '').trim();
    if (hash && (counts.get(hash) || 0) >= 2) n += 1;
  }
  return n;
}

export function distinctOriginEmails<T extends { email: string }>(rows: T[]): number {
  return new Set(rows.map((row) => row.email.trim().toLowerCase()).filter(Boolean)).size;
}
