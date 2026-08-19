/** Path interno seguro para redirects (`next`). Evita open-redirect y bucles de login. */

export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  const value = (raw ?? '').trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (value.includes('\\') || value.includes('://') || value.length > 512) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || decoded.includes('://')) return fallback;
  } catch {
    return fallback;
  }
  return value;
}

export function isAuthLoopPath(path: string): boolean {
  const bare = path.split('?')[0] ?? path;
  if (bare === '/login' || bare.startsWith('/login/')) return true;
  if (bare.startsWith('/forgot-password')) return true;
  if (bare.startsWith('/auth/')) return true;
  if (/^\/p\/[^/]+\/login(\/|$)/.test(bare)) return true;
  return false;
}

export function safeNextPath(raw: string | null | undefined, fallback: string): string {
  const path = safeInternalPath(raw, fallback);
  return isAuthLoopPath(path) ? fallback : path;
}
