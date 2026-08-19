import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isPortalHost, opsBaseUrl, portalBaseUrl } from '@/lib/ops/host';
import { safeInternalPath } from '@/lib/ops/safe-path';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const fallback = isPortalHost(requestUrl.host) ? '/proyectos' : '/dashboard';
  const next = safeInternalPath(requestUrl.searchParams.get('next'), fallback);
  const base = isPortalHost(requestUrl.host) ? portalBaseUrl() : opsBaseUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${next}`);
    }
    console.error('auth callback exchangeCodeForSession:', error.message);
  }

  if (next.startsWith('/p/')) {
    const slug = next.split('/')[2] || '';
    if (slug) {
      return NextResponse.redirect(`${portalBaseUrl()}/p/${slug}/login?error=auth`);
    }
  }

  if (isPortalHost(requestUrl.host)) {
    return NextResponse.redirect(`${portalBaseUrl()}/login?error=auth`);
  }

  return NextResponse.redirect(`${opsBaseUrl()}/login?error=auth`);
}
