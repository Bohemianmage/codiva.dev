import { NextResponse } from 'next/server';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';

type RateBucket = { count: number; resetAt: number };

const rateBuckets = new Map<string, RateBucket>();

function pruneRateBuckets() {
  if (rateBuckets.size < 5000) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt < now) rateBuckets.delete(k);
  }
}

export type RateLimitOk = { ok: true; remaining: number };
export type RateLimitBlocked = { ok: false; retryAfterMs: number };
export type RateLimitResult = RateLimitOk | RateLimitBlocked;

export function consumeRateLimit(key: string, windowMs: number, max: number): RateLimitResult {
  pruneRateBuckets();
  const now = Date.now();
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count <= max) return { ok: true, remaining: max - bucket.count };
  return { ok: false, retryAfterMs: Math.max(0, bucket.resetAt - now) };
}

export function clientIpFromRequest(request: Request): string {
  return requestAuditFromHeaders(request.headers).ip || 'unknown';
}

export function consumeIpRateLimit(
  request: Request,
  prefix: string,
  windowMs: number,
  max: number
): RateLimitResult {
  return consumeRateLimit(`${prefix}:${clientIpFromRequest(request)}`, windowMs, max);
}

export function rateLimitJsonResponse(
  retryAfterMs: number,
  body: Record<string, unknown> = { error: 'rate_limited' }
) {
  return NextResponse.json(body, {
    status: 429,
    headers: { 'Retry-After': String(Math.max(1, Math.ceil(retryAfterMs / 1000))) },
  });
}

/** Formularios públicos (contacto, cotiza, partner, ticket). */
export const PUBLIC_RL_FORM = {
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.PUBLIC_RL_FORM_PER_IP_HOUR || 8),
};

export const PUBLIC_RL_FORM_EMAIL = {
  windowMs: 24 * 60 * 60 * 1000,
  max: Number(process.env.PUBLIC_RL_FORM_PER_EMAIL_DAY || 5),
};

/** Feed de cacería: ráfagas cortas sí, barrido no. */
export const PUBLIC_RL_FEED = {
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.PUBLIC_RL_FEED_PER_IP_5MIN || 40),
};

/** Recuperación de contraseña (staff y portal). */
export const PUBLIC_RL_AUTH = {
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.PUBLIC_RL_AUTH_PER_IP_HOUR || 5),
  emailWindowMs: 60 * 60 * 1000,
  emailMax: Number(process.env.PUBLIC_RL_AUTH_PER_EMAIL_HOUR || 3),
};

/** Cambio de contraseña con sesión iniciada (perfil ops). */
export const STAFF_RL_PASSWORD_CHANGE = {
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.STAFF_RL_PASSWORD_CHANGE_PER_15MIN || 8),
};
