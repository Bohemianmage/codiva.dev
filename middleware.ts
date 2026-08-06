import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import {
  isOpsHost,
  isPortalHost,
  opsBaseUrl,
  portalBaseUrl,
  marketingBaseUrl,
} from '@/lib/ops/host';

function withSessionCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
  return to;
}

/** Packs comerciales / internos: no servir en portal del cliente. */
const STAFF_ONLY_CLIENT_PACKS = [
  '/client-packs/nirc/mvp-fase1.html',
  '/client-packs/nirc/nirc-arquitectura-completa.html',
  '/client-packs/nirc/mvp-propuesta-fase1.md',
];

function isStaffOnlyClientPack(pathname: string) {
  return STAFF_ONLY_CLIENT_PACKS.some((p) => pathname === p || pathname.endsWith(p));
}

function absoluteRedirect(request: NextRequest, base: string, path: string) {
  const url = new URL(path, base.endsWith('/') ? base : `${base}/`);
  // Preserve query string
  request.nextUrl.searchParams.forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const { pathname } = request.nextUrl;
  const sessionResponse = await updateSession(request);

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return sessionResponse;
  }

  const onOps = isOpsHost(host);
  const onPortal = isPortalHost(host);

  // --- PORTAL (clientes) ---
  if (onPortal) {
    // Estáticos / legales / auth callback
    if (
      pathname.startsWith('/client-packs') ||
      pathname.startsWith('/legal') ||
      pathname.startsWith('/auth/')
    ) {
      if (isStaffOnlyClientPack(pathname)) {
        const missing = request.nextUrl.clone();
        missing.pathname = '/ops/__missing';
        return withSessionCookies(sessionResponse, NextResponse.rewrite(missing));
      }
      if (pathname.startsWith('/auth/')) {
        const url = request.nextUrl.clone();
        url.pathname = `/ops${pathname}`;
        return withSessionCookies(sessionResponse, NextResponse.rewrite(url));
      }
      return sessionResponse;
    }

    // Raíz: mensaje → marketing
    if (pathname === '/' || pathname === '') {
      return withSessionCookies(
        sessionResponse,
        absoluteRedirect(request, marketingBaseUrl(), '/')
      );
    }

    // Solo rutas de portal de proyecto
    if (pathname.startsWith('/p/')) {
      const url = request.nextUrl.clone();
      url.pathname = `/ops${pathname}`;
      return withSessionCookies(sessionResponse, NextResponse.rewrite(url));
    }

    // Staff / partners no viven aquí
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/projects') ||
      pathname.startsWith('/leads') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/partner') ||
      pathname.startsWith('/q/')
    ) {
      return withSessionCookies(
        sessionResponse,
        absoluteRedirect(request, opsBaseUrl(), pathname)
      );
    }

    // Rutas desconocidas en portal → 404 (bajo árbol /ops)
    const missing = request.nextUrl.clone();
    missing.pathname = '/ops/__missing';
    return withSessionCookies(sessionResponse, NextResponse.rewrite(missing));
  }

  // --- OPS (staff) ---
  if (onOps) {
    // Cliente debe usar portal.*; redirigir /p/* hacia portal
    // Excepción: ?preview=1 o header interno - usamos cookie/session en ops
    // Mantenemos /p/* en ops SOLO como vista previa staff (misma sesión).
    // Los emails de cliente apuntan a portal.*.

    if (pathname.startsWith('/client-packs') || pathname.startsWith('/legal')) {
      return sessionResponse;
    }

    if (!pathname.startsWith('/ops')) {
      const url = request.nextUrl.clone();
      if (pathname === '/') {
        url.pathname = '/ops/dashboard';
      } else {
        url.pathname = `/ops${pathname}`;
      }
      return withSessionCookies(sessionResponse, NextResponse.rewrite(url));
    }

    return sessionResponse;
  }

  // --- MARKETING ---
  if (pathname.startsWith('/ops')) {
    return withSessionCookies(
      sessionResponse,
      absoluteRedirect(request, marketingBaseUrl(), '/')
    );
  }

  // Atajos legacy: /p/* en apex → portal
  if (pathname.startsWith('/p/')) {
    return withSessionCookies(
      sessionResponse,
      absoluteRedirect(request, portalBaseUrl(), pathname)
    );
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
