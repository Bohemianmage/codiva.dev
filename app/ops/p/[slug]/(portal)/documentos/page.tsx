import PortalDocumentRequests from '@/components/ops/PortalDocumentRequests';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { clientFulfillDocumentRequest } from '@/lib/ops/actions';
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_TYPE_LABELS, formatDate } from '@/lib/ops/labels';
import { mutualNdaPath } from '@/lib/ops/legal/mutual-nda';
import { opsFileHref } from '@/lib/ops/storage';

export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);

  const [{ data: documents }, { data: requests }, { data: organization }] = await Promise.all([
    supabase
      .from('documents')
      .select('id, type, title, file_path, file_url, signed, source, uploaded_at')
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .is('disposed_at', null)
      .order('uploaded_at', { ascending: false }),
    supabase
      .from('document_requests')
      .select(
        'id, title, description, instructions, expected_type, input_mode, status, required, sort_order, due_date, fulfilled_at, response_text, fulfilled_document_id'
      )
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .order('sort_order', { ascending: true }),
    project.organization_id
      ? supabase
          .from('organizations')
          .select('name')
          .eq('id', project.organization_id)
          .maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
  ]);

  const shared = (documents ?? []).filter((d) => d.source !== 'client');
  const materials = shared.filter((d) => d.type !== 'nda');
  const inbound = (documents ?? []).filter((d) => d.source === 'client');
  const clientName = organization?.name?.trim() || project.name;
  const liveNdaHref = mutualNdaPath(slug);
  const liveNdaTitle = `NDA mutuo - borrador Codiva × ${clientName}`;

  async function onFulfill(formData: FormData) {
    'use server';
    await clientFulfillDocumentRequest(project.id, slug, formData);
  }

  function hrefFor(d: { id: string; type: string; file_path: string | null; file_url: string | null }) {
    const base = opsFileHref(d.file_path, d.file_url);
    if (!base) return null;
    if (base.startsWith('/api/ops/file')) {
      return `${base}&documentId=${encodeURIComponent(d.id)}`;
    }
    return base;
  }

  const templates = materials
    .map((d) => {
      const href = hrefFor(d);
      if (!href) return null;
      return { type: d.type, title: d.title, href };
    })
    .filter((t): t is { type: string; title: string; href: string } => Boolean(t));

  // NDA vive solo en la solicitud (borrador generado), no en Materiales.
  if ((requests ?? []).some((r) => r.expected_type === 'nda')) {
    templates.unshift({ type: 'nda', title: liveNdaTitle, href: liveNdaHref });
  }

  return (
    <div className="space-y-10">
      <PortalDocumentRequests
        requests={requests ?? []}
        templates={templates}
        fulfillAction={onFulfill}
      />

      <section>
        <h2 className="mb-1 text-lg font-semibold">Materiales de Codiva</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Contratos y archivos que compartimos contigo. El NDA se descarga desde su solicitud. La
          arquitectura interactiva está en Propuesta.
        </p>
        <ul className="space-y-3">
          {materials.map((d) => {
            const href = hrefFor(d);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-zinc-500">
                    {DOCUMENT_TYPE_LABELS[d.type] ?? d.type}
                    {d.signed ? ' · Firmado' : ''}
                    {' · '}
                    {formatDate(d.uploaded_at)}
                  </p>
                </div>
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                    Ver / descargar
                  </a>
                )}
              </li>
            );
          })}
          {!materials.length && <p className="text-sm text-zinc-500">Sin materiales compartidos aún.</p>}
        </ul>
      </section>

      {inbound.length > 0 && (
        <section>
          <h2 className="mb-1 text-lg font-semibold">Tus archivos enviados</h2>
          <p className="mb-4 text-sm text-zinc-600">Historial de archivos ligados a solicitudes.</p>
          <ul className="space-y-3">
            {inbound.map((d) => {
              const href = hrefFor(d);
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-zinc-500">
                      {DOCUMENT_TYPE_LABELS[d.type] ?? d.type} ·{' '}
                      {DOCUMENT_SOURCE_LABELS[d.source] ?? d.source}
                      {d.signed ? ' · Firmado' : ''}
                      {' · '}
                      {formatDate(d.uploaded_at)}
                    </p>
                  </div>
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                      Ver
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
