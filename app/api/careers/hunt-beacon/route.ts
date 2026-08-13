import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import {
  CAREER_RL_HUNT_BEACON,
  careerRateLimitConsume,
  safeCareerStr,
} from '@/lib/ops/careers';
import { loadAttemptByToken } from '@/lib/careers/assessments/server';
import { huntRequiredForCatalog } from '@/lib/careers/hunt/seeds';
import {
  applyHuntCookie,
  readHuntTokenFromRequest,
  recordHuntEvent,
  sanitizeHuntHost,
  sanitizeHuntPath,
} from '@/lib/careers/hunt/events';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  const ip = audit.ip || 'unknown';
  const rl = careerRateLimitConsume(
    `career_hunt_beacon:${ip}`,
    CAREER_RL_HUNT_BEACON.windowMs,
    CAREER_RL_HUNT_BEACON.max
  );
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 204 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const token = readHuntTokenFromRequest(request, safeCareerStr(body.token, 80));
  if (token.length < 16) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const attempt = await loadAttemptByToken(token);
  if (
    !attempt ||
    attempt.status !== 'completed' ||
    !attempt.passed ||
    !huntRequiredForCatalog(attempt.catalog_key)
  ) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }

  const path = sanitizeHuntPath(safeCareerStr(body.path, 200));
  if (!path) {
    return NextResponse.json({ ok: false }, { status: 204 });
  }
  const host =
    sanitizeHuntHost(safeCareerStr(body.host, 80)) ||
    sanitizeHuntHost(request.headers.get('x-forwarded-host') || request.headers.get('host') || '');

  await recordHuntEvent({
    attemptId: attempt.id,
    eventType: 'page_view',
    path,
    host,
    referrer: safeCareerStr(body.referrer, 500),
    ip: audit.ip,
  });

  return applyHuntCookie(NextResponse.json({ ok: true }), token, request);
}
