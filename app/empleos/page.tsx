import Link from 'next/link';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { jobEmploymentLabel, postingAsksDiscipline } from '@/lib/ops/careers';
import { catalogForPosting } from '@/lib/careers/assessments/engine';
import { getLocale, getT } from '@/i18n/locale';
import CodivaBrandText from '@/components/CodivaBrandText';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('career.doc_title_list'),
    description: t('career.meta_description_list'),
  };
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-codiva-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

export default async function EmpleosPage() {
  const t = await getT();
  const locale = t.locale;
  const postings = isSupabaseConfigured()
    ? (
        await createAdminClient()
          .from('ops_job_postings')
          .select('id, slug, title, location, employment_type, published_at, assessment_key')
          .eq('status', 'published')
          .order('sort_order', { ascending: true })
          .order('published_at', { ascending: false })
      ).data
    : [];

  const rows = postings ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-28 md:px-12">
      <header className="mb-8 overflow-hidden rounded-2xl border border-codiva-primary/15 bg-gradient-to-br from-codiva-primary/5 via-white to-zinc-50 px-6 py-8 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-codiva-primary">
          {t('career.eyebrow')}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {t('career.list_title')}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          {t('career.list_intro')}
        </p>
        <p lang="en" className="mx-auto mt-2 max-w-xl text-xs text-zinc-500">
          Open positions. Join the team.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">
          <Link href="/empleos/hallazgos" className="font-medium text-codiva-primary hover:underline">
            {t('career.hunt_cta')}
          </Link>
        </p>
        {rows.length ? (
          <p className="mt-4 inline-flex rounded-full border border-codiva-primary/20 bg-white/90 px-4 py-1.5 text-xs font-semibold text-codiva-primary">
            {rows.length === 1 ? t('career.open_one') : t('career.open_many', { count: rows.length })}
          </p>
        ) : null}
      </header>

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-zinc-900">{t('career.empty_title')}</h2>
          <p className="mt-2 text-sm text-zinc-500">
            <CodivaBrandText>{t('career.empty_body')}</CodivaBrandText>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const employment = jobEmploymentLabel(row.employment_type, locale);
            return (
              <li key={row.id}>
                <Link
                  href={`/empleos/${row.slug}`}
                  className="group block rounded-2xl border border-zinc-200 bg-white px-5 py-5 shadow-sm transition hover:border-codiva-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 transition group-hover:text-codiva-primary">
                        {row.title}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {employment ? <MetaChip>{employment}</MetaChip> : null}
                        {row.location ? <MetaChip>{row.location}</MetaChip> : null}
                        {catalogForPosting(row.assessment_key, row.slug) || postingAsksDiscipline(row.slug) ? (
                          <MetaChip>{t('career.assessment_chip')}</MetaChip>
                        ) : null}
                      </div>
                    </div>
                    <span className="mt-0.5 text-sm font-medium text-codiva-primary opacity-0 transition group-hover:opacity-100">
                      {t('career.view_role')}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
