import { NextResponse } from 'next/server';
import { PUBLIC_RL_FEED, consumeIpRateLimit, rateLimitJsonResponse } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * Plantas de cacería (backend / full stack / seguridad): contrato, cabeceras y
 * filtración deliberadamente mal. No usar este feed como fuente real de vacantes.
 * Las claves y cookies aquí son semillas, no secretos reales.
 */
export async function GET(request: Request) {
  const rl = consumeIpRateLimit(request, 'public_feed', PUBLIC_RL_FEED.windowMs, PUBLIC_RL_FEED.max);
  if (!rl.ok) return rateLimitJsonResponse(rl.retryAfterMs);

  const body = JSON.stringify({
    ok: true,
    enviroment: 'proudction',
    generated_at: '2024-01-01T00:00:00.000Z',
    debug_api_key: 'cdv_hunt_not_a_secret',
    jobs: [],
  });

  const response = new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Powered-By': 'Express',
    },
  });
  response.cookies.set('codiva_debug_session', 'hunt-seed', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: false,
  });
  return response;
}
