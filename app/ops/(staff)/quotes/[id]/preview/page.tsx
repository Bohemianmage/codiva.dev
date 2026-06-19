import Link from 'next/link';
import { notFound } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { buildQuoteDocumentHtml } from '@/lib/ops/quote-preview';
import { QUOTE_STATUS_LABELS } from '@/lib/ops/labels';

export default async function QuotePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireStaff();

  const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).single();
  if (!quote) notFound();

  let backHref = '/leads';
  let backLabel = 'Volver a leads';
  let lead = null;
  let project = null;

  if (quote.lead_id) {
    const { data } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single();
    lead = data;
    backHref = `/leads/${quote.lead_id}?tab=cotizaciones`;
    backLabel = 'Volver al lead';
  } else if (quote.project_id) {
    const { data } = await supabase
      .from('projects')
      .select('name, organizations(name, contact_email)')
      .eq('id', quote.project_id)
      .single();
    if (data) {
      const org = data.organizations as { name?: string; contact_email?: string } | { name?: string; contact_email?: string }[] | null;
      project = {
        name: data.name,
        organizations: Array.isArray(org) ? org[0] ?? null : org,
      };
    }
    backHref = `/projects/${quote.project_id}?tab=cotizaciones`;
    backLabel = 'Volver al proyecto';
  }

  const html = buildQuoteDocumentHtml(quote, { lead, project });
  const isDraft = quote.status === 'draft';

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <OpsPageHeader
        title={`Vista previa · ${quote.title}`}
        description={`Versión ${quote.version}`}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge
              label={QUOTE_STATUS_LABELS[quote.status] || quote.status}
              tone={quote.status === 'accepted' ? 'success' : isDraft ? 'warning' : 'info'}
            />
            <Link
              href={backHref}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              {backLabel}
            </Link>
          </div>
        }
      />

      {isDraft && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Borrador — así se verá la propuesta antes de enviarla.
        </p>
      )}

      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
        <iframe
          title="Vista previa cotización"
          srcDoc={html}
          className="h-[min(80vh,900px)] w-full border-0"
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
