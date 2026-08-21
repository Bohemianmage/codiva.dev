import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadActiveInterviewMember } from '@/lib/ops/auth';
import { canAny } from '@/lib/ops/permissions';
import { INTERVIEW_REPORT_BUCKET, resolveInterviewReportMime, visibleApplicationIds } from '@/lib/ops/interview-partner';
import { getActiveStaffForApi } from '@/lib/ops/interview-file-access';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const reportId = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(reportId)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin acceso' }, { status: 401 });

  const admin = createAdminClient();
  const { data: report } = await admin
    .from('ops_interview_reports')
    .select('id, round_id, storage_path, original_filename')
    .eq('id', reportId)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });

  const { data: round } = await admin
    .from('ops_job_interview_rounds')
    .select('id, application_id')
    .eq('id', report.round_id)
    .maybeSingle();
  if (!round) return NextResponse.json({ error: 'Fase no encontrada' }, { status: 404 });

  const { data: application } = await admin
    .from('ops_job_applications')
    .select('id, job_posting_id')
    .eq('id', round.application_id)
    .maybeSingle();
  if (!application) return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });

  const staff = await getActiveStaffForApi(supabase, user.id);
  if (!(staff && canAny(staff, ['team', 'careers_review']))) {
    const loaded = await loadActiveInterviewMember(supabase, user.id);
    if (!loaded) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    const [{ data: assignments }, { data: rounds }] = await Promise.all([
      admin
        .from('ops_interview_assignments')
        .select('round_id, application_id, job_posting_id')
        .eq('member_id', loaded.member.id),
      admin.from('ops_job_interview_rounds').select('id, application_id').eq('application_id', application.id),
    ]);
    const allowed = visibleApplicationIds(assignments ?? [], [application], rounds ?? []);
    if (!allowed.includes(application.id)) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }
  }

  const { data: file, error } = await admin.storage.from(INTERVIEW_REPORT_BUCKET).download(report.storage_path);
  if (error || !file) return NextResponse.json({ error: 'No se pudo abrir el reporte' }, { status: 500 });
  const filename =
    String(report.original_filename || 'analisis.pdf').replace(/[\r\n"]/g, '').slice(0, 180) || 'analisis.pdf';
  const mime =
    resolveInterviewReportMime({ mimeType: file.type, filename }) ||
    resolveInterviewReportMime({ filename: report.storage_path }) ||
    'application/pdf';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const inline = mime === 'application/pdf';
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
