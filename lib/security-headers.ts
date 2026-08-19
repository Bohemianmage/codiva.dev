const ANALYTICS = 'https://va.vercel-scripts.com https://vitals.vercel-insights.com';
const SENTRY = 'https://*.ingest.sentry.io https://*.sentry.io';
const SUPABASE = 'https://*.supabase.co wss://*.supabase.co';
const VERCEL_LIVE = 'https://vercel.live';

export function contentSecurityPolicy(isDev: boolean) {
  const scriptEval = isDev ? " 'unsafe-eval'" : '';
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptEval} ${ANALYTICS} ${VERCEL_LIVE}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${SUPABASE} ${ANALYTICS} ${SENTRY} ${VERCEL_LIVE} https://*.codiva.dev`,
    `frame-src 'self' blob: https: ${VERCEL_LIVE}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export function securityHeaders(isDev = process.env.NODE_ENV !== 'production') {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(isDev) },
  ];
}
