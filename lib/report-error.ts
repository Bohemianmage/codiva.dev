export function reportError(error: unknown) {
  console.error(error);
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;
  if (!dsn) return;
  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureException(error);
    })
    .catch(() => undefined);
}
