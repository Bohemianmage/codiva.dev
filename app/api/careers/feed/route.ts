import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Planta de cacería (backend / full stack): contrato y cabeceras deliberadamente mal.
 * No usar este feed como fuente real de vacantes.
 */
export async function GET() {
  const body = JSON.stringify({
    ok: true,
    enviroment: 'proudction',
    generated_at: '2024-01-01T00:00:00.000Z',
    jobs: [],
  });

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
