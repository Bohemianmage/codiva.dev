import CopyableUrl from '@/components/ops/CopyableUrl';
import StatusBadge from '@/components/ops/StatusBadge';
import ToastForm from '@/components/ops/ToastForm';
import { getT } from '@/i18n/locale';
import { usageUrlLabel } from '@/lib/ops/host';
import { requireStaff } from '@/lib/ops/auth';
import { withVercelPreviewBypass } from '@/lib/ops/releases/preview-url';
import {
  acceptAndPromoteIncoming,
  approveReleaseRequest,
  cancelReleaseRequest,
  decideGithubPull,
  dispatchReleasePromote,
  loadIncomingPreviews,
  markReleaseSucceededManually,
  upsertReleaseSettings,
  releasesTokenConfigured,
  vercelTokenConfigured,
  type ReleaseRequestRow,
  type ReleaseSettingsRow,
} from '@/lib/ops/releases/actions';
import type { GitHubPull } from '@/lib/ops/releases/github';

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

function PullDecisions({
  projectId,
  pull,
  labels,
}: {
  projectId: string;
  pull: GitHubPull;
  labels: {
    open: string;
    merge: string;
    reject: string;
    mergeTitle: string;
    mergeConfirm: string;
    rejectTitle: string;
    rejectConfirm: string;
    merged: string;
    rejected: string;
  };
}) {
  return (
    <>
      <a
        href={pull.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
      >
        {labels.open}
      </a>
      <ToastForm
        success={labels.merged}
        confirmTitle={labels.mergeTitle}
        confirmMessage={labels.mergeConfirm}
        confirmLabel={labels.merge}
        confirmTone="primary"
        action={async (fd) => {
          'use server';
          await decideGithubPull(projectId, fd);
        }}
      >
        <input type="hidden" name="pullNumber" value={String(pull.number)} />
        <input type="hidden" name="decision" value="merge" />
        <button
          type="submit"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
        >
          {labels.merge}
        </button>
      </ToastForm>
      <ToastForm
        success={labels.rejected}
        confirmTitle={labels.rejectTitle}
        confirmMessage={labels.rejectConfirm}
        confirmLabel={labels.reject}
        confirmTone="danger"
        action={async (fd) => {
          'use server';
          await decideGithubPull(projectId, fd);
        }}
      >
        <input type="hidden" name="pullNumber" value={String(pull.number)} />
        <input type="hidden" name="decision" value="reject" />
        <button
          type="submit"
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-50"
        >
          {labels.reject}
        </button>
      </ToastForm>
    </>
  );
}

export default async function OpsProjectReleases({
  projectId,
  siteProductionUrl,
  settings,
  requests,
}: {
  projectId: string;
  sitePreviewUrl?: string | null;
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
  const pullLabels = {
    open: t('ops.releases.openPr'),
    merge: t('ops.releases.mergePr'),
    reject: t('ops.releases.rejectPr'),
    mergeTitle: t('ops.releases.mergeConfirmTitle'),
    mergeConfirm: t('ops.releases.mergeConfirm'),
    rejectTitle: t('ops.releases.rejectConfirmTitle'),
    rejectConfirm: t('ops.releases.rejectConfirm'),
    merged: t('ops.releases.prMerged'),
    rejected: t('ops.releases.prRejected'),
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-zinc-900">{t('ops.releases.title')}</h3>
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
                    placeholder="team_… o slug"
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
        <h3 className="text-lg font-semibold text-zinc-900">{t('ops.releases.incomingTitle')}</h3>
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
        {!incoming.items.length && !incoming.pulls.length && !incoming.error && !incoming.hint ? (
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
                        {item.pull ? (
                          <StatusBadge label={`PR #${item.pull.number}`} tone="info" />
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {[item.author, item.sha ? item.sha.slice(0, 7) : null, item.branch]
                          .filter(Boolean)
                          .join(' · ')}
                        {item.createdAt ? ` · ${new Date(item.createdAt).toLocaleString()}` : ''}
                      </p>
                      <CopyableUrl href={item.openUrl} label={usageUrlLabel(item.previewUrl)} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={item.openUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
                      >
                        {t('ops.releases.openPreview')}
                      </a>
                      {canManage && item.pull ? (
                        <PullDecisions projectId={projectId} pull={item.pull} labels={pullLabels} />
                      ) : null}
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
        {incoming.pulls.length ? (
          <ul className="space-y-3">
            {incoming.pulls.map((pull) => (
              <li key={pull.number} className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-900">{pull.title}</p>
                      <StatusBadge label={`PR #${pull.number}`} tone="info" />
                    </div>
                    <p className="text-xs text-zinc-500">{pull.branch}</p>
                  </div>
                  {canManage ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <PullDecisions projectId={projectId} pull={pull} labels={pullLabels} />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

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
                  <CopyableUrl
                    href={withVercelPreviewBypass(r.preview_url, incoming.previewAccessSecret)}
                    label={usageUrlLabel(r.preview_url)}
                  />
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
