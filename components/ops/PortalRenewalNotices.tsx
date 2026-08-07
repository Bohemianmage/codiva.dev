import Link from 'next/link';
import {
  chargeNoticeSummary,
  type ActiveChargeNotice,
} from '@/lib/ops/charges';

export default function PortalRenewalNotices({
  slug,
  notices,
}: {
  slug: string;
  notices: ActiveChargeNotice[];
}) {
  if (!notices.length) return null;

  return (
    <section className="space-y-3" aria-label="Avisos de renovación y vencimiento">
      {notices.map((n) => (
        <div
          key={n.id}
          className={`rounded-2xl border px-5 py-4 ${
            n.isOverdue || n.daysUntilDue <= 7
              ? 'border-amber-300 bg-amber-50'
              : 'border-sky-200 bg-sky-50'
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            {n.isOverdue ? 'Vencido' : `Aviso T-${n.noticeDays}`}
          </p>
          <p className="mt-1 font-semibold text-zinc-900">{chargeNoticeSummary(n)}</p>
          <p className="mt-1 text-sm text-zinc-600">
            Alojamiento y renovaciones van a cargo del cliente. Revisa el detalle en{' '}
            <Link href={`/p/${slug}/pagos`} className="font-medium text-codiva-primary hover:underline">
              Pagos
            </Link>
            .
          </p>
        </div>
      ))}
    </section>
  );
}
