const OPS_HOSTS = new Set([
  'ops.codiva.dev',
  'ops.localhost',
]);

const PORTAL_HOSTS = new Set([
  'portal.codiva.dev',
  'portal.localhost',
]);

const CAREER_HOSTS = new Set([
  'career.codiva.dev',
  'career.localhost',
]);

const TICKET_HOSTS = new Set([
  'ticket.codiva.dev',
  'ticket.localhost',
]);

const INTERVIEWS_HOSTS = new Set([
  'interviews.codiva.dev',
  'interviews.localhost',
]);

export type CodivaSurface = 'marketing' | 'ops' | 'portal' | 'career' | 'ticket' | 'interviews';

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

export function isCareerHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (CAREER_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('career.')) return true;
  return hostname === envHost('CAREER_HOST', 'career.codiva.dev');
}

export function isTicketHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (TICKET_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('ticket.')) return true;
  return hostname === envHost('TICKET_HOST', 'ticket.codiva.dev');
}

export function isInterviewsHost(host: string | null): boolean {
  const hostname = getHostname(host);
  if (INTERVIEWS_HOSTS.has(hostname)) return true;
  if (hostname.startsWith('interviews.')) return true;
  return hostname === envHost('INTERVIEWS_HOST', 'interviews.codiva.dev');
}

export function resolveSurface(host: string | null): CodivaSurface {
  if (isInterviewsHost(host)) return 'interviews';
  if (isPortalHost(host)) return 'portal';
  if (isOpsHost(host)) return 'ops';
  if (isCareerHost(host)) return 'career';
  if (isTicketHost(host)) return 'ticket';
  return 'marketing';
}

export function opsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_OPS_URL ?? 'https://ops.codiva.dev').replace(/\/$/, '');
}

/** Login staff (host ops). */
export function opsLoginUrl(path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${opsBaseUrl()}/login${suffix}`;
}

export function portalBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.codiva.dev').replace(/\/$/, '');
}

export function marketingBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'https://codiva.dev').replace(/\/$/, '');
}

/** Bolsa de trabajo pública (host career). */
export function careerBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_CAREER_URL ?? 'https://career.codiva.dev').replace(/\/$/, '');
}

export function careerHostName(): string {
  try {
    return new URL(careerBaseUrl()).hostname;
  } catch {
    return 'career.codiva.dev';
  }
}

/**
 * Path interno de la bolsa según el host.
 * En career.* las URLs públicas no llevan /empleos (rewrite en middleware).
 * En apex/local sí: /empleos, /empleos/{slug}, ...
 */
export function careerAppHref(host: string | null, path = '/'): string {
  const trimmed = (path || '/').trim();
  const rest =
    trimmed === '/' || trimmed === ''
      ? ''
      : trimmed.startsWith('/')
        ? trimmed
        : `/${trimmed}`;
  if (isCareerHost(host)) return rest || '/';
  return `/empleos${rest}`;
}

/** Formulario público de tickets (host ticket). */
export function ticketBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_TICKET_URL ?? 'https://ticket.codiva.dev').replace(/\/$/, '');
}

/** Portal de entrevistas para terceros (host interviews). */
export function interviewsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_INTERVIEWS_URL ?? 'https://interviews.codiva.dev').replace(/\/$/, '');
}

export function interviewsLoginUrl(path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${interviewsBaseUrl()}/login${suffix}`;
}

export function interviewsHomeUrl(): string {
  return interviewsBaseUrl();
}

export function interviewsApplicationUrl(applicationId: string): string {
  return `${interviewsBaseUrl()}/${applicationId}`;
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

/** href http(s) usable: agrega https si pegaron solo el host. */
export function asHttpHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Etiqueta de uso: host + path, sin protocolo (lo que se copia/comparte). */
export function usageUrlLabel(url: string): string {
  const href = asHttpHref(url);
  try {
    const parsed = new URL(href);
    const path = parsed.pathname.replace(/\/+$/, '');
    const rest = `${path === '/' ? '' : path}${parsed.search}${parsed.hash}`;
    return `${parsed.host}${rest}`;
  } catch {
    return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  }
}

/** URL absoluta al portal de un proyecto (host portal - clientes). */
export function projectPortalUrl(slug: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `${portalBaseUrl()}/p/${slug}${suffix}`;
}

/** Etiqueta de uso para UI staff: portal.codiva.dev/p/{slug}. */
export function projectPortalShortLabel(slug: string, path = ''): string {
  return usageUrlLabel(projectPortalUrl(slug, path));
}

/**
 * Vista previa staff: path relativo en ops (misma cookie de sesión).
 * No usar portal.* para preview staff - la sesión no se comparte entre hosts.
 */
export function staffPortalPreviewPath(slug: string, path = ''): string {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `/p/${slug}${suffix}`;
}
