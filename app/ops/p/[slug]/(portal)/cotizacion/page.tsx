import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import { redirect } from 'next/navigation';
import StatusBadge from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { clientAcceptQuote, clientRejectQuote } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { parseLineItemsJson } from '@/lib/ops/quote-document';
import { getPortalVisibility } from '@/lib/ops/portal-visibility';

type QuotePhase = {
  name?: string;
  weeks?: string;
  deliverable?: string;
};

function parsePhases(value: unknown): QuotePhase[] {
  if (!Array.isArray(value)) return [];
  return value.filter((p): p is QuotePhase => Boolean(p) && typeof p === 'object');
}

export default async function PortalQuotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);
  const t = await getT();
  const { QUOTE_STATUS_LABELS, formatCurrency, formatDate } = labelsFor(t.locale);
  const visibility = getPortalVisibility(project);

  if (!visibility.showQuote) {
    redirect(`/p/${slug}`);
  }

  const { data: quotes } = await supabase
    .from('quotes')
    .select(
      'id, title, status, total_amount, currency, valid_until, service_type, scope, line_items, phases, deliverables, considerations, optional_extras'
    )
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .in('status', ['sent', 'accepted', 'rejected', 'expired'])
    .order('version', { ascending: false });

  const active =
    quotes?.find((q) => q.status === 'accepted') ??
    quotes?.find((q) => q.status === 'sent') ??
    quotes?.[0];
  const otherQuotes = (quotes ?? []).filter((q) => q.id !== active?.id);

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
    return <p className="text-sm text-zinc-500">{t('portal.quote.empty')}</p>;
  }

  const lineItems = parseLineItemsJson(active.line_items);
  const phases = parsePhases(active.phases);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        {t('portal.quote.introPrefix')}{' '}
        <Link href={`/p/${slug}/propuesta`} className="text-codiva-primary hover:underline">
          {t('portal.quote.proposalLink')}
        </Link>
        {visibility.showCosts ? (
          <>
            {t('portal.quote.introCosts')}{' '}
            <Link href={`/p/${slug}/pagos`} className="text-codiva-primary hover:underline">
              {t('portal.quote.paymentsLink')}
            </Link>
          </>
        ) : null}
        .
      </p>
      <article className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{active.title}</h2>
          <StatusBadge
            label={QUOTE_STATUS_LABELS[active.status]}
            tone={
              active.status === 'accepted'
                ? 'success'
                : active.status === 'rejected'
                  ? 'danger'
                  : 'info'
            }
          />
        </div>
        <p className="text-2xl font-bold text-codiva-primary">
          {formatCurrency(active.total_amount, active.currency)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">{t('portal.quote.devOnly')}</p>
        {active.valid_until && active.status !== 'accepted' && (
          <p className="mt-1 text-sm text-zinc-500">
            {t('portal.quote.validUntil', { date: formatDate(active.valid_until) })}
          </p>
        )}
        {active.service_type && (
          <p className="mt-2 text-sm text-zinc-500">{t('portal.quote.type', { type: active.service_type })}</p>
        )}

        <div className="mt-6 space-y-6 text-sm text-zinc-700">
          {active.scope && (
            <div>
              <h3 className="mb-1 font-semibold text-zinc-900">{t('portal.quote.scope')}</h3>
              <div className="whitespace-pre-wrap">{active.scope}</div>
            </div>
          )}

          {lineItems.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-zinc-900">{t('portal.quote.modules')}</h3>
              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('portal.quote.concept')}</th>
                      <th className="px-3 py-2 font-medium">%</th>
                      <th className="px-3 py-2 font-medium text-right">{t('portal.quote.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={`${item.title}-${idx}`} className="border-t border-zinc-100">
                        <td className="px-3 py-3">
                          <p className="font-medium text-zinc-900">{item.title}</p>
                          {item.detail && <p className="mt-0.5 text-zinc-500">{item.detail}</p>}
                        </td>
                        <td className="px-3 py-3 text-zinc-600">{item.rateLabel ?? '-'}</td>
                        <td className="px-3 py-3 text-right font-semibold text-codiva-primary">
                          {formatCurrency(item.total, active.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-zinc-200 bg-zinc-50">
                      <td className="px-3 py-3 font-semibold" colSpan={2}>
                        {t('portal.quote.totalDev')}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-codiva-primary">
                        {formatCurrency(active.total_amount, active.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {phases.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold text-zinc-900">{t('portal.quote.plan')}</h3>
              <ul className="space-y-2">
                {phases.map((phase, idx) => (
                  <li
                    key={`${phase.name ?? 'phase'}-${idx}`}
                    className="rounded-xl border border-zinc-200 px-3 py-2"
                  >
                    <p className="font-medium text-zinc-900">
                      {phase.name}
                      {phase.weeks ? (
                        <span className="ml-2 text-xs font-normal text-zinc-500">
                          {t('portal.quote.weeks', { weeks: phase.weeks })}
                        </span>
                      ) : null}
                    </p>
                    {phase.deliverable && (
                      <p className="mt-0.5 text-zinc-600">{phase.deliverable}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {active.deliverables && (
            <div>
              <h3 className="mb-1 font-semibold text-zinc-900">{t('portal.quote.deliverables')}</h3>
              <div className="whitespace-pre-wrap">{active.deliverables}</div>
            </div>
          )}
          {active.considerations && (
            <div>
              <h3 className="mb-1 font-semibold text-zinc-900">{t('portal.quote.considerations')}</h3>
              <div className="whitespace-pre-wrap">{active.considerations}</div>
            </div>
          )}
          {active.optional_extras && (
            <div>
              <h3 className="mb-1 font-semibold text-zinc-900">{t('portal.quote.extras')}</h3>
              <div className="whitespace-pre-wrap">{active.optional_extras}</div>
            </div>
          )}
        </div>

        {active.status === 'sent' && (
          <div className="mt-8 flex flex-wrap gap-3">
            <ToastForm success={t('portal.quote.accepted')} action={onAccept}>
              <input type="hidden" name="quoteId" value={active.id} />
              <button
                type="submit"
                className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white"
              >
                {t('portal.quote.accept')}
              </button>
            </ToastForm>
            <ToastForm success={t('portal.quote.rejected')} action={onReject}>
              <input type="hidden" name="quoteId" value={active.id} />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
              >
                {t('portal.quote.reject')}
              </button>
            </ToastForm>
          </div>
        )}
      </article>

      {otherQuotes.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-900">{t('portal.quote.other')}</h3>
          {otherQuotes.map((q) => (
            <article key={q.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={QUOTE_STATUS_LABELS[q.status]}
                      tone={
                        q.status === 'accepted'
                          ? 'success'
                          : q.status === 'rejected'
                            ? 'danger'
                            : 'info'
                      }
                    />
                    {q.service_type && (
                      <span className="text-xs uppercase tracking-wide text-zinc-500">
                        {q.service_type}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-zinc-900">{q.title}</h4>
                  {q.scope && (
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-zinc-600">
                      {q.scope}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-codiva-primary">
                  {formatCurrency(q.total_amount, q.currency)}
                </p>
              </div>
              {q.status === 'sent' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <ToastForm success={t('portal.quote.accepted')} action={onAccept}>
                    <input type="hidden" name="quoteId" value={q.id} />
                    <button
                      type="submit"
                      className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      {t('portal.quote.acceptShort')}
                    </button>
                  </ToastForm>
                  <ToastForm success={t('portal.quote.rejected')} action={onReject}>
                    <input type="hidden" name="quoteId" value={q.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium"
                    >
                      {t('portal.quote.reject')}
                    </button>
                  </ToastForm>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
