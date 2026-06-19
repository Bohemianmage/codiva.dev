import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { opsBaseUrl } from '@/lib/ops/host';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  const base = opsBaseUrl().replace(/\/$/, '');
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${base}${safeNext}`);
    }
    console.error('auth callback exchangeCodeForSession:', error.message);
  }

  return NextResponse.redirect(`${base}/login?error=auth`);
}
