import { NextResponse } from 'next/server';
import { requestStaffPasswordReset } from '@/lib/ops/password-reset';
import { reportError } from '@/lib/report-error';

/** POST /api/ops/forgot-password - staff password reset (JSON) */
export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: unknown };
    if (!email) {
      return NextResponse.json({ ok: false, message: 'Email requerido' }, { status: 400 });
    }
    const result = await requestStaffPasswordReset(String(email));
    if (!result.ok && result.code === 'rate_limited') {
      return NextResponse.json(result, { status: 429, headers: { 'Retry-After': '3600' } });
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    reportError(err);
    return NextResponse.json(
      { ok: false, message: 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
