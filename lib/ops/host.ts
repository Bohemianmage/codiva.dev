const OPS_HOSTS = new Set([
  'ops.codiva.dev',
  'ops.localhost',
]);

const PORTAL_HOSTS = new Set([
  'portal.codiva.dev',
  'portal.localhost',
]);

export type CodivaSurface = 'marketing' | 'ops' | 'portal';

export function getHostname(host: string | null): string {
  return (host ?? '').split(':')[0].toLowerCase();
}

function envHost(name: string, fallback: string): string {
  return (process.env[name] ?? fallback).split(':')[0].toLowerCase();
}

export function isOpsHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (OPS_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('ops.')) return true;
  return hostname === envHost('OPS_HOST', 'ops.codiva.dev');
}

export function isPortalHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (PORTAL_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('portal.')) return true;
  return hostname === envHost('PORTAL_HOST', 'portal.codiva.dev');
}

export function resolveSurface(host: string | null): CodivaSurface {
  if (isPortalHost(host)) return 'portal';
  if (isOpsHost(host)) return 'ops';
  return 'marketing';
}

export function opsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_OPS_URL ?? 'https://ops.codiva.dev').replace(/\/$/, '');
}

export function portalBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.codiva.dev').replace(/\/$/, '');
}

export function marketingBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://codiva.dev').replace(/\/$/, '');
}

/** Login del cliente (host portal, multi-proyecto). */
export function portalLoginUrl(path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${portalBaseUrl()}/login${suffix}`;
}

/** Home “Mis proyectos” del cliente. */
export function portalHomeUrl(): string {
  return `${portalBaseUrl()}/proyectos`;
}

/** URL absoluta al portal de un proyecto (host portal - clientes). */
export function projectPortalUrl(slug: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${portalBaseUrl()}/p/${slug}${suffix}`;
}

/** Etiqueta corta para UI staff (sin protocolo). */
export function projectPortalShortLabel(slug: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `portal/p/${slug}${suffix}`;
}

/**
 * Vista previa staff: path relativo en ops (misma cookie de sesión).
 * No usar portal.* para preview staff - la sesión no se comparte entre hosts.
 */
export function staffPortalPreviewPath(slug: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `/p/${slug}${suffix}`;
}
