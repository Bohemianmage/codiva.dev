import StatusBadge from '@/components/ops/StatusBadge';
import ToastForm from '@/components/ops/ToastForm';
import { getT } from '@/i18n/locale';
import { requireStaff } from '@/lib/ops/auth';
import {
  acceptAndPromoteIncoming,
  approveReleaseRequest,
  cancelReleaseRequest,
  createReleaseRequestAsStaff,
  dispatchReleasePromote,
  loadIncomingPreviews,
  markReleaseSucceededManually,
  upsertReleaseSettings,
  releasesTokenConfigured,
  vercelTokenConfigured,
  type ReleaseRequestRow,
  type ReleaseSettingsRow,
} from '@/lib/ops/releases/actions';

const STATUS_KEYS: Record<string, string> = {
  pending_approval: 'pending',
  approved: 'approved',
  dispatching: 'dispatching',
  succeeded: 'succeeded',
  failed: 'failed',
  cancelled: 'cancelled',
};

function ciTone(state: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (state === 'success') return 'success';
  if (state === 'pending') return 'warning';
  if (state === 'failure' || state === 'error') return 'danger';
  return 'neutral';
}

function releaseStatusTone(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (status === 'succeeded') return 'success';
  if (status === 'pending_approval' || status === 'dispatching') return 'warning';
  if (status === 'approved') return 'info';
  if (status === 'failed' || status === 'cancelled') return 'danger';
  return 'neutral';
}

export default async function OpsProjectReleases({
  projectId,
  sitePreviewUrl,
  siteProductionUrl,
  settings,
  requests,
}: {
  projectId: string;
  sitePreviewUrl: string | null;
  siteProductionUrl: string | null;
  settings: ReleaseSettingsRow | null;
  requests: ReleaseRequestRow[];
}) {
  const t = await getT();
  const { staff } = await requireStaff();
  const canManage = staff.role === 'admin' || staff.role === 'pm';
  const githubOk = releasesTokenConfigured();
  const vercelOk = vercelTokenConfigured();
  const incoming = await loadIncomingPreviews(settings);
  const settingsOpen = !settings?.enabled;
  const setupPending = [
    { ok: githubOk, label: t('ops.releases.setupGithubToken') },
    { ok: vercelOk, label: t('ops.releases.setupVercelToken') },
    { ok: Boolean(settings?.enabled), label: t('ops.releases.setupEnabled') },
    {
      ok: Boolean(settings?.github_owner && settings?.github_repo),
      label: t('ops.releases.setupGithubRepo'),
    },
    { ok: Boolean(settings?.vercel_project_id), label: t('ops.releases.setupVercelProject') },
  ].filter((item) => !item.ok);

  const flowSteps = [
    t('ops.releases.flowCi'),
    t('ops.releases.flowPreview'),
    t('ops.releases.flowQa'),
    t('ops.releases.flowProd'),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">{t('ops.releases.title')}</h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">{t('ops.releases.hint')}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge
              label={t('ops.releases.githubShort')}
              tone={githubOk ? 'success' : 'warning'}
            />
            <StatusBadge
              label={t('ops.releases.vercelShort')}
              tone={vercelOk ? 'success' : 'warning'}
            />
          </div>
        </div>

        {!canManage ? (
          <p className="text-xs text-zinc-500">{t('ops.releases.adminPmOnly')}</p>
        ) : null}

        {setupPending.length ? (
          <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <li className="font-medium">{t('ops.releases.setupTitle')}</li>
            {setupPending.map((item) => (
              <li key={item.label}>• {item.label}</li>
            ))}
          </ul>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('ops.releases.pipelineTitle')}
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
            {flowSteps.map((step, index) => (
              <li
                key={step}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700"
              >
                <span className="mb-1 block text-[11px] font-semibold text-zinc-400">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {canManage ? (
          <details
            className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-4"
            open={settingsOpen || undefined}
          >
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
              {t('ops.releases.settingsToggle')}
            </summary>
            <ToastForm
              success={t('ops.releases.settingsSaved')}
              action={async (fd) => {
                'use server';
                await upsertReleaseSettings(projectId, fd);
              }}
              className="mt-4 space-y-3"
            >
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="enabled" defaultChecked={settings?.enabled ?? false} />
                {t('ops.releases.enable')}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.githubOwner')}</span>
                  <input
                    name="githubOwner"
                    defaultValue={settings?.github_owner ?? ''}
                    placeholder="Codiva-dev"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.githubRepo')}</span>
                  <input
                    name="githubRepo"
                    defaultValue={settings?.github_repo ?? ''}
                    placeholder="nirc"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.vercelProjectId')}</span>
                  <input
                    name="vercelProjectId"
                    defaultValue={settings?.vercel_project_id ?? ''}
                    placeholder="prj_…"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.vercelTeamId')}</span>
                  <input
                    name="vercelTeamId"
                    defaultValue={settings?.vercel_team_id ?? ''}
                    placeholder="codiva-dev"
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.workflow')}</span>
                  <input
                    name="promoteWorkflow"
                    defaultValue={settings?.promote_workflow ?? 'promote-production.yml'}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-zinc-700">{t('ops.releases.ref')}</span>
                  <input
                    name="promoteRef"
                    defaultValue={settings?.promote_ref ?? 'main'}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block space-y-1 text-sm sm:col-span-2">
                  <span className="font-medium text-zinc-700">{t('ops.releases.inputName')}</span>
                  <input
                    name="deploymentUrlInput"
                    defaultValue={settings?.deployment_url_input ?? 'deployment_url'}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="requireStaffApproval"
                  defaultChecked={settings?.require_staff_approval ?? true}
                />
                {t('ops.releases.requireStaffApproval')}
              </label>
              <textarea
                name="notes"
                defaultValue={settings?.notes ?? ''}
                placeholder={t('ops.releases.notesPlaceholder')}
                rows={2}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
                {t('ops.releases.saveSettings')}
              </button>
            </ToastForm>
          </details>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">{t('ops.releases.incomingTitle')}</h3>
            <p className="mt-1 text-sm text-zinc-600">{t('ops.releases.incomingHint')}</p>
          </div>
          {incoming.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {incoming.error}
            </p>
          ) : null}
          {incoming.hint === 'disabled' ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              {t('ops.releases.incomingDisabled')}
            </p>
          ) : null}
          {incoming.hint === 'misconfigured' ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              {t('ops.releases.incomingMisconfigured')}
            </p>
          ) : null}
          {!incoming.items.length && !incoming.error && !incoming.hint ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
              {t('ops.releases.incomingEmpty')}
            </p>
          ) : null}
          {incoming.items.length ? (
            <ul className="space-y-3">
              {incoming.items.map((item) => {
                const ciState = item.ci?.state ?? 'unknown';
                const confirmMessage =
                  ciState === 'failure' || ciState === 'error'
                    ? t('ops.releases.promoteConfirmCiFailed')
                    : ciState === 'pending'
                      ? t('ops.releases.promoteConfirmCiPending')
                      : t('ops.releases.promoteConfirm');
                return (
                  <li
                    key={`${item.source}-${item.deploymentId ?? item.previewUrl}`}
                    className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-zinc-900">
                            {item.message || t('ops.releases.untitledCommit')}
                          </p>
                          {item.ci?.url ? (
                            <a href={item.ci.url} target="_blank" rel="noreferrer">
                              <StatusBadge label={t(`ops.releases.ci.${ciState}`)} tone={ciTone(ciState)} />
                            </a>
                          ) : (
                            <StatusBadge label={t(`ops.releases.ci.${ciState}`)} tone={ciTone(ciState)} />
                          )}
                        </div>
                        <p className="text-xs text-zinc-500">
                          {[item.author, item.sha ? item.sha.slice(0, 7) : null, item.branch]
                            .filter(Boolean)
                            .join(' · ')}
                          {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={item.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                        >
                          {t('ops.releases.openPreview')}
                        </a>
                        {canManage ? (
                          <ToastForm
                            success={t('ops.releases.promoted')}
                            confirmTitle={t('ops.releases.promoteConfirmTitle')}
                            confirmMessage={confirmMessage}
                            confirmLabel={t('ops.releases.promoteNow')}
                            confirmTone="primary"
                            action={async (fd) => {
                              'use server';
                              await acceptAndPromoteIncoming(projectId, fd);
                            }}
                          >
                            <input type="hidden" name="previewUrl" value={item.previewUrl} />
                            <input type="hidden" name="productionUrl" value={siteProductionUrl ?? ''} />
                            <input type="hidden" name="deploymentId" value={item.deploymentId ?? ''} />
                            <input type="hidden" name="sha" value={item.sha ?? ''} />
                            <input type="hidden" name="message" value={item.message ?? ''} />
                            <button
                              type="submit"
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                            >
                              {t('ops.releases.promoteNow')}
                            </button>
                          </ToastForm>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

      {canManage && settings?.enabled ? (
        <details className="rounded-2xl border border-zinc-200 bg-white p-5">
          <summary className="cursor-pointer font-semibold text-zinc-900">
            {t('ops.releases.manualUrl')}
          </summary>
          <ToastForm
            success={t('ops.releases.requestCreated')}
            action={async (fd) => {
              'use server';
              await createReleaseRequestAsStaff(projectId, fd);
            }}
            className="mt-4 space-y-3"
          >
            <input
              name="previewUrl"
              type="url"
              required
              defaultValue={sitePreviewUrl ?? ''}
              placeholder="https://….vercel.app"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <input
              name="productionUrl"
              type="url"
              defaultValue={siteProductionUrl ?? ''}
              placeholder={t('ops.releases.productionOptional')}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <textarea
              name="notes"
              rows={2}
              placeholder={t('ops.releases.requestNotes')}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              {t('ops.releases.createRequest')}
            </button>
          </ToastForm>
        </details>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900">{t('ops.releases.history')}</h3>
        {!requests.length ? (
          <p className="text-sm text-zinc-500">{t('ops.releases.emptyHistory')}</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => {
              const statusKey = STATUS_KEYS[r.status] ?? 'pending';
              return (
                <li key={r.id} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusBadge
                      label={t(`ops.releases.status.${statusKey}`)}
                      tone={releaseStatusTone(r.status)}
                    />
                    <span className="text-xs text-zinc-500">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.commit_message ? <p className="font-medium text-zinc-900">{r.commit_message}</p> : null}
                  {r.commit_sha ? (
                    <p className="text-xs text-zinc-500">{r.commit_sha.slice(0, 7)}</p>
                  ) : null}
                  <a
                    href={r.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-codiva-primary hover:underline"
                  >
                    {r.preview_url}
                  </a>
                  {r.error_message ? (
                    <p className="text-xs text-red-700 whitespace-pre-wrap">{r.error_message}</p>
                  ) : null}
                  {r.github_run_url ? (
                    <a
                      href={r.github_run_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-codiva-primary hover:underline"
                    >
                      {t('ops.releases.viewWorkflow')}
                    </a>
                  ) : null}
                  {canManage ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {r.status === 'pending_approval' ? (
                        <ToastForm
                          success={t('ops.releases.approved')}
                          action={async () => {
                            'use server';
                            await approveReleaseRequest(r.id, projectId);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs text-white"
                          >
                            {t('ops.releases.approve')}
                          </button>
                        </ToastForm>
                      ) : null}
                      {r.status === 'approved' || r.status === 'failed' ? (
                        <ToastForm
                          success={t('ops.releases.dispatched')}
                          action={async () => {
                            'use server';
                            await dispatchReleasePromote(r.id, projectId);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md bg-codiva-primary px-3 py-1.5 text-xs text-white"
                          >
                            {t('ops.releases.promote')}
                          </button>
                        </ToastForm>
                      ) : null}
                      {['pending_approval', 'approved', 'failed'].includes(r.status) ? (
                        <>
                          <ToastForm
                            success={t('ops.releases.cancelled')}
                            action={async () => {
                              'use server';
                              await cancelReleaseRequest(r.id, projectId);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
                            >
                              {t('ops.releases.cancel')}
                            </button>
                          </ToastForm>
                          <ToastForm
                            success={t('ops.releases.manualOk')}
                            action={async () => {
                              'use server';
                              await markReleaseSucceededManually(r.id, projectId);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
                            >
                              {t('ops.releases.markManual')}
                            </button>
                          </ToastForm>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
