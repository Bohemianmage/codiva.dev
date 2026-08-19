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

/** Read-only promote status for the client portal. Requests/dispatch are admin/PM only in Ops. */
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
      <div>
        <h3 className="font-semibold text-zinc-900">{t('portal.releases.title')}</h3>
        <p className="mt-1 text-sm text-zinc-600">{t('portal.releases.hint')}</p>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600">
        <li>{t('portal.releases.stepPreview')}</li>
        <li>{t('portal.releases.stepApprove')}</li>
        <li>{t('portal.releases.stepPromote')}</li>
      </ol>

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-zinc-800">{t('portal.releases.history')}</h4>
        {!requests.length ? (
          <p className="text-sm text-zinc-500">{t('portal.releases.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => {
              const statusKey = STATUS_KEYS[r.status] ?? 'pending';
              return (
                <li key={r.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{t(`portal.releases.status.${statusKey}`)}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.commit_message ? (
                    <p className="mt-1 text-zinc-800">{r.commit_message}</p>
                  ) : null}
                  <a
                    href={r.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-codiva-primary hover:underline"
                  >
                    {r.preview_url}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
