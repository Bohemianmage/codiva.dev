import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge from '@/components/ops/StatusBadge';
import HuntEvidenceLightbox from '@/components/ops/HuntEvidenceLightbox';
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
  updateHuntReportReview,
  updateJobApplicationStatus,
} from '@/lib/ops/career-actions';
import { huntSeedById } from '@/lib/careers/hunt/seeds';
import { matchedSeedCountsForDiscipline } from '@/lib/careers/hunt/match';
import {
  huntConsiderationLabel,
  huntDifficultyLabel,
  scoreHuntReports,
  type HuntConsideration,
} from '@/lib/careers/hunt/score';
import { disciplineFromCatalogKey } from '@/lib/ops/career-disciplines';
import {
  attemptsSharingOrigin,
  deviceLabelFromUserAgent,
  distinctOriginEmails,
  originFingerprint,
  sharedOriginAttemptCount,
} from '@/lib/careers/assessments/origin';
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
  review_status?: string | null;
  evidence_paths?: string[] | null;
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
  ip_hash?: string | null;
  user_agent?: string | null;
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

function considerationRank(value: HuntConsideration) {
  if (value === 'strong') return 3;
  if (value === 'solid') return 2;
  if (value === 'minimum') return 1;
  return 0;
}

function considerationTone(value: HuntConsideration) {
  if (value === 'strong') return 'success' as const;
  if (value === 'solid') return 'info' as const;
  if (value === 'minimum') return 'warning' as const;
  return 'neutral' as const;
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
  return { rows, total: rows.length, craftHits: craftHits.length, score: scoreHuntReports(rows, discipline) };
}

export default async function OpsCareersPanel({
  postings,
  applications,
  attempts = [],
  huntReports = [],
  signal = '',
  origin = '',
  canManage = true,
}: {
  postings: OpsJobPostingRow[];
  applications: OpsJobApplicationRow[];
  attempts?: OpsJobAttemptRow[];
  huntReports?: OpsHuntReportRow[];
  signal?: string;
  origin?: string;
  canManage?: boolean;
}) {
  const t = await getT();
  const { formatDate } = labelsFor(t.locale);
  const { JOB_POSTING_STATUS_LABELS, JOB_EMPLOYMENT_LABELS, JOB_APPLICATION_STATUS_LABELS } =
    careerOpsLabels(t.locale);
  const DISCIPLINE_LABELS = careerDisciplineLabels(t.locale);
  const locale = t.locale === 'en' ? 'en' : 'es';
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
  const signalFilter =
    signal === 'strong' || signal === 'solid' || signal === 'minimum' || signal === 'none' ? signal : '';
  const originFilter = origin === 'shared';
  const sharedOriginCount = sharedOriginAttemptCount(attempts);
  const originSize = new Map<string, number>();
  for (const row of attempts) {
    const hash = String(row.ip_hash || '').trim();
    if (!hash) continue;
    originSize.set(hash, (originSize.get(hash) || 0) + 1);
  }

  const attemptsRanked = [...attempts]
    .sort((a, b) => {
      const aHash = String(a.ip_hash || '').trim();
      const bHash = String(b.ip_hash || '').trim();
      const aShared = (originSize.get(aHash) || 0) >= 2 ? 1 : 0;
      const bShared = (originSize.get(bHash) || 0) >= 2 ? 1 : 0;
      if (originFilter && aShared !== bShared) return bShared - aShared;
      if (originFilter && aShared && aHash && aHash === bHash) {
        return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
      }
      if (originFilter && aShared && bShared && aHash !== bHash) return aHash.localeCompare(bHash);
      const ha = huntForCandidate(huntReports, a.email, disciplineFromCatalogKey(a.catalog_key));
      const hb = huntForCandidate(huntReports, b.email, disciplineFromCatalogKey(b.catalog_key));
      const diff = considerationRank(hb.score.consideration) - considerationRank(ha.score.consideration);
      if (diff) return diff;
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    })
    .filter((row) => {
      if (originFilter && (originSize.get(String(row.ip_hash || '').trim()) || 0) < 2) return false;
      if (!signalFilter) return true;
      return (
        huntForCandidate(huntReports, row.email, disciplineFromCatalogKey(row.catalog_key)).score
          .consideration === signalFilter
      );
    });

  const applicationsRanked = [...applications]
    .sort((a, b) => {
      const ha = huntForCandidate(huntReports, a.email, a.discipline);
      const hb = huntForCandidate(huntReports, b.email, b.discipline);
      const diff = considerationRank(hb.score.consideration) - considerationRank(ha.score.consideration);
      if (diff) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .filter((row) => {
      if (!signalFilter) return true;
      return huntForCandidate(huntReports, row.email, row.discipline).score.consideration === signalFilter;
    });

  const bolsaHref = ({ signalValue, originValue }: { signalValue?: string; originValue?: string }) => {
    const params = new URLSearchParams({ tab: 'bolsa' });
    const nextSignal = signalValue === undefined ? signalFilter : signalValue;
    const nextOrigin = originValue === undefined ? (originFilter ? 'shared' : '') : originValue;
    if (nextSignal) params.set('signal', nextSignal);
    if (nextOrigin) params.set('origin', nextOrigin);
    return `/team?${params.toString()}`;
  };


  return (
    <div className="max-w-4xl space-y-10">
      {canManage ? (
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
      ) : null}

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
                  {canManage ? (
                    <Link
                      href={`/team/vacantes/${row.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.edit')}
                    </Link>
                  ) : null}
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
                  <a
                    href={`/api/ops/careers/recruiting-report?pipeline=1&job=${row.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t('ops.careers.pipelineHtml')}
                  </a>
                  {canManage && row.status === 'draft' ? (
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
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/ops/careers/recruiting-report?pipeline=1"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            {t('ops.careers.pipelineHtml')}
          </a>
          <a
            href="/api/ops/careers/recruiting-report?pipeline=1&format=pdf"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            {t('ops.careers.pipelinePdf')}
          </a>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ['', t('ops.careers.signalAll')],
            ['strong', huntConsiderationLabel('strong', locale)],
            ['solid', huntConsiderationLabel('solid', locale)],
            ['minimum', huntConsiderationLabel('minimum', locale)],
            ['none', huntConsiderationLabel('none', locale)],
          ].map(([value, label]) => (
            <Link
              key={value || 'all'}
              href={bolsaHref({ signalValue: value })}
              className={
                signalFilter === value
                  ? 'rounded-full bg-codiva-primary px-3 py-1 text-xs font-semibold text-white'
                  : 'rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50'
              }
            >
              {label}
            </Link>
          ))}
          <Link
            href={bolsaHref({ originValue: originFilter ? '' : 'shared' })}
            className={
              originFilter
                ? 'rounded-full bg-amber-700 px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-amber-300 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-50'
            }
          >
            {t('ops.careers.originShared')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {[
            [t('ops.careers.started'), started],
            [t('ops.careers.finished'), completed],
            [t('ops.careers.passed'), passed],
            [t('ops.careers.appliedWithTest'), appliedWithTest],
            [t('ops.careers.originShared'), sharedOriginCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
            </div>
          ))}
        </div>
        {!attemptsRanked.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.testsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {attemptsRanked.slice(0, 40).map((row) => {
              const posting = postings.find((p) => p.id === row.job_posting_id);
              const hunt = huntForCandidate(
                huntReports,
                row.email,
                disciplineFromCatalogKey(row.catalog_key)
              );
              const peers = attemptsSharingOrigin(attempts, row.ip_hash).filter((peer) => peer.id !== row.id);
              const fingerprint = originFingerprint(row.ip_hash);
              const identities = distinctOriginEmails([row, ...peers]);
              const device = deviceLabelFromUserAgent(row.user_agent);
              const namedPeers = peers.filter(
                (peer, index, list) => list.findIndex((p) => p.full_name === peer.full_name) === index
              ).slice(0, 3);
              return (
                <li
                  key={row.id}
                  className={`rounded-xl border bg-white p-4 ${
                    peers.length ? 'border-amber-300' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.full_name}</p>
                      <p className="text-sm text-zinc-500">{row.email}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {posting?.title || t('ops.careers.vacancy')} · {t('ops.careers.attemptN', { n: row.attempt_number ?? 1 })} · {formatDate(row.started_at)}
                        {row.timezone ? ` · ${row.timezone}` : ''}
                        {device ? ` · ${device}` : ''}
                        {row.duration_ms ? ` · ${formatDuration(row.duration_ms)}` : ''}
                        {row.blur_count ? ` · ${t('ops.careers.blurs', { count: row.blur_count })}` : ''}
                        {hunt.total
                          ? ` · ${t('ops.careers.findingsCount', { count: hunt.total })}${
                              hunt.craftHits ? ` ${t('ops.careers.craftHits', { count: hunt.craftHits })}` : ''
                            }`
                          : ''}
                      </p>
                      {peers.length ? (
                        <p className="mt-1 text-xs text-amber-800">
                          {t('ops.careers.sameOrigin', { count: peers.length + 1 })}
                          {identities > 1
                            ? ` · ${t('ops.careers.sameOriginIdentities', { count: identities })}`
                            : ''}
                          {fingerprint ? ` · ${t('ops.careers.originCode', { code: fingerprint })}` : ''}
                          {namedPeers.length ? (
                            <>
                              {' · '}
                              {t('ops.careers.originAlso')}
                              {': '}
                              {namedPeers.map((peer, index) => (
                                  <span key={peer.id}>
                                    {index > 0 ? ', ' : ''}
                                    <Link href={`/team/intentos/${peer.id}`} className="underline decoration-amber-400 hover:text-amber-950">
                                      {peer.full_name}
                                    </Link>
                                  </span>
                                ))}
                            </>
                          ) : null}
                        </p>
                      ) : fingerprint ? (
                        <p className="mt-1 text-xs text-zinc-400">
                          {t('ops.careers.originCode', { code: fingerprint })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                    <StatusBadge
                      label={
                        row.score_pct != null
                          ? `${attemptStatusLabel(row.status, row.passed, t)} · ${row.score_pct}%`
                          : attemptStatusLabel(row.status, row.passed, t)
                      }
                      tone={row.passed ? 'success' : row.status === 'started' ? 'warning' : 'neutral'}
                    />
                    {peers.length ? (
                      <StatusBadge
                        label={t('ops.careers.sameOrigin', { count: peers.length + 1 })}
                        tone="warning"
                      />
                    ) : null}
                    {hunt.score.consideration !== 'none' ? (
                      <StatusBadge
                        label={t('ops.careers.consideration', {
                          label: huntConsiderationLabel(hunt.score.consideration, locale),
                        })}
                        tone={considerationTone(hunt.score.consideration)}
                      />
                    ) : null}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/team/intentos/${row.id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewProgress')}
                    </Link>
                    <a
                      href={`/api/ops/careers/recruiting-report?attempt=${row.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.reportHtml')}
                    </a>
                    <a
                      href={`/api/ops/careers/recruiting-report?attempt=${row.id}&format=pdf`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.reportPdf')}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.careers.appsTitle')}</h2>
        {!applicationsRanked.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.careers.appsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {applicationsRanked.map((row) => {
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
                  <div className="flex flex-col items-end gap-1">
                  <StatusBadge
                    label={JOB_APPLICATION_STATUS_LABELS[row.status as JobApplicationStatus] ?? row.status}
                    tone={applicationTone(row.status)}
                  />
                  {hunt.score.consideration !== 'none' ? (
                    <StatusBadge
                      label={t('ops.careers.consideration', {
                        label: huntConsiderationLabel(hunt.score.consideration, locale),
                      })}
                      tone={considerationTone(hunt.score.consideration)}
                    />
                  ) : null}
                  </div>
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
                  {canManage && row.personnel_offer_id ? (
                    <Link
                      href={`/team/ofertas/${row.personnel_offer_id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewOffer')}
                    </Link>
                  ) : canManage ? (
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
                  ) : null}
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
                        {seed
                          ? ` · ${t('ops.careers.difficulty', {
                              label: huntDifficultyLabel(seed.difficulty, locale),
                            })}`
                          : ''}
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
                      tone={seed ? (countsForLinked ? 'success' : 'info') : 'neutral'}
                    />
                  </div>
                  {seed ? <p className="mt-2 text-xs text-zinc-500">{seed.title}</p> : (
                    <p className="mt-2 text-xs text-zinc-500">{t('ops.careers.noMatchHint')}</p>
                  )}
                  {(row.evidence_paths ?? []).length ? (
                    <HuntEvidenceLightbox reportId={row.id} count={(row.evidence_paths ?? []).length} />
                  ) : null}
                  {!seed ? (
                    <ToastForm
                      success={t('ops.careers.reviewSaved')}
                      action={async (fd) => {
                        'use server';
                        await updateHuntReportReview(row.id, fd);
                      }}
                      className="mt-3 flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="attempt_id" value={row.assessment_attempt_id || ''} />
                      <select
                        name="review_status"
                        defaultValue={row.review_status || 'open'}
                        className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                      >
                        <option value="open">{t('ops.careers.reviewOpen')}</option>
                        <option value="noted">{t('ops.careers.reviewNoted')}</option>
                        <option value="discarded">{t('ops.careers.reviewDiscarded')}</option>
                      </select>
                      <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                        {t('ops.team.save')}
                      </button>
                    </ToastForm>
                  ) : null}
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
