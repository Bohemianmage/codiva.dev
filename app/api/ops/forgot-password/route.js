import { NextResponse } from 'next/server';
import { requestStaffPasswordReset } from '@/lib/ops/password-reset';

/** POST /api/ops/forgot-password — staff password reset (JSON) */
export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ ok: false, message: 'Email requerido' }, { status: 400 });
    }
    const result = await requestStaffPasswordReset(String(email));
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error('POST /api/ops/forgot-password:', err);
    return NextResponse.json(
      { ok: false, message: 'Error interno al procesar solicitud' },
      { status: 500 }
    );
  }
}
