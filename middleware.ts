import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isOpsHost } from '@/lib/ops/host';

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host');
  const ops = isOpsHost(host);
  const { pathname } = request.nextUrl;

  const sessionResponse = await updateSession(request);

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return sessionResponse;
  }

  if (!ops && pathname.startsWith('/ops')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (ops && !pathname.startsWith('/ops')) {
    const url = request.nextUrl.clone();
    if (pathname === '/') {
      url.pathname = '/ops/dashboard';
    } else {
      url.pathname = `/ops${pathname}`;
    }
    const rewrite = NextResponse.rewrite(url);
    sessionResponse.cookies.getAll().forEach((c) => {
      rewrite.cookies.set(c.name, c.value);
    });
    return rewrite;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
