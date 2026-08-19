import CopyableUrl from '@/components/ops/CopyableUrl';
import StatusBadge from '@/components/ops/StatusBadge';
import { getT } from '@/i18n/locale';
import type { ReleaseRequestRow, ReleaseSettingsRow } from '@/lib/ops/releases/actions';

const STATUS_KEYS: Record<string, string> = {
  pending_approval: 'pending',
  approved: 'approved',
  dispatching: 'dispatching',
  succeeded: 'succeeded',
  failed: 'failed',
  cancelled: 'cancelled',
};

function tone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (status === 'succeeded') return 'success';
  if (status === 'pending_approval' || status === 'dispatching') return 'warning';
  if (status === 'approved') return 'info';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'neutral';
}

/** Read-only promote history for the client portal. */
export default async function PortalReleasesPanel({
  settings,
  requests,
}: {
  settings: ReleaseSettingsRow | null;
  requests: ReleaseRequestRow[];
}) {
  const t = await getT();
  if (!settings?.enabled) return null;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
      <h3 className="font-semibold text-zinc-900">{t('portal.releases.title')}</h3>
      {!requests.length ? (
        <p className="text-sm text-zinc-500">{t('portal.releases.empty')}</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => {
            const statusKey = STATUS_KEYS[r.status] ?? 'pending';
            return (
              <li key={r.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge label={t(`portal.releases.status.${statusKey}`)} tone={tone(r.status)} />
                  <span className="text-xs text-zinc-500">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
                {r.commit_message ? (
                  <p className="mt-2 font-medium text-zinc-900">{r.commit_message}</p>
                ) : null}
                <div className="mt-1">
                  <CopyableUrl href={r.preview_url} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
