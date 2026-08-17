import Link from 'next/link';
import HuntEvidenceLightbox from '@/components/ops/HuntEvidenceLightbox';
import ToastForm from '@/components/ops/ToastForm';
import { getAssessmentCatalog } from '@/lib/careers/assessments/catalog';
import { huntSeedById } from '@/lib/careers/hunt/seeds';
import { huntDifficultyLabel } from '@/lib/careers/hunt/score';
import { updateHuntReportReview } from '@/lib/ops/career-actions';
import { careerDisciplineLabels } from '@/lib/ops/career-disciplines';
import type { OfferCareerFile } from '@/lib/ops/offer-career-file';
import type { Translator } from '@/i18n/locale';

export default function OpsOfferCareerFile({
  offerId,
  file,
  t,
  locale,
  formatDate,
}: {
  offerId: string;
  file: OfferCareerFile;
  t: Translator;
  locale: 'es' | 'en';
  formatDate: (value: string | null | undefined) => string;
}) {
  const DISCIPLINE_LABELS = careerDisciplineLabels(locale);
  const findings = file.findings;
  const empty = !file.attempts.length && !file.applications.length && !findings.length;

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <h2 className="font-semibold">{t('ops.offer.careerTitle')}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t('ops.offer.careerHint')}</p>
        {file.emails.length ? (
          <p className="mt-1 text-xs text-zinc-400">{file.emails.join(' · ')}</p>
        ) : null}
      </div>

      {empty ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-sm text-zinc-500">
          {file.emails.length ? t('ops.offer.careerEmpty') : t('ops.offer.careerNeedsEmail')}
        </p>
      ) : null}

      {file.attempts.length ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800">{t('ops.offer.careerAttempts')}</h3>
          <ul className="space-y-2">
            {file.attempts.map((row) => {
              const catalog = getAssessmentCatalog(row.catalog_key);
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-900">{catalog?.title || row.catalog_key}</p>
                    <p className="text-xs text-zinc-500">{formatDate(row.completed_at || row.started_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-zinc-700">
                      {row.passed
                        ? t('ops.attempt.passed')
                        : row.status === 'completed'
                          ? t('ops.attempt.failed')
                          : row.status}
                      {row.score_pct != null ? ` · ${row.score_pct}%` : ''}
                    </span>
                    <Link
                      href={`/team/intentos/${row.id}`}
                      className="rounded-lg border border-zinc-300 px-2.5 py-1 text-xs hover:bg-zinc-50"
                    >
                      {t('ops.careers.viewProgress')}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {file.applications.length ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800">{t('ops.offer.careerApplications')}</h3>
          <ul className="space-y-2">
            {file.applications.map((row) => (
              <li key={row.id} className="rounded-lg border border-zinc-100 px-3 py-2 text-sm">
                <p className="font-medium text-zinc-900">{row.posting_title || t('ops.offer.careerApplication')}</p>
                <p className="text-xs text-zinc-500">
                  {row.status} · {formatDate(row.created_at)}
                </p>
                {row.original_filename ? (
                  <a
                    href={`/api/ops/careers/cv?id=${row.id}`}
                    className="mt-1 inline-block text-xs text-codiva-primary hover:underline"
                  >
                    {row.original_filename}
                  </a>
                ) : null}
                {row.cover_letter ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{row.cover_letter}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {findings.length ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-800">{t('ops.offer.careerFindings')}</h3>
          <ul className="space-y-3">
            {findings.map((row) => {
              const seed = row.matched_seed_id ? huntSeedById(row.matched_seed_id) : null;
              return (
                <li key={row.id} className="rounded-lg border border-zinc-100 px-3 py-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">{row.title}</p>
                    <span className={`text-xs font-semibold ${seed ? 'text-zinc-600' : 'text-amber-700'}`}>
                      {seed
                        ? t('ops.attempt.seedCraft', { craft: DISCIPLINE_LABELS[seed.craft] })
                        : t('ops.attempt.noSeed')}
                      {seed
                        ? ` · ${t('ops.careers.difficulty', {
                            label: huntDifficultyLabel(seed.difficulty, locale),
                          })}`
                        : ''}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    {row.page_url} · {formatDate(row.created_at)}
                  </p>
                  {seed ? <p className="mt-1 text-xs text-zinc-500">{seed.title}</p> : (
                    <p className="mt-1 text-xs text-zinc-500">{t('ops.careers.noMatchHint')}</p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{row.description}</p>
                  {row.expected ? (
                    <p className="mt-2 text-sm text-zinc-600">
                      <span className="font-medium text-zinc-800">{t('ops.attempt.expected')}</span>
                      {row.expected}
                    </p>
                  ) : null}
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
                      <input type="hidden" name="offer_id" value={offerId} />
                      {row.assessment_attempt_id ? (
                        <input type="hidden" name="attempt_id" value={row.assessment_attempt_id} />
                      ) : null}
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
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
