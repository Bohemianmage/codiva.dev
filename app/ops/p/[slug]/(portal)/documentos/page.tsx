import PortalDocumentRequests from '@/components/ops/PortalDocumentRequests';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { clientFulfillDocumentRequest } from '@/lib/ops/actions';
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_TYPE_LABELS, formatDate } from '@/lib/ops/labels';
import { opsFileHref } from '@/lib/ops/storage';

export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);

  const [{ data: documents }, { data: requests }] = await Promise.all([
    supabase
      .from('documents')
      .select('*')
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
  ]);

  const shared = (documents ?? []).filter((d) => d.source !== 'client');
  const inbound = (documents ?? []).filter((d) => d.source === 'client');

  async function onFulfill(formData: FormData) {
    'use server';
    await clientFulfillDocumentRequest(project.id, slug, formData);
  }

  function hrefFor(d: { id: string; file_path: string | null; file_url: string | null }) {
    const base = opsFileHref(d.file_path, d.file_url);
    if (!base) return null;
    if (base.startsWith('/api/ops/file')) {
      return `${base}&documentId=${encodeURIComponent(d.id)}`;
    }
    return base;
  }

  return (
    <div className="space-y-10">
      <PortalDocumentRequests requests={requests ?? []} fulfillAction={onFulfill} />

      <section>
        <h2 className="mb-1 text-lg font-semibold">Materiales de Codiva</h2>
        <p className="mb-4 text-sm text-zinc-600">
          NDA, contratos y archivos que compartimos contigo. La arquitectura interactiva está en
          Propuesta.
        </p>
        <ul className="space-y-3">
          {shared.map((d) => {
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
                  {d.notes && <p className="mt-1 text-zinc-600">{d.notes}</p>}
                </div>
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                    Ver / descargar
                  </a>
                )}
              </li>
            );
          })}
          {!shared.length && <p className="text-sm text-zinc-500">Sin materiales compartidos aún.</p>}
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
