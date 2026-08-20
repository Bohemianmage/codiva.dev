import { asHttpHref } from '@/lib/ops/host';

const BYPASS_PARAM = 'x-vercel-protection-bypass';
const COOKIE_PARAM = 'x-vercel-set-bypass-cookie';

/** History should open the production build after promote; previews are deleted. */
export function releaseHistoryHref(row: {
  status: string;
  production_url?: string | null;
  preview_url: string;
}): { href: string; live: boolean } {
  const production = row.production_url?.trim() || '';
  if (row.status === 'succeeded' && production) {
    return { href: production, live: true };
  }
  return { href: row.preview_url, live: false };
}

/** Staff preview URL that skips Vercel Authentication (keeps Deployment Protection on). */
export function withVercelPreviewBypass(url: string, secret: string | null | undefined): string {
  const href = asHttpHref(url);
  const token = secret?.trim();
  if (!href || !token) return href;

  try {
    const parsed = new URL(href);
    parsed.searchParams.set(BYPASS_PARAM, token);
    parsed.searchParams.set(COOKIE_PARAM, 'true');
    return parsed.toString();
  } catch {
    return href;
  }
}
