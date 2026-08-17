import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import OpsCareersPanel, {
  type OpsHuntReportRow,
  type OpsJobApplicationRow,
  type OpsJobAttemptRow,
  type OpsJobPostingRow,
} from '@/components/ops/OpsCareersPanel';
import { requireStaff } from '@/lib/ops/auth';
import {
  assignProjectStaff,
  createPersonnelOffer,
  inviteStaff,
  removeProjectStaff,
  updateStaffProfile,
} from '@/lib/ops/actions';
import {
  DEFAULT_RESPONSIBILITIES,
  offerLabelsFor,
} from '@/lib/ops/offer-letter';
import { labelsFor } from '@/lib/ops/labels';
import { can, canAny, isCustomizedCapabilities } from '@/lib/ops/permissions';
import {
  isTesterCatalogKey,
  isTesterJobSlug,
  isTesterPipelineItem,
} from '@/lib/ops/career-disciplines';
import { getT } from '@/i18n/locale';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import CodivaBrandText from '@/components/CodivaBrandText';
import OpsStaffCapabilityFields from '@/components/ops/OpsStaffCapabilityFields';

function tabClass(active: boolean) {
  return active
    ? 'border-b-2 border-codiva-primary px-1 pb-2 text-sm font-semibold text-codiva-primary'
    : 'border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-zinc-500 hover:text-zinc-800';
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; signal?: string; origin?: string }>;
}) {
  const { tab: tabParam, signal: signalParam, origin: originParam } = await searchParams;
  const { supabase, staff, user } = await requireStaff();
  if (!canAny(staff, ['team', 'careers_review'])) {
    redirect('/dashboard?error=forbidden');
  }
  const canManageTeam = can(staff, 'team');
  const tab = !canManageTeam
    ? 'bolsa'
    : tabParam === 'ofertas'
      ? 'ofertas'
      : tabParam === 'bolsa'
        ? 'bolsa'
        : 'miembros';
  const t = await getT();
  const { EMPTY_LABEL, formatCurrency, formatDate } = labelsFor(t.locale);
  const { OPS_ROLE_LABELS, WORK_MODALITY_LABELS, OFFER_STATUS_LABELS } = offerLabelsFor(t.locale);
  const ROLE_LABELS = OPS_ROLE_LABELS;
  const admin = createAdminClient();

  const empty = { data: [] as never[] };
  const [
    { data: staffRows },
    { data: offers },
    { data: postings },
    { data: applications },
    { data: attempts },
    { data: huntReports },
    { data: allProjects },
    { data: staffAssignments },
  ] = await Promise.all([
    canManageTeam
      ? supabase
          .from('staff_profiles')
          .select('id, full_name, role, active, created_at, capabilities')
          .order('created_at', { ascending: true })
      : Promise.resolve(empty),
    canManageTeam
      ? supabase
          .from('ops_personnel_offers')
          .select(
            'id, full_name, email, position_title, ops_role, monthly_compensation, currency, work_modality, status, issued_at, created_at'
          )
          .order('created_at', { ascending: false })
      : Promise.resolve(empty),
    supabase
      .from('ops_job_postings')
      .select('id, slug, title, location, employment_type, status, updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('ops_job_applications')
      .select(
        'id, full_name, email, phone, discipline, status, created_at, personnel_offer_id, original_filename, assessment_attempt_id, cover_letter, ops_job_postings(title, slug)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('ops_job_assessment_attempts')
      .select(
        'id, job_posting_id, catalog_key, full_name, email, status, score_pct, passed, duration_ms, blur_count, started_at, completed_at, timezone, attempt_number, ip_hash, user_agent'
      )
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('ops_hunt_reports')
      .select(
        'id, full_name, email, page_url, title, description, expected, matched_seed_id, discipline, assessment_attempt_id, review_status, evidence_paths, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(80),
    canManageTeam
      ? supabase.from('projects').select('id, name, organizations(name)').order('name')
      : Promise.resolve(empty),
    canManageTeam
      ? supabase.from('project_staff').select('project_id, staff_id, role_on_project')
      : Promise.resolve(empty),
  ]);

  const emails = new Map<string, string>();
  if (canManageTeam) {
    await Promise.all(
      (staffRows ?? []).map(async (row) => {
        const { data } = await admin.auth.admin.getUserById(row.id);
        if (data.user?.email) emails.set(row.id, data.user.email);
      })
    );
  }

  const testerPostingIds = new Set(
    (postings ?? []).filter((row) => isTesterJobSlug(row.slug)).map((row) => row.id)
  );
  const visiblePostings = canManageTeam
    ? postings
    : (postings ?? []).filter((row) => isTesterJobSlug(row.slug));
  const visibleApplications = canManageTeam
    ? applications
    : (applications ?? []).filter((row) => {
        const posting = Array.isArray(row.ops_job_postings) ? row.ops_job_postings[0] : row.ops_job_postings;
        return isTesterPipelineItem({ postingSlug: posting?.slug, discipline: row.discipline });
      });
  const visibleAttempts = canManageTeam
    ? attempts
    : (attempts ?? []).filter(
        (row) => isTesterCatalogKey(row.catalog_key) || testerPostingIds.has(row.job_posting_id)
      );
  const assignmentsByStaff = new Map<string, { project_id: string; role_on_project: string }[]>();
  for (const row of staffAssignments ?? []) {
    const list = assignmentsByStaff.get(row.staff_id) ?? [];
    list.push({ project_id: row.project_id, role_on_project: row.role_on_project });
    assignmentsByStaff.set(row.staff_id, list);
  }
  const projectLabel = new Map(
    (allProjects ?? []).map((p) => {
      const org = p.organizations as { name?: string } | { name?: string }[] | null;
      const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
      return [p.id, orgName ? `${p.name} · ${orgName}` : p.name] as const;
    })
  );

  async function onInvite(formData: FormData) {
    'use server';
    await inviteStaff(formData);
  }

  async function onCreateOffer(formData: FormData) {
    'use server';
    await createPersonnelOffer(formData);
  }

  return (
    <div>
      <OpsPageHeader
        title={t('ops.team.title')}
        description={canManageTeam ? t('ops.team.description') : t('ops.team.descriptionPm')}
      />

      <div className="mb-8 flex gap-6 border-b border-zinc-200">
        {canManageTeam ? (
          <>
            <Link href="/team?tab=miembros" className={tabClass(tab === 'miembros')}>
              {t('ops.team.tabMembers')}
            </Link>
            <Link href="/team?tab=ofertas" className={tabClass(tab === 'ofertas')}>
              {t('ops.team.tabOffers')}
              {(offers ?? []).length > 0 ? (
                <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                  {(offers ?? []).length}
                </span>
              ) : null}
            </Link>
          </>
        ) : null}
        <Link href="/team?tab=bolsa" className={tabClass(tab === 'bolsa')}>
          {t('ops.team.tabJobs')}
          {(visibleApplications ?? []).filter((row) => row.status === 'new').length > 0 ? (
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {(visibleApplications ?? []).filter((row) => row.status === 'new').length}
            </span>
          ) : null}
        </Link>
      </div>

      {tab === 'miembros' && canManageTeam ? (
        <div className="max-w-3xl space-y-8">
          <ToastForm
            success={t('ops.team.inviteSent')}
            action={onInvite}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">{t('ops.team.inviteTitle')}</h2>
            <p className="text-sm text-zinc-500">
              <CodivaBrandText>{t('ops.team.inviteHint')}</CodivaBrandText>
            </p>
            <label className="block text-sm font-medium text-zinc-700">
              {t('ops.team.inviteEmail')}
              <input
                name="email"
                type="email"
                required
                placeholder="nombre@codiva.dev"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              {t('ops.team.fullName')}
              <input
                name="fullName"
                type="text"
                placeholder={t('ops.team.fullName')}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal"
              />
            </label>
            <OpsStaffCapabilityFields defaultRole="pm" />
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              {t('ops.team.inviteSend')}
            </button>
          </ToastForm>

          <section className="space-y-3">
            <h2 className="font-semibold">{t('ops.team.membersTitle')}</h2>
            <ul className="space-y-3">
              {(staffRows ?? []).map((row) => {
                const caps = Array.isArray(row.capabilities) ? row.capabilities : null;
                const customized = isCustomizedCapabilities(row.role, caps);
                const hasAllProjects = Boolean(caps?.includes('projects_all'));
                const assigned = assignmentsByStaff.get(row.id) ?? [];
                const assignedIds = new Set(assigned.map((a) => a.project_id));
                const available = (allProjects ?? []).filter((p) => !assignedIds.has(p.id));
                return (
                <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.full_name || EMPTY_LABEL}</p>
                      <p className="text-sm text-zinc-500">{emails.get(row.id) ?? row.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {t('ops.team.since', {
                          date: formatDate(row.created_at),
                          status: row.active ? t('ops.team.active') : t('ops.team.inactive'),
                        })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">
                        {ROLE_LABELS[row.role as keyof typeof ROLE_LABELS] ?? row.role}
                      </span>
                      {customized ? (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          {t('ops.team.permissionsCustom')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ToastForm
                    success={t('ops.team.profileUpdated')}
                    action={async (fd) => {
                      'use server';
                      await updateStaffProfile(row.id, fd);
                    }}
                    className="space-y-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                      <label className="block text-sm font-medium text-zinc-700">
                        {t('ops.team.fullName')}
                        <input
                          name="fullName"
                          defaultValue={row.full_name ?? ''}
                          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-normal"
                        />
                      </label>
                      <label className="flex h-10 items-center gap-2 text-sm">
                        <input type="checkbox" name="active" defaultChecked={row.active} />
                        {t('ops.team.active')}
                      </label>
                    </div>
                    <OpsStaffCapabilityFields
                      defaultRole={row.role}
                      defaultCapabilities={caps}
                      lockTeam={row.id === user.id}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.team.save')}
                    </button>
                  </ToastForm>
                  <details className="group mt-4 border-t border-zinc-100 pt-4">
                    <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-medium text-zinc-800">
                      <span>{t('ops.team.projectsTitle')}</span>
                      <span className="text-xs font-normal text-zinc-500">
                        {hasAllProjects
                          ? t('ops.team.projectsAllBadge')
                          : t('ops.team.projectsSummary', { count: assigned.length })}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3">
                        <p className="text-xs text-zinc-500">
                          {hasAllProjects ? t('ops.team.projectsAllAccess') : t('ops.team.projectsHint')}
                        </p>
                        <ul className="space-y-2">
                          {assigned.map((a) => (
                            <li
                              key={a.project_id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
                            >
                              <span>
                                <Link
                                  href={`/projects/${a.project_id}`}
                                  className="text-codiva-primary hover:underline"
                                >
                                  {projectLabel.get(a.project_id) ?? a.project_id.slice(0, 8)}
                                </Link>
                                <span className="text-zinc-500"> · {a.role_on_project}</span>
                              </span>
                              <ToastForm
                                success={t('ops.team.projectsRemoved')}
                                action={async () => {
                                  'use server';
                                  await removeProjectStaff(a.project_id, row.id);
                                }}
                              >
                                <button type="submit" className="text-xs text-zinc-500 hover:text-red-600">
                                  {t('ops.team.projectsRemove')}
                                </button>
                              </ToastForm>
                            </li>
                          ))}
                          {!assigned.length ? (
                            <p className="text-sm text-zinc-500">{t('ops.team.projectsEmpty')}</p>
                          ) : null}
                        </ul>
                        {available.length > 0 ? (
                          <ToastForm
                            success={t('ops.team.projectsAdded')}
                            action={async (fd) => {
                              'use server';
                              const projectId = String(fd.get('projectId') || '').trim();
                              await assignProjectStaff(projectId, fd);
                            }}
                            className="flex flex-wrap gap-2"
                          >
                            <input type="hidden" name="staffId" value={row.id} />
                            <select
                              name="projectId"
                              required
                              className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                            >
                              <option value="">{t('ops.team.projectsSelect')}</option>
                              {available.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {projectLabel.get(p.id) ?? p.name}
                                </option>
                              ))}
                            </select>
                            <select
                              name="roleOnProject"
                              defaultValue={row.role === 'dev' ? 'dev' : 'pm'}
                              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                            >
                              <option value="pm">PM</option>
                              <option value="dev">Dev</option>
                              <option value="member">Member</option>
                            </select>
                            <button
                              type="submit"
                              className="rounded-lg bg-codiva-primary px-3 py-2 text-sm text-white"
                            >
                              {t('ops.team.projectsAdd')}
                            </button>
                          </ToastForm>
                        ) : (
                          <p className="text-xs text-zinc-400">{t('ops.team.projectsAllAssigned')}</p>
                        )}
                    </div>
                  </details>
                </li>
                );
              })}
            </ul>
          </section>
        </div>
      ) : tab === 'bolsa' ? (
        <OpsCareersPanel
          postings={(visiblePostings ?? []) as OpsJobPostingRow[]}
          applications={(visibleApplications ?? []) as OpsJobApplicationRow[]}
          attempts={(visibleAttempts ?? []) as OpsJobAttemptRow[]}
          huntReports={(huntReports ?? []) as OpsHuntReportRow[]}
          signal={signalParam || ''}
          origin={originParam || ''}
          canManage={canManageTeam}
        />
      ) : (
        <div className="max-w-3xl space-y-8">
          <ToastForm
            success={t('ops.team.offerCreated')}
            loading={t('ops.toast.saving')}
            action={onCreateOffer}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">{t('ops.team.offerCreateTitle')}</h2>
            <p className="text-sm text-zinc-500">{t('ops.team.offerHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="fullName"
                required
                placeholder={t('ops.team.fullName')}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="positionTitle"
                required
                defaultValue={ROLE_LABELS.pm}
                placeholder={t('ops.team.position')}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="opsRole" defaultValue="pm" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="pm">{ROLE_LABELS.pm}</option>
                <option value="dev">{ROLE_LABELS.dev}</option>
                <option value="admin">{ROLE_LABELS.admin}</option>
              </select>
              <input
                name="monthlyCompensation"
                type="number"
                required
                min={1}
                step="0.01"
                defaultValue={1200}
                placeholder={t('ops.team.compensation')}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="currency" defaultValue="USD" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
              <select name="workModality" defaultValue="remote" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {Object.entries(WORK_MODALITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <select name="status" defaultValue="draft" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {['draft', 'sent', 'accepted'].map((value) => (
                  <option key={value} value={value}>
                    {OFFER_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
              <label className="text-sm text-zinc-600">
                {t('ops.team.start')}
                <input
                  name="startDate"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600">
                {t('ops.team.validUntil')}
                <input
                  name="validUntil"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                {t('ops.team.issuedAt')}
                <input
                  name="issuedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                {t('ops.team.responsibilities')}
                <textarea
                  name="responsibilities"
                  rows={5}
                  defaultValue={DEFAULT_RESPONSIBILITIES}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                {t('ops.team.terms')}
                <textarea
                  name="terms"
                  rows={4}
                  placeholder={t('ops.team.termsPlaceholder')}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                {t('ops.team.notesInternal')}
                <textarea
                  name="notesInternal"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              {t('ops.team.createOffer')}
            </button>
          </ToastForm>

          <section className="space-y-3">
            <h2 className="font-semibold">{t('ops.team.offersTitle')}</h2>
            {!(offers ?? []).length ? (
              <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
                {t('ops.team.offersEmpty')}
              </p>
            ) : (
              <ul className="space-y-3">
                {(offers ?? []).map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/team/ofertas/${row.id}`}
                      className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-codiva-primary/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{row.full_name}</p>
                          <p className="text-sm text-zinc-500">
                            {row.position_title} · {OPS_ROLE_LABELS[row.ops_role] ?? row.ops_role}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {formatCurrency(Number(row.monthly_compensation), row.currency || 'USD')} {t('ops.team.perMonth')} ·{' '}
                            {WORK_MODALITY_LABELS[row.work_modality] ?? row.work_modality}
                            {row.email ? ` · ${row.email}` : ''}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {t('ops.team.issued', { date: row.issued_at ? formatDate(row.issued_at) : EMPTY_LABEL })} ·{' '}
                            {formatDate(row.created_at)}
                          </p>
                        </div>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">
                          {OFFER_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
