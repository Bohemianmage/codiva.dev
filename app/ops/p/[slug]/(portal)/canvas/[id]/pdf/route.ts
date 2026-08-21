import { NextResponse } from 'next/server';
import { requirePortalAccess } from '@/lib/ops/auth';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { architecturePdfFilename, resolveArchitectureHtml } from '@/lib/ops/architecture';
import { htmlToPdf } from '@/lib/ops/html-to-pdf';
import { opsFileHref } from '@/lib/ops/storage';

export const runtime = 'nodejs';
export const maxDuration = 60;

type RouteContext = { params: Promise<{ slug: string; id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { slug, id } = await context.params;
  const access = await requirePortalAccess(slug);

  if (!access.isStaffPreview) {
    const status = getAcceptanceStatus(access.membership);
    if (!status.complete) {
      return new NextResponse('Acepta los documentos legales para ver este material.', { status: 403 });
    }
  }

  const { data: deliverable } = await access.supabase
    .from('deliverables')
    .select('id, title, kind, url, file_url, file_path, body_html, visible_to_client, project_id')
    .eq('id', id)
    .eq('project_id', access.project.id)
    .maybeSingle();

  if (!deliverable) {
    return new NextResponse('Canvas no encontrado', { status: 404 });
  }

  if (!access.isStaffPreview && !deliverable.visible_to_client) {
    return new NextResponse('Canvas no publicado', { status: 403 });
  }

  const { html, source } = await resolveArchitectureHtml(deliverable);
  const fileHref = opsFileHref(deliverable.file_path, deliverable.file_url);
  if (source === 'starter' && fileHref) {
    return NextResponse.redirect(new URL(fileHref, request.url));
  }

  try {
    const pdf = await htmlToPdf(html);
    const filename = architecturePdfFilename(deliverable.title);
    const body = new Uint8Array(pdf.byteLength);
    body.set(pdf);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[canvas-pdf] PDF generation failed', err);
    return new NextResponse('No se pudo generar el PDF.', { status: 500 });
  }
}
