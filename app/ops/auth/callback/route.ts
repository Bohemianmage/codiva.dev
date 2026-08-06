import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { opsBaseUrl, portalBaseUrl } from '@/lib/ops/host';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const safeNext = next.startsWith('/') ? next : '/dashboard';
  const isPortalNext = safeNext.startsWith('/p/');
  const base = isPortalNext ? portalBaseUrl() : opsBaseUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${safeNext}`);
    }
    console.error('auth callback exchangeCodeForSession:', error.message);
  }

  if (isPortalNext) {
    const slug = safeNext.split('/')[2] || '';
    return NextResponse.redirect(
      `${portalBaseUrl()}/p/${slug}/login?error=auth`
    );
  }

  return NextResponse.redirect(`${opsBaseUrl()}/login?error=auth`);
}
