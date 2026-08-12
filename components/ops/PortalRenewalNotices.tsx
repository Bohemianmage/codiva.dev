import Link from 'next/link';
import {
  chargeNoticeSummary,
  type ActiveChargeNotice,
} from '@/lib/ops/charges';
import { getT } from '@/i18n/locale';

export default async function PortalRenewalNotices({
  slug,
  notices,
}: {
  slug: string;
  notices: ActiveChargeNotice[];
}) {
  if (!notices.length) return null;
  const t = await getT();

  return (
    <section className="space-y-3" aria-label={t('portal.notices.aria')}>
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
            {n.isOverdue ? t('portal.notices.overdue') : t('portal.notices.upcoming')}
          </p>
          <p className="mt-1 font-semibold text-zinc-900">{chargeNoticeSummary(n, t.locale)}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {t('portal.notices.hostingHint')}{' '}
            <Link href={`/p/${slug}/pagos`} className="font-medium text-codiva-primary hover:underline">
              {t('portal.notices.payments')}
            </Link>
            .
          </p>
        </div>
      ))}
    </section>
  );
}
