const ANALYTICS = 'https://va.vercel-scripts.com https://vitals.vercel-insights.com';
const SENTRY = 'https://*.ingest.sentry.io https://*.sentry.io';
const SUPABASE = 'https://*.supabase.co wss://*.supabase.co';
const VERCEL_LIVE = 'https://vercel.live';

const SAME_ORIGIN_EMBED_PATHS = [
  '/api/ops/careers/cv',
  '/api/ops/careers/recruiting-report',
] as const;

export function contentSecurityPolicy(
  isDev: boolean,
  options: { frameAncestors?: 'none' | 'self' } = {}
) {
  const scriptEval = isDev ? " 'unsafe-eval'" : '';
  const frameAncestors =
    options.frameAncestors === 'self' ? "frame-ancestors 'self'" : "frame-ancestors 'none'";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptEval} ${ANALYTICS} ${VERCEL_LIVE}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${SUPABASE} ${ANALYTICS} ${SENTRY} ${VERCEL_LIVE} https://*.codiva.dev`,
    `frame-src 'self' blob: https: ${VERCEL_LIVE}`,
    frameAncestors,
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; ');
}

function baseSecurityHeaders(
  isDev: boolean,
  frame: 'deny' | 'sameorigin'
): { key: string; value: string }[] {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: frame === 'sameorigin' ? 'SAMEORIGIN' : 'DENY' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    {
      key: 'Content-Security-Policy',
      value: contentSecurityPolicy(isDev, {
        frameAncestors: frame === 'sameorigin' ? 'self' : 'none',
      }),
    },
  ];
}

export function securityHeaders(isDev = process.env.NODE_ENV !== 'production') {
  return baseSecurityHeaders(isDev, 'deny');
}

export function sameOriginEmbedHeaders(isDev = process.env.NODE_ENV !== 'production') {
  return baseSecurityHeaders(isDev, 'sameorigin');
}

export function nextSecurityHeaderSources(isDev = process.env.NODE_ENV !== 'production') {
  const excluded = SAME_ORIGIN_EMBED_PATHS.map((path) => `${path.replace(/^\//, '')}$`).join('|');
  return [
    {
      source: `/((?!${excluded}).*)`,
      headers: securityHeaders(isDev),
    },
    ...SAME_ORIGIN_EMBED_PATHS.map((source) => ({
      source,
      headers: sameOriginEmbedHeaders(isDev),
    })),
  ];
}
