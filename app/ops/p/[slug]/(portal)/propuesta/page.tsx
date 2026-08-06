import Link from 'next/link';
import PortalCanvasViewer from '@/components/ops/PortalCanvasViewer';
import { requireProjectMember } from '@/lib/ops/auth';
import { formatCurrency, formatDate } from '@/lib/ops/labels';
import { filterClientCanvases, getPortalVisibility } from '@/lib/ops/portal-visibility';

export default async function PortalProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);
  const visibility = getPortalVisibility(project);

  const [{ data: canvases }, { data: quotes }] = await Promise.all([
    supabase
      .from('deliverables')
      .select('id, title, description, kind, url, file_url, sort_order')
      .eq('project_id', project.id)
      .eq('visible_to_client', true)
      .in('kind', ['architecture', 'mvp', 'proposal'])
      .order('sort_order', { ascending: true }),
    visibility.showQuote
      ? supabase
          .from('quotes')
          .select('id, title, total_amount, currency, status, valid_until, version')
          .eq('project_id', project.id)
          .eq('visible_to_client', true)
          .in('status', ['sent', 'accepted', 'rejected', 'expired'])
          .order('version', { ascending: false })
          .limit(1)
      : Promise.resolve({ data: [] as { id: string; title: string; total_amount: number; currency: string; status: string; valid_until: string | null; version: number }[] }),
  ]);

  const quote = quotes?.[0];
  const visibleCanvases = filterClientCanvases(canvases ?? [], visibility);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold">
          {visibility.showCosts ? 'Propuesta y arquitectura' : 'Arquitectura'}
        </h2>
        <p className="mb-5 text-sm text-zinc-600">
          {visibility.showCosts
            ? 'Vista canvas interactiva de arquitectura y MVP. El PDF, si existe, se descarga desde el canvas (no sustituye esta vista).'
            : 'Vista canvas de arquitectura y flujos. Los materiales comerciales se publican cuando el proyecto lo habilite.'}
        </p>
        <PortalCanvasViewer items={visibleCanvases} />
      </section>

      {visibility.showQuote && quote && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cotización</p>
              <h3 className="font-semibold text-zinc-900">{quote.title}</h3>
              <p className="mt-1 text-2xl font-bold text-codiva-primary">
                {formatCurrency(quote.total_amount, quote.currency)}
              </p>
              {quote.valid_until && (
                <p className="text-sm text-zinc-500">Válida hasta {formatDate(quote.valid_until)}</p>
              )}
            </div>
            <Link
              href={`/p/${slug}/cotizacion`}
              className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Ver cotización completa
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">Siguiente paso</p>
        <p className="mt-1">
          Completa las solicitudes en{' '}
          <Link href={`/p/${slug}/documentos`} className="text-codiva-primary hover:underline">
            Documentos
          </Link>
          {' '}
          (NDA firmado por representante legal, brandbook y accesos).
        </p>
      </section>
    </div>
  );
}
