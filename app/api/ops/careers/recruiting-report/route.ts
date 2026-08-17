import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/ops/activity';
import { htmlToPdf } from '@/lib/ops/html-to-pdf';
import { can, canAny, type StaffRole } from '@/lib/ops/permissions';
import { isTesterCatalogKey, TESTER_JOB_SLUG } from '@/lib/ops/career-disciplines';
import { createAdminClient } from '@/lib/supabase/admin';
import { requestAuditFromHeaders } from '@/lib/ops/request-audit';
import {
  loadRecruitingDossier,
  loadRecruitingPipeline,
  recruitingReportFilename,
  renderRecruitingDossierHtml,
  renderRecruitingPipelineHtml,
} from '@/lib/careers/recruiting-report';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function requireTeamStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, role, active')
    .eq('id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (!staff || !canAny(staff.role as StaffRole, ['team', 'careers_review'])) {
    return { error: NextResponse.json({ error: 'Sin acceso' }, { status: 403 }) };
  }
  return { user, staff };
}

function asDownload(body: string | Uint8Array, filename: string, pdf: boolean) {
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': pdf ? 'application/pdf' : 'text/html; charset=utf-8',
      'Content-Disposition': `${pdf ? 'attachment' : 'inline'}; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  const access = await requireTeamStaff();
  if ('error' in access && access.error) return access.error;
  const user = 'user' in access ? access.user : null;
  const staff = 'staff' in access ? access.staff : null;
  if (!user || !staff) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const testersOnly = !can(staff.role as StaffRole, 'team');

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'pdf' ? 'pdf' : 'html';
  const attemptId = url.searchParams.get('attempt')?.trim() || '';
  const pipeline = url.searchParams.get('pipeline') === '1';
  const jobId = url.searchParams.get('job')?.trim() || '';

  let html: string;
  let filename: string;
  let entityId: string;
  let action: string;

  if (attemptId && /^[0-9a-f-]{36}$/i.test(attemptId)) {
    if (testersOnly) {
      const admin = createAdminClient();
      const { data: attempt } = await admin
        .from('ops_job_assessment_attempts')
        .select('catalog_key')
        .eq('id', attemptId)
        .maybeSingle();
      if (!isTesterCatalogKey(attempt?.catalog_key)) {
        return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
      }
    }
    const dossier = await loadRecruitingDossier(attemptId);
    if (!dossier) return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 });
    html = renderRecruitingDossierHtml(dossier);
    filename = recruitingReportFilename('candidato', dossier.fullName, format);
    entityId = dossier.attemptId;
    action = 'recruiting_report_candidate';
  } else if (pipeline) {
    if (jobId && !/^[0-9a-f-]{36}$/i.test(jobId)) {
      return NextResponse.json({ error: 'Vacante inválida' }, { status: 400 });
    }
    let pipelineJobId = jobId || undefined;
    if (testersOnly) {
      const admin = createAdminClient();
      const { data: testerJob } = await admin
        .from('ops_job_postings')
        .select('id')
        .eq('slug', TESTER_JOB_SLUG)
        .maybeSingle();
      if (jobId && jobId !== testerJob?.id) {
        return NextResponse.json({ error: 'Sin acceso' }, { status: 403 });
      }
      pipelineJobId = testerJob?.id;
    }
    const pack = await loadRecruitingPipeline(pipelineJobId);
    html = renderRecruitingPipelineHtml(pack);
    filename = recruitingReportFilename('pipeline', pack.vacancy, format);
    entityId = pipelineJobId || '00000000-0000-4000-8000-000000000002';
    action = 'recruiting_report_pipeline';
  } else {
    return NextResponse.json({ error: 'Indica attempt o pipeline=1' }, { status: 400 });
  }

  const audit = requestAuditFromHeaders(request.headers);
  await logActivity({
    entityType: 'job_assessment_attempt',
    entityId,
    action,
    metadata: { format, jobId: jobId || null, ip: audit.ip },
    actorId: user.id,
  }).catch(() => {});

  if (format === 'html') return asDownload(html, filename, false);

  try {
    const pdf = await htmlToPdf(html);
    return asDownload(new Uint8Array(pdf), filename, true);
  } catch (err) {
    console.error('[recruiting-report] PDF', err);
    return NextResponse.json(
      { error: 'No se pudo generar el PDF. Abre el HTML o verifica Chrome en el entorno.' },
      { status: 500 }
    );
  }
}
