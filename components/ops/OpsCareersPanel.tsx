import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge from '@/components/ops/StatusBadge';
import {
  JOB_EMPLOYMENT_TYPES,
  careerOpsLabels,
  careerDisciplineLabels,
  isCareerDiscipline,
  publicCareerListUrl,
  publicCareerUrl,
  type JobApplicationStatus,
  type JobEmploymentType,
  type JobPostingStatus,
} from '@/lib/ops/careers';
import {
  createJobPosting,
  createPersonnelOfferFromApplication,
  deleteDraftJobPosting,
  updateJobApplicationStatus,
} from '@/lib/ops/career-actions';
import { huntSeedById } from '@/lib/careers/hunt/seeds';
import { matchedSeedCountsForDiscipline } from '@/lib/careers/hunt/match';
import { disciplineFromCatalogKey } from '@/lib/ops/career-disciplines';
import { labelsFor, EMPTY_LABEL } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';

export type OpsJobPostingRow = {
  id: string;
  slug: string;
  title: string;
  location: string | null;
  employment_type: string | null;
  status: string;
  updated_at: string;
};

export type OpsJobApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  discipline: string | null;
  status: string;
  created_at: string;
  personnel_offer_id: string | null;
  original_filename: string | null;
  assessment_attempt_id?: string | null;
  ops_job_postings: { title: string; slug: string } | { title: string; slug: string }[] | null;
};

export type OpsHuntReportRow = {
  id: string;
  full_name: string;
  email: string;
  page_url: string;
  title: string;
  description?: string | null;
  expected?: string | null;
  matched_seed_id: string | null;
  discipline?: string | null;
  assessment_attempt_id?: string | null;
  created_at: string;
};

export type OpsJobAttemptRow = {
  id: string;
  job_posting_id: string;
  catalog_key?: string | null;
  full_name: string;
  email: string;
  status: string;
  score_pct: number | null;
  passed: boolean | null;
  duration_ms: number | null;
  blur_count: number | null;
  started_at: string;
  completed_at: string | null;
  timezone: string | null;
  attempt_number: number | null;
};

function postingTone(status: string) {
  if (status === 'published') return 'success' as const;
  if (status === 'closed') return 'neutral' as const;
  return 'warning' as const;
}

function applicationTone(status: string) {
  if (status === 'hired') return 'success' as const;
  if (status === 'rejected') return 'danger' as const;
  if (status === 'reviewed') return 'info' as const;
  return 'warning' as const;
}

function formatDuration(ms: number | null | undefined) {
  if (!ms || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function attemptStatusLabel(
  status: string,
  passed: boolean | null,
  t: (key: string) => string
) {
  if (status === 'completed' && passed) return t('ops.careers.attemptPassed');
  if (status === 'completed') return t('ops.careers.attemptFailed');
  if (status === 'expired') return t('ops.careers.attemptExpired');
  if (status === 'started') return t('ops.careers.attemptStarted');
  return status;
}

function postingTitle(
  row: OpsJobApplicationRow,
  disciplineLabels: Record<string, string>
): string {
  const posting = Array.isArray(row.ops_job_postings) ? row.ops_job_postings[0] : row.ops_job_postings;
  const discipline =
    row.discipline && isCareerDiscipline(row.discipline) ? disciplineLabels[row.discipline] : null;
  if (discipline && posting?.title) return `${posting.title} · ${discipline}`;
  return discipline || posting?.title || EMPTY_LABEL;
}

function emailKey(value: string) {
  return value.trim().toLowerCase();
}

function huntForCandidate(
  reports: OpsHuntReportRow[],
  email: string,
  discipline?: string | null
) {
  const rows = reports.filter((row) => emailKey(row.email) === emailKey(email));
  const craftHits = rows.filter((row) =>
    discipline && isCareerDiscipline(discipline)
      ? matchedSeedCountsForDiscipline(row.matched_seed_id, discipline)
      : Boolean(row.matched_seed_id)
  );
  return { rows, total: rows.length, craftHits: craftHits.length };
}

export default async function OpsCareersPanel({
  postings,
  applications,
  attempts = [],
  huntReports = [],
}: {
  postings: OpsJobPostingRow[];
  applications: OpsJobApplicationRow[];
  attempts?: OpsJobAttemptRow[];
  huntReports?: OpsHuntReportRow[];
}) {
  const t = await getT();
  const { formatDate } = labelsFor(t.locale);
  const { JOB_POSTING_STATUS_LABELS, JOB_EMPLOYMENT_LABELS, JOB_APPLICATION_STATUS_LABELS } =
    careerOpsLabels(t.locale);
  const DISCIPLINE_LABELS = careerDisciplineLabels(t.locale);
  async function onCreate(formData: FormData) {
    'use server';
    await createJobPosting(formData);
  }

  const attemptById = new Map(attempts.map((row) => [row.id, row]));
  const attemptByEmail = new Map<string, OpsJobAttemptRow>();
  for (const row of attempts) {
    const key = emailKey(row.email);
    const current = attemptByEmail.get(key);
    if (!current || new Date(row.started_at) > new Date(current.started_at)) {
      attemptByEmail.set(key, row);
    }
  }
  const started = attempts.length;
  const completed = attempts.filter((row) => row.status === 'completed').length;
  const passed = attempts.filter((row) => row.passed).length;
  const appliedWithTest = applications.filter((row) => row.assessment_attempt_id).length;

  return (
    <div className="max-w-4xl space-y-10">
      <ToastForm
        success={t('ops.careers.created')}
        action={onCreate}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">{t('ops.careers.createTitle')}</h2>
        <p className="text-sm text-zinc-500">
          {t('ops.careers.createHint')}{' '}
          <a href={publicCareerListUrl()} className="text-codiva-primary hover:underline">
            career.codiva.dev
          </a>
          {t('ops.careers.createHintEnd')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder={t('ops.careers.titlePlaceholder')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="titleEn"
            placeholder={t('ops.careers.titleEn')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="slug"
            placeholder={t('ops.careers.slugPlaceholder')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="location"
            placeholder={t('ops.careers.locationPlaceholder')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="locationEn"
            placeholder={t('ops.careers.locationEn')}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <select name="employmentType" defaultValue="full_time" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {JOB_EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {JOB_EMPLOYMENT_LABELS[type]}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="draft" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {Object.entries(JOB_POSTING_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.careers.description')}
            <textarea
              name="description"
              rows={5}
              placeholder={t('ops.careers.descPlaceholder')}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.careers.descriptionEn')}
            <textarea
              name="descriptionEn"
              rows={5}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.careers.requirements')}
            <textarea
              name="requirements"
              rows={4}
              placeholder={t('ops.careers.reqPlaceholder')}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.careers.requirementsEn')}
            <textarea
              name="requirementsEn"
              rows={4}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <p className="text-xs text-zinc-500 sm:col-span-2">{t('ops.careers.enHint')}</p>
        </div>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          {t('ops.careers.createSubmit')}
        </button>
      </ToastForm>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.careers.listTitle')}</h2>
        {!postings.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.empty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {postings.map((row) => (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-sm text-zinc-500">
                      {row.slug}
                      {row.location ? ` · ${row.location}` : ''}
                      {row.employment_type
                        ? ` · ${JOB_EMPLOYMENT_LABELS[row.employment_type as JobEmploymentType] ?? row.employment_type}`
                        : ''}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">{t('ops.careers.updated', { date: formatDate(row.updated_at) })}</p>
                  </div>
                  <StatusBadge
                    label={JOB_POSTING_STATUS_LABELS[row.status as JobPostingStatus] ?? row.status}
                    tone={postingTone(row.status)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/team/vacantes/${row.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t('ops.careers.edit')}
                  </Link>
                  {row.status === 'published' ? (
                    <a
                      href={publicCareerUrl(row.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewPublic')}
                    </a>
                  ) : null}
                  {row.status === 'draft' ? (
                    <ToastForm
                      success={t('ops.careers.deleted')}
                      action={async () => {
                        'use server';
                        await deleteDraftJobPosting(row.id);
                      }}
                    >
                      <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                        {t('ops.careers.deleteDraft')}
                      </button>
                    </ToastForm>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.careers.testsTitle')}</h2>
        <p className="text-sm text-zinc-500">{t('ops.careers.testsHint')}</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            [t('ops.careers.started'), started],
            [t('ops.careers.finished'), completed],
            [t('ops.careers.passed'), passed],
            [t('ops.careers.appliedWithTest'), appliedWithTest],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
            </div>
          ))}
        </div>
        {!attempts.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.testsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {attempts.slice(0, 40).map((row) => {
              const posting = postings.find((p) => p.id === row.job_posting_id);
              const hunt = huntForCandidate(
                huntReports,
                row.email,
                disciplineFromCatalogKey(row.catalog_key)
              );
              return (
                <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-sm text-zinc-500">{row.email}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {posting?.title || t('ops.careers.vacancy')} · {t('ops.careers.attemptN', { n: row.attempt_number ?? 1 })} · {formatDate(row.started_at)}
                        {row.timezone ? ` · ${row.timezone}` : ''}
                        {row.duration_ms ? ` · ${formatDuration(row.duration_ms)}` : ''}
                        {row.blur_count ? ` · ${t('ops.careers.blurs', { count: row.blur_count })}` : ''}
                        {hunt.total
                          ? ` · ${t('ops.careers.findingsCount', { count: hunt.total })}${
                              hunt.craftHits ? ` ${t('ops.careers.craftHits', { count: hunt.craftHits })}` : ''
                            }`
                          : ''}
                      </p>
                    </div>
                    <StatusBadge
                      label={
                        row.score_pct != null
                          ? `${attemptStatusLabel(row.status, row.passed, t)} · ${row.score_pct}%`
                          : attemptStatusLabel(row.status, row.passed, t)
                      }
                      tone={row.passed ? 'success' : row.status === 'started' ? 'warning' : 'neutral'}
                    />
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/team/intentos/${row.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewProgress')}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.careers.appsTitle')}</h2>
        {!applications.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.appsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {applications.map((row) => {
              const hunt = huntForCandidate(huntReports, row.email, row.discipline);
              return (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-sm text-zinc-500">
                      {row.email}
                      {row.phone ? ` · ${row.phone}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {postingTitle(row, DISCIPLINE_LABELS)} · {formatDate(row.created_at)}
                      {row.assessment_attempt_id && attemptById.get(row.assessment_attempt_id)?.score_pct != null
                        ? ` · ${t('ops.careers.testScore', { pct: attemptById.get(row.assessment_attempt_id)?.score_pct })}`
                        : ''}
                      {hunt.total
                        ? ` · ${t('ops.careers.findingsCount', { count: hunt.total })}${
                            hunt.craftHits ? ` ${t('ops.careers.craftHits', { count: hunt.craftHits })}` : ''
                          }`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge
                    label={JOB_APPLICATION_STATUS_LABELS[row.status as JobApplicationStatus] ?? row.status}
                    tone={applicationTone(row.status)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/ops/careers/cv?id=${row.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t('ops.careers.downloadCv')}
                  </a>
                  {row.assessment_attempt_id ? (
                    <Link
                      href={`/team/intentos/${row.assessment_attempt_id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewTest')}
                    </Link>
                  ) : hunt.total && attemptByEmail.get(emailKey(row.email)) ? (
                    <Link
                      href={`/team/intentos/${attemptByEmail.get(emailKey(row.email))!.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewTest')}
                    </Link>
                  ) : null}
                  {row.personnel_offer_id ? (
                    <Link
                      href={`/team/ofertas/${row.personnel_offer_id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewOffer')}
                    </Link>
                  ) : (
                    <ToastForm
                      success={t('ops.careers.offerCreated')}
                      loading={t('ops.careers.creating')}
                      action={async () => {
                        'use server';
                        await createPersonnelOfferFromApplication(row.id);
                      }}
                    >
                      <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                        {t('ops.careers.hire')}
                      </button>
                    </ToastForm>
                  )}
                  <ToastForm
                    success={t('ops.careers.statusUpdated')}
                    action={async (fd) => {
                      'use server';
                      await updateJobApplicationStatus(row.id, fd);
                    }}
                    className="flex items-center gap-2"
                  >
                    <select
                      name="status"
                      defaultValue={row.status}
                      className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                    >
                      {Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                      {t('ops.team.save')}
                    </button>
                  </ToastForm>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.careers.findingsTitle')}</h2>
        <p className="text-sm text-zinc-500">{t('ops.careers.findingsHint')}</p>
        {!huntReports.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.findingsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {huntReports.slice(0, 40).map((row) => {
              const seed = row.matched_seed_id ? huntSeedById(row.matched_seed_id) : null;
              const craftLabel =
                row.discipline && isCareerDiscipline(row.discipline)
                  ? DISCIPLINE_LABELS[row.discipline]
                  : seed
                    ? DISCIPLINE_LABELS[seed.craft]
                    : null;
              const linkedAttempt =
                (row.assessment_attempt_id && attemptById.get(row.assessment_attempt_id)) ||
                attemptByEmail.get(emailKey(row.email)) ||
                null;
              const countsForLinked =
                seed &&
                linkedAttempt &&
                (() => {
                  const discipline = disciplineFromCatalogKey(linkedAttempt.catalog_key);
                  return discipline ? matchedSeedCountsForDiscipline(seed.id, discipline) : false;
                })();
              return (
                <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-sm text-zinc-500">{row.email}</p>
                      <p className="mt-1 text-sm text-zinc-800">{row.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {row.page_url} · {formatDate(row.created_at)}
                        {craftLabel ? ` · ${craftLabel}` : ''}
                      </p>
                    </div>
                    <StatusBadge
                      label={
                        seed
                          ? countsForLinked
                            ? t('ops.careers.seedCounts')
                            : t('ops.careers.seed', { craft: DISCIPLINE_LABELS[seed.craft] })
                          : t('ops.careers.noMatch')
                      }
                      tone={seed ? (countsForLinked ? 'success' : 'info') : 'warning'}
                    />
                  </div>
                  {seed ? <p className="mt-2 text-xs text-zinc-500">{seed.title}</p> : null}
                  {linkedAttempt ? (
                    <div className="mt-3">
                      <Link
                        href={`/team/intentos/${linkedAttempt.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {t('ops.careers.viewCandidateTest')}
                      </Link>
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
