const OPS_HOSTS = new Set([
  'ops.codiva.dev',
  'ops.localhost',
  'ops.localhost:3000',
]);

export function getHostname(host: string | null): string {
  return (host ?? '').split(':')[0].toLowerCase();
}

export function isOpsHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (OPS_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('ops.')) return true;
  const opsHost = process.env.OPS_HOST ?? 'ops.codiva.dev';
  return hostname === opsHost.split(':')[0].toLowerCase();
}

export function opsBaseUrl(): string {
  return process.env.NEXT_PUBLIC_OPS_URL ?? 'https://ops.codiva.dev';
}

export function marketingBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://codiva.dev';
}
