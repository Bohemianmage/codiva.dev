import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashCareerIp } from '@/lib/ops/careers';
import { isOpsHost, isPortalHost, isTicketHost, marketingBaseUrl } from '@/lib/ops/host';
import {
  huntCookieHostname,
  huntCookieSecure,
  parseHuntCookieHeader,
  serializeHuntCookie,
} from './cookie';

export type HuntEventType = 'page_view' | 'reported';

const BLOCKED_PATH_RE = /^\/(ops|portal|login|p)\b/i;
const API_PATH_RE = /^\/api\b/i;
const PATH_OK_RE = /^\/[a-zA-Z0-9/_-]*$/;
const DEDUPE_MS = 8_000;

export function sanitizeHuntPath(raw: string): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  let path = value;
  try {
    if (value.includes('://') || value.startsWith('//')) {
      path = new URL(value.startsWith('//') ? `https:${value}` : value).pathname;
    }
  } catch {
    path = value.split('?')[0]?.split('#')[0] || '';
  }
  path = path.split('?')[0]?.split('#')[0] || '';
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/').slice(0, 200);
  if (path !== '/' && !PATH_OK_RE.test(path)) return null;
  return path;
}

export function sanitizeHuntHost(raw: string): string {
  return String(raw || '')
    .split(':')[0]
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '')
    .slice(0, 80);
}

export function sanitizeHuntReferrer(raw: string): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  try {
    const url = value.includes('://') ? new URL(value) : new URL(value, `${marketingBaseUrl()}/`);
    const host = sanitizeHuntHost(url.hostname);
    const path = sanitizeHuntPath(url.pathname);
    if (!host || isOpsHost(host) || isPortalHost(host) || isTicketHost(host)) return null;
    return `${host}${path || '/'}`.slice(0, 200);
  } catch {
    return sanitizeHuntPath(value);
  }
}

export function readHuntTokenFromRequest(request: Request, bodyToken?: string): string {
  const fromBody = String(bodyToken || '').trim();
  if (fromBody.length >= 16) return fromBody;
  return parseHuntCookieHeader(request.headers.get('cookie'));
}

export function applyHuntCookie(response: NextResponse, token: string, request: Request): NextResponse {
  if (token.length < 16) return response;
  response.headers.append(
    'Set-Cookie',
    serializeHuntCookie(token, huntCookieHostname(request), huntCookieSecure(request))
  );
  return response;
}

export async function recordHuntEvent(input: {
  attemptId: string;
  eventType: HuntEventType;
  path: string;
  host?: string | null;
  referrer?: string | null;
  payload?: Record<string, unknown>;
  ip?: string | null;
}): Promise<boolean> {
  const path = sanitizeHuntPath(input.path);
  if (!path) return false;
  if (BLOCKED_PATH_RE.test(path)) return false;
  if (
    input.eventType === 'page_view' &&
    API_PATH_RE.test(path) &&
    !path.startsWith('/api/careers/feed')
  ) {
    return false;
  }
  const host = sanitizeHuntHost(input.host || '');
  if (host && (isOpsHost(host) || isPortalHost(host) || isTicketHost(host))) return false;

  const admin = createAdminClient();
  if (input.eventType === 'page_view') {
    const since = new Date(Date.now() - DEDUPE_MS).toISOString();
    const { data: recent } = await admin
      .from('ops_hunt_events')
      .select('id')
      .eq('assessment_attempt_id', input.attemptId)
      .eq('event_type', 'page_view')
      .eq('path', path)
      .gte('created_at', since)
      .limit(1)
      .maybeSingle();
    if (recent?.id) return false;
  }

  const { error } = await admin.from('ops_hunt_events').insert({
    assessment_attempt_id: input.attemptId,
    event_type: input.eventType,
    path,
    host: host || null,
    referrer: input.referrer ? sanitizeHuntReferrer(input.referrer) : null,
    payload: input.payload ?? {},
    ip_hash: hashCareerIp(input.ip),
  });
  if (error) {
    console.error('recordHuntEvent', error);
    return false;
  }
  return true;
}
