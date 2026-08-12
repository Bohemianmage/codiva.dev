import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { requireAdminStaff } from '@/lib/ops/auth';
import { getAssessmentCatalog } from '@/lib/careers/assessments/catalog';
import { parseAnswers } from '@/lib/careers/assessments/server';
import { reviewRowsForAttempt, scoreAnswers } from '@/lib/careers/assessments/engine';
import { huntSeedById } from '@/lib/careers/hunt/seeds';
import { matchedSeedCountsForDiscipline } from '@/lib/careers/hunt/match';
import { careerDisciplineLabels, disciplineFromCatalogKey } from '@/lib/ops/career-disciplines';
import { labelsFor } from '@/lib/ops/labels';
import { dateLocale } from '@/i18n/config';
import { getT, type Translator } from '@/i18n/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';

function formatDuration(ms: number | null | undefined, t: Translator) {
  if (!ms || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? t('ops.attempt.durationMin', { m, s }) : t('ops.attempt.durationSec', { s });
}

function optionLabel(
  options: { key: string; label: string }[],
  keys: string[],
  empty: string
) {
  if (!keys.length) return empty;
  return keys
    .map((key) => options.find((o) => o.key === key)?.label || key)
    .join(' · ');
}

export default async function AssessmentAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminStaff();
  const t = await getT();
  const { EMPTY_LABEL, formatDate } = labelsFor(t.locale);
  const DISCIPLINE_LABELS = careerDisciplineLabels(t.locale);

  const { data: attempt } = await supabase
    .from('ops_job_assessment_attempts')
    .select(
      'id, job_posting_id, catalog_key, full_name, email, status, attempt_number, started_at, completed_at, expires_at, time_limit_sec, question_ids, option_orders, answers, score_correct, score_total, score_pct, passed, duration_ms, blur_count, timezone, user_agent'
    )
    .eq('id', id)
    .maybeSingle();

  if (!attempt) notFound();

  const [{ data: posting }, { data: events }, { data: application }, { data: huntByAttempt }, { data: huntByEmail }] =
    await Promise.all([
    supabase.from('ops_job_postings').select('id, title, slug').eq('id', attempt.job_posting_id).maybeSingle(),
    supabase
      .from('ops_job_assessment_events')
      .select('id, event_type, question_id, payload, created_at')
      .eq('attempt_id', attempt.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('ops_job_applications')
      .select('id')
      .eq('assessment_attempt_id', attempt.id)
      .maybeSingle(),
    supabase
      .from('ops_hunt_reports')
      .select(
        'id, full_name, email, page_url, title, description, expected, matched_seed_id, discipline, assessment_attempt_id, created_at'
      )
      .eq('assessment_attempt_id', attempt.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('ops_hunt_reports')
      .select(
        'id, full_name, email, page_url, title, description, expected, matched_seed_id, discipline, assessment_attempt_id, created_at'
      )
      .ilike('email', attempt.email)
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  const catalog = getAssessmentCatalog(attempt.catalog_key);
  const answers = parseAnswers(attempt.answers);
  const questionIds = (attempt.question_ids as string[]) || [];
  const scored = catalog
    ? scoreAnswers(catalog, questionIds, answers)
    : { byQuestion: {} as Record<string, boolean>, pct: attempt.score_pct ?? 0 };
  const review = catalog
    ? reviewRowsForAttempt(catalog, questionIds, answers, scored.byQuestion)
    : [];
  const discipline = disciplineFromCatalogKey(attempt.catalog_key);
  const huntById = new Map<
    string,
    {
      id: string;
      title: string;
      page_url: string;
      description: string | null;
      expected: string | null;
      matched_seed_id: string | null;
      discipline: string | null;
      created_at: string;
    }
  >();
  for (const row of [...(huntByAttempt ?? []), ...(huntByEmail ?? [])]) {
    huntById.set(row.id, row);
  }
  const huntReports = [...huntById.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const craftHits = huntReports.filter((row) =>
    discipline ? matchedSeedCountsForDiscipline(row.matched_seed_id, discipline) : Boolean(row.matched_seed_id)
  ).length;

  const timeOnQuestion = new Map<string, number>();
  let lastView: { id: string; at: number } | null = null;
  for (const event of events ?? []) {
    const at = new Date(event.created_at).getTime();
    if (event.event_type === 'question_viewed' && event.question_id) {
      if (lastView) {
        timeOnQuestion.set(lastView.id, (timeOnQuestion.get(lastView.id) || 0) + (at - lastView.at));
      }
      lastView = { id: event.question_id, at };
    }
  }
  if (lastView && attempt.completed_at) {
    timeOnQuestion.set(
      lastView.id,
      (timeOnQuestion.get(lastView.id) || 0) + (new Date(attempt.completed_at).getTime() - lastView.at)
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <OpsPageHeader
        title={attempt.full_name}
        description={t('ops.attempt.description')}
      />
      <p className="text-sm">
        <Link href="/team?tab=bolsa" className="text-codiva-primary hover:underline">
          {t('ops.attempt.backJobs')}
        </Link>
        {posting ? (
          <>
            {' · '}
            <Link href={`/team/vacantes/${posting.id}`} className="text-codiva-primary hover:underline">
              {posting.title}
            </Link>
          </>
        ) : null}
      </p>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('ops.attempt.result')}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {attempt.passed
              ? t('ops.attempt.passed')
              : attempt.status === 'completed'
                ? t('ops.attempt.failed')
                : attempt.status}
            {attempt.score_pct != null ? ` · ${attempt.score_pct}%` : ''}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {t('ops.attempt.pts', {
              correct: attempt.score_correct ?? '—',
              total: attempt.score_total ?? '—',
              n: attempt.attempt_number,
            })}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('ops.attempt.time')}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{formatDuration(attempt.duration_ms, t)}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {t('ops.attempt.limit', {
              min: Math.round((attempt.time_limit_sec || 0) / 60),
              date: formatDate(attempt.started_at),
            })}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{t('ops.attempt.context')}</p>
          <p className="mt-1 text-sm text-zinc-800">{attempt.email}</p>
          <p className="mt-1 text-xs text-zinc-500">
            {attempt.timezone || t('ops.attempt.noTimezone')}
            {attempt.blur_count
              ? ` · ${t('ops.attempt.blurs', { count: attempt.blur_count })}`
              : ` · ${t('ops.attempt.noBlurs')}`}
            {application?.id ? ` · ${t('ops.attempt.applied')}` : ` · ${t('ops.attempt.notApplied')}`}
            {huntReports.length
              ? ` · ${t('ops.careers.findingsCount', { count: huntReports.length })}${
                  craftHits ? ` ${t('ops.careers.craftHits', { count: craftHits })}` : ''
                }`
              : ''}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.attempt.findingsTitle')}</h2>
        <p className="text-sm text-zinc-500">
          {t('ops.attempt.findingsHint', {
            craft: discipline ? t('ops.attempt.findingsHintCraft', { craft: DISCIPLINE_LABELS[discipline] }) : '',
          })}{' '}
          {t('ops.attempt.findingsHintRest')}
        </p>
        {!huntReports.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            {t('ops.attempt.findingsEmpty')}
          </p>
        ) : (
          <ul className="space-y-3">
            {huntReports.map((row) => {
              const seed = row.matched_seed_id ? huntSeedById(row.matched_seed_id) : null;
              const counts =
                discipline && seed ? matchedSeedCountsForDiscipline(seed.id, discipline) : false;
              return (
                <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">{row.title}</p>
                    <span
                      className={`text-xs font-semibold ${
                        counts ? 'text-codiva-primary' : seed ? 'text-zinc-600' : 'text-amber-700'
                      }`}
                    >
                      {counts
                        ? t('ops.attempt.countsForCraft')
                        : seed
                          ? t('ops.attempt.seedCraft', { craft: DISCIPLINE_LABELS[seed.craft] })
                          : t('ops.attempt.noSeed')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {row.page_url} · {formatDate(row.created_at)}
                  </p>
                  {seed ? <p className="mt-1 text-xs text-zinc-500">{seed.title}</p> : null}
                  <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{row.description}</p>
                  {row.expected ? (
                    <p className="mt-2 text-sm text-zinc-600">
                      <span className="font-medium text-zinc-800">{t('ops.attempt.expected')}</span>
                      {row.expected}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.attempt.answers')}</h2>
        {!review.length ? (
          <p className="text-sm text-zinc-500">{t('ops.attempt.noCatalog')}</p>
        ) : (
          <ol className="space-y-3">
            {review.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-codiva-primary">
                    {index + 1}. {row.competency}
                  </p>
                  <span className={`text-xs font-semibold ${row.ok ? 'text-codiva-primary' : 'text-red-700'}`}>
                    {row.ok ? t('ops.attempt.correct') : t('ops.attempt.incorrect')} ·{' '}
                    {formatDuration(timeOnQuestion.get(row.id) || 0, t)}
                  </span>
                </div>
                <p className="text-sm font-medium text-zinc-900">{row.prompt}</p>
                <p className="mt-2 text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">{t('ops.attempt.given')}</span>
                  {optionLabel(row.options, row.given, t('ops.attempt.noAnswer'))}
                </p>
                {!row.ok ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-800">{t('ops.attempt.expected')}</span>
                    {optionLabel(row.options, row.correct, t('ops.attempt.noAnswer'))}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.attempt.timeline')}</h2>
        {!events?.length ? (
          <p className="text-sm text-zinc-500">{t('ops.attempt.noEvents')}</p>
        ) : (
          <ol className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3 text-sm">
                <span className="w-36 shrink-0 tabular-nums text-zinc-400">
                  {new Date(event.created_at).toLocaleString(dateLocale(t.locale), {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span className="text-zinc-800">
                  {t(`ops.attempt.events.${event.event_type}`, { defaultValue: event.event_type })}
                  {event.question_id ? ` · ${event.question_id}` : ''}
                </span>
              </li>
            ))}
          </ol>
        )}
        {attempt.user_agent ? (
          <p className="text-xs text-zinc-400">{t('ops.attempt.agent', { ua: attempt.user_agent })}</p>
        ) : null}
        {!attempt.timezone && !attempt.user_agent ? (
          <p className="text-xs text-zinc-400">{EMPTY_LABEL}</p>
        ) : null}
      </section>
    </div>
  );
}
