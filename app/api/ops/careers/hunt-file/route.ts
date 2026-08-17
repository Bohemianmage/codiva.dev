import { NextResponse } from 'next/server';
import { requireCareersReview } from '@/lib/ops/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { HUNT_EVIDENCE_BUCKET, isHuntEvidencePath } from '@/lib/careers/hunt/evidence';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get('id')?.trim() ?? '';
  const index = Number(searchParams.get('n') || 0);
  if (!/^[0-9a-f-]{36}$/i.test(reportId) || !Number.isInteger(index) || index < 0 || index > 8) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  await requireCareersReview();
  const admin = createAdminClient();
  const { data: report } = await admin
    .from('ops_hunt_reports')
    .select('id, evidence_paths')
    .eq('id', reportId)
    .maybeSingle();

  const paths = Array.isArray(report?.evidence_paths) ? report.evidence_paths.map(String) : [];
  const path = paths[index];
  if (!path || !isHuntEvidencePath(path)) {
    return NextResponse.json({ error: 'Evidencia no encontrada' }, { status: 404 });
  }

  const { data: signed, error } = await admin.storage.from(HUNT_EVIDENCE_BUCKET).createSignedUrl(path, 60 * 5);
  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: 'No se pudo firmar la evidencia' }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
