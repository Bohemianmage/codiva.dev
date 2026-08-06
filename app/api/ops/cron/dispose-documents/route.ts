import { NextResponse } from 'next/server';
import { disposeExpiredDocuments } from '@/lib/ops/document-ingest';
import { logActivity } from '@/lib/ops/activity';

/**
 * Cron de retención. Proteger con CRON_SECRET.
 * Ejemplo Vercel Cron: GET /api/ops/cron/dispose-documents
 * Header: Authorization: Bearer $CRON_SECRET
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await disposeExpiredDocuments(200);
  await logActivity({
    entityType: 'system',
    entityId: '00000000-0000-4000-8000-000000000001',
    action: 'retention_disposal_cron',
    metadata: { disposed: result.disposed },
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: Request) {
  return GET(request);
}
