import StatusBadge from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { clientAcceptQuote, clientRejectQuote } from '@/lib/ops/actions';
import { QUOTE_STATUS_LABELS, formatCurrency, formatDate } from '@/lib/ops/labels';

export default async function PortalQuotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('project_id', project.id)
    .in('status', ['sent', 'accepted', 'rejected', 'expired'])
    .order('version', { ascending: false });

  const active = quotes?.[0];

  async function onAccept(formData: FormData) {
    'use server';
    const quoteId = String(formData.get('quoteId'));
    await clientAcceptQuote(quoteId, project.id);
  }

  async function onReject(formData: FormData) {
    'use server';
    const quoteId = String(formData.get('quoteId'));
    await clientRejectQuote(quoteId, project.id);
  }

  if (!active) {
    return <p className="text-sm text-zinc-500">No hay cotización disponible en este momento.</p>;
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{active.title}</h2>
        <StatusBadge
          label={QUOTE_STATUS_LABELS[active.status]}
          tone={active.status === 'accepted' ? 'success' : active.status === 'rejected' ? 'danger' : 'info'}
        />
      </div>
      <p className="text-2xl font-bold text-codiva-primary">{formatCurrency(active.total_amount, active.currency)}</p>
      {active.valid_until && (
        <p className="mt-1 text-sm text-zinc-500">Válida hasta {formatDate(active.valid_until)}</p>
      )}
      <div className="mt-6 whitespace-pre-wrap text-sm text-zinc-700">{active.scope}</div>

      {active.status === 'sent' && (
        <div className="mt-8 flex gap-3">
          <form action={onAccept}>
            <input type="hidden" name="quoteId" value={active.id} />
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
              Aceptar propuesta
            </button>
          </form>
          <form action={onReject}>
            <input type="hidden" name="quoteId" value={active.id} />
            <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium">
              Rechazar
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
