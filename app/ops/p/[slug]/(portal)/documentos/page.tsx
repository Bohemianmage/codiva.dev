import PortalDocumentRequests from '@/components/ops/PortalDocumentRequests';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { clientFulfillDocumentRequest } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { mutualNdaPath } from '@/lib/ops/legal/mutual-nda';
import { isLegacyNdaDraftDocument, opsFileHref } from '@/lib/ops/storage';
import { isLegacyQuotePackDocument } from '@/lib/ops/quotes';

export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);
  const t = await getT();
  const { DOCUMENT_SOURCE_LABELS, DOCUMENT_TYPE_LABELS, formatDate } = labelsFor(t.locale);

  const [{ data: documents }, { data: orgDocuments }, { data: requests }, { data: organization }] =
    await Promise.all([
      supabase
        .from('documents')
        .select('id, type, title, file_path, file_url, signed, source, uploaded_at')
        .eq('project_id', project.id)
        .eq('visible_to_client', true)
        .is('disposed_at', null)
        .order('uploaded_at', { ascending: false }),
      project.organization_id
        ? supabase
            .from('documents')
            .select('id, type, title, file_path, file_url, signed, source, uploaded_at')
            .eq('organization_id', project.organization_id)
            .eq('visible_to_client', true)
            .is('disposed_at', null)
            .order('uploaded_at', { ascending: false })
        : Promise.resolve({ data: [] as never[] }),
      supabase
        .from('document_requests')
        .select(
          'id, title, description, instructions, expected_type, input_mode, status, required, sort_order, due_date, fulfilled_at, response_text, fulfilled_document_id, code'
        )
        .eq('project_id', project.id)
        .eq('visible_to_client', true)
        .order('sort_order', { ascending: true }),
      project.organization_id
        ? supabase
            .from('organizations')
            .select('name, mutual_nda_document_id, mutual_nda_signed_at')
            .eq('id', project.organization_id)
            .maybeSingle()
        : Promise.resolve({
            data: null as {
              name: string;
              mutual_nda_document_id: string | null;
              mutual_nda_signed_at: string | null;
            } | null,
          }),
    ]);

  const mergedDocs = [
    ...(documents ?? []),
    ...(orgDocuments ?? []).filter((d) => !(documents ?? []).some((p) => p.id === d.id)),
  ].filter((d) => !isLegacyQuotePackDocument(d) && !isLegacyNdaDraftDocument(d));

  const shared = mergedDocs.filter((d) => d.source !== 'client');
  const signedNdas = shared.filter((d) => d.type === 'nda' && d.signed);
  const materials = shared.filter((d) => d.type !== 'nda' || d.signed);
  const inbound = mergedDocs.filter((d) => d.source === 'client');
  const clientName = organization?.name?.trim() || project.name;
  const liveNdaHref = mutualNdaPath(slug);
  const liveNdaTitle = t('portal.docs.liveNda', { client: clientName });
  const orgHasSignedNda = Boolean(organization?.mutual_nda_document_id || signedNdas.length);

  // Si la org ya firmó, no mostrar solicitudes NDA abiertas de este proyecto.
  const visibleRequests = (requests ?? []).filter(
    (r) => !(orgHasSignedNda && r.expected_type === 'nda' && r.status === 'open')
  );

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
    .filter((d) => d.type !== 'nda')
    .map((d) => {
      const href = hrefFor(d);
      if (!href) return null;
      return { type: d.type, title: d.title, href };
    })
    .filter((t): t is { type: string; title: string; href: string } => Boolean(t));

  if (!orgHasSignedNda) {
    templates.unshift({ type: 'nda', title: liveNdaTitle, href: liveNdaHref });
  } else if (signedNdas[0]) {
    const href = hrefFor(signedNdas[0]);
    if (href) templates.unshift({ type: 'nda', title: signedNdas[0].title, href });
  }

  return (
    <div className="space-y-10">
      <PortalDocumentRequests
        requests={visibleRequests}
        templates={templates}
        fulfillAction={onFulfill}
      />

      <section>
        <h2 className="mb-1 text-lg font-semibold">{t('portal.docs.materialsTitle')}</h2>
        <p className="mb-4 text-sm text-zinc-600">{t('portal.docs.materialsHint')}</p>
        <ul className="space-y-3">
          {materials.map((d) => {
            const href = hrefFor(d);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-zinc-500">
                    {DOCUMENT_TYPE_LABELS[d.type] ?? d.type}
                    {d.signed ? ` · ${t('portal.docs.signed')}` : ''}
                    {' · '}
                    {DOCUMENT_SOURCE_LABELS[d.source] ?? d.source}
                    {' · '}
                    {formatDate(d.uploaded_at)}
                  </p>
                </div>
                {href ? (
                  <a href={href} className="text-codiva-primary hover:underline" target="_blank" rel="noreferrer">
                    {t('portal.docs.download')}
                  </a>
                ) : null}
              </li>
            );
          })}
          {!materials.length && <p className="text-sm text-zinc-500">{t('portal.docs.empty')}</p>}
        </ul>
      </section>

      {inbound.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">{t('portal.docs.uploads')}</h2>
          <ul className="space-y-3">
            {inbound.map((d) => {
              const href = hrefFor(d);
              return (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-zinc-500">{formatDate(d.uploaded_at)}</p>
                  </div>
                  {href ? (
                    <a href={href} className="text-codiva-primary hover:underline" target="_blank" rel="noreferrer">
                      {t('portal.docs.view')}
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
