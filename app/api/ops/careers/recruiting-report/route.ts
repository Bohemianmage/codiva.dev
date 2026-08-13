import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { htmlToPdf } from '@/lib/ops/html-to-pdf';
import { can, type StaffRole } from '@/lib/ops/permissions';
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
  if (!staff || !can(staff.role as StaffRole, 'team')) {
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
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

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
    const pack = await loadRecruitingPipeline(jobId || undefined);
    html = renderRecruitingPipelineHtml(pack);
    filename = recruitingReportFilename('pipeline', pack.vacancy, format);
    entityId = jobId || '00000000-0000-4000-8000-000000000002';
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
