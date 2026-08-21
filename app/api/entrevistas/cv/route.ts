import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadActiveInterviewMember } from '@/lib/ops/auth';
import { canAny } from '@/lib/ops/permissions';
import { visibleApplicationIds } from '@/lib/ops/interview-partner';
import { CAREER_CV_BUCKET, isCvPathForJob } from '@/lib/ops/careers';
import { getActiveStaffForApi } from '@/lib/ops/interview-file-access';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const applicationId = new URL(request.url).searchParams.get('id')?.trim() ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sin acceso' }, { status: 401 });

  const staff = await getActiveStaffForApi(supabase, user.id);
  const admin = createAdminClient();
  const { data: application } = await admin
    .from('ops_job_applications')
    .select('id, job_posting_id, cv_storage_path, original_filename, status')
    .eq('id', applicationId)
    .maybeSingle();
  if (!application?.cv_storage_path) {
    return NextResponse.json({ error: 'Postulación no encontrada' }, { status: 404 });
  }

  if (!(staff && canAny(staff, ['team', 'careers_review']))) {
    const loaded = await loadActiveInterviewMember(supabase, user.id);
    if (!loaded) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    const [{ data: assignments }, { data: rounds }] = await Promise.all([
      admin
        .from('ops_interview_assignments')
        .select('round_id, application_id, job_posting_id')
        .eq('member_id', loaded.member.id),
      admin.from('ops_job_interview_rounds').select('id, application_id').eq('application_id', applicationId),
    ]);
    const allowed = visibleApplicationIds(
      assignments ?? [],
      [{ id: application.id, job_posting_id: application.job_posting_id }],
      rounds ?? []
    );
    if (!allowed.includes(application.id)) {
      return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
    }
  }

  if (!isCvPathForJob(application.job_posting_id, application.cv_storage_path)) {
    return NextResponse.json({ error: 'Ruta de CV inválida' }, { status: 400 });
  }

  const { data: file, error } = await admin.storage.from(CAREER_CV_BUCKET).download(application.cv_storage_path);
  if (error || !file) return NextResponse.json({ error: 'No se pudo abrir el CV' }, { status: 500 });

  const filename = String(application.original_filename || 'cv.pdf').replace(/[\r\n"]/g, '').slice(0, 180) || 'cv.pdf';
  const bytes = new Uint8Array(await file.arrayBuffer());
  const asDownload = new URL(request.url).searchParams.get('download') === '1';
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      'Content-Type': file.type && file.type !== 'application/octet-stream' ? file.type : 'application/pdf',
      'Content-Disposition': `${asDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
