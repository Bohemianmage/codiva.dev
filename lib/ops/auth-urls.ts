import { opsBaseUrl, portalBaseUrl } from '@/lib/ops/host';

export function opsAuthCallbackUrl(next = '/dashboard'): string {
  return `${opsBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function portalAuthCallbackUrl(slug: string, next = `/p/${slug}`): string {
  const safeNext = next.startsWith('/') ? next : `/p/${slug}`;
  return `${portalBaseUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}
