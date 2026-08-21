import { interviewsBaseUrl, opsBaseUrl, portalBaseUrl } from '@/lib/ops/host';
import { safeInternalPath } from '@/lib/ops/safe-path';

export function opsAuthCallbackUrl(next = '/dashboard'): string {
  const safeNext = safeInternalPath(next, '/dashboard');
  return `${opsBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function portalAuthCallbackUrl(slug: string, next = `/p/${slug}`): string {
  const fallback = `/p/${slug}`;
  const safeNext = safeInternalPath(next, fallback);
  return `${portalBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

/** Callback Auth en host portal sin slug (hub / reset global). */
export function portalHubAuthCallbackUrl(next = '/proyectos'): string {
  const safeNext = safeInternalPath(next, '/proyectos');
  return `${portalBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

export function interviewsAuthCallbackUrl(next = '/'): string {
  const safeNext = safeInternalPath(next, '/');
  return `${interviewsBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
