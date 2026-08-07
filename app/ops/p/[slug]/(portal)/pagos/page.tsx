import Link from 'next/link';
import { redirect } from 'next/navigation';
import PortalRenewalNotices from '@/components/ops/PortalRenewalNotices';
import StatusBadge, { chargeTone } from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { chargeAmountNumber, getActiveChargeNotices } from '@/lib/ops/charges';
import {
  CHARGE_KIND_LABELS,
  CHARGE_STATUS_LABELS,
  formatChargeAmount,
  formatDate,
  isClientBorneChargeKind,
} from '@/lib/ops/labels';
import { getPortalVisibility } from '@/lib/ops/portal-visibility';

export default async function PortalPaymentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);
  const visibility = getPortalVisibility(project);

  if (!visibility.showCosts) {
    redirect(`/p/${slug}`);
  }

  const { data: charges } = await supabase
    .from('project_charges')
    .select(
      'id, kind, title, description, amount, currency, status, due_date, paid_at, period_label, notice_days'
    )
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order', { ascending: true });

  const rows = charges ?? [];
  const pending = rows.filter((c) => c.status === 'pending' || c.status === 'overdue');
  const paid = rows.filter((c) => c.status === 'paid');
  const notices = getActiveChargeNotices(rows);

  const pendingTotal = pending.reduce((sum, c) => sum + (chargeAmountNumber(c.amount) ?? 0), 0);
  const paidTotal = paid.reduce((sum, c) => sum + (chargeAmountNumber(c.amount) ?? 0), 0);
  const hasTbd = pending.some((c) => chargeAmountNumber(c.amount) == null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Resumen de pagos de tu proyecto: lo ya cubierto del desarrollo, lo que falta por pagar y el
        alojamiento del sitio. El hosting lo pagas tú (nosotros te avisamos y te pasamos el monto
        cuando toque renovar). Para ver el alcance aprobado, entra a{' '}
        <Link href={`/p/${slug}/cotizacion`} className="text-codiva-primary hover:underline">
          Cotización
        </Link>
        .
      </p>

      <PortalRenewalNotices slug={slug} notices={notices} />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pagado</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {formatChargeAmount(paidTotal, 'MXN')}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{paid.length} cargo(s)</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pendiente</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {formatChargeAmount(pendingTotal, 'MXN')}
            {hasTbd ? <span className="ml-2 text-sm font-medium">(+ TBD)</span> : null}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{pending.length} cargo(s)</p>
        </div>
      </section>

      {!rows.length ? (
        <p className="text-sm text-zinc-500">Aún no hay cargos publicados en este portal.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((c) => {
            const noticeDays = c.notice_days ?? 30;
            const noticeStart =
              c.due_date && (c.status === 'pending' || c.status === 'overdue')
                ? (() => {
                    const due = new Date(`${c.due_date.slice(0, 10)}T00:00:00Z`);
                    due.setUTCDate(due.getUTCDate() - noticeDays);
                    return due.toISOString().slice(0, 10);
                  })()
                : null;

            return (
              <li key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusBadge label={CHARGE_STATUS_LABELS[c.status]} tone={chargeTone(c.status)} />
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {CHARGE_KIND_LABELS[c.kind] ?? c.kind}
                      </span>
                    {isClientBorneChargeKind(c.kind) && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        A tu cargo
                      </span>
                    )}
                    </div>
                    <h3 className="font-semibold text-zinc-900">{c.title}</h3>
                    {c.period_label && (
                      <p className="mt-0.5 text-xs text-zinc-500">Periodo: {c.period_label}</p>
                    )}
                    {c.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{c.description}</p>
                    )}
                    <p className="mt-2 text-xs text-zinc-500">
                      {c.status === 'paid'
                        ? `Pagado ${formatDate(c.paid_at)}`
                        : c.due_date
                          ? `Vence ${formatDate(c.due_date)}`
                          : 'Sin fecha de vencimiento'}
                    </p>
                    {noticeStart && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Te avisamos en el portal desde {formatDate(noticeStart)}
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-bold text-codiva-primary">
                    {formatChargeAmount(chargeAmountNumber(c.amount), c.currency)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
