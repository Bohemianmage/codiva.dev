import { opsBaseUrl } from '@/lib/ops/host';

export function opsAuthCallbackUrl(next = '/dashboard'): string {
  const base = opsBaseUrl().replace(/\/$/, '');
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function portalAuthCallbackUrl(slug: string, next = `/p/${slug}`): string {
  const base = opsBaseUrl().replace(/\/$/, '');
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
