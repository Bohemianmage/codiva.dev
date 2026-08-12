import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import CareerAssessment from '@/components/careers/CareerAssessment';
import { catalogForApplication, catalogForPosting } from '@/lib/careers/assessments/engine';
import {
  CAREER_DISCIPLINES,
  CAREER_DISCIPLINE_LABELS,
  isCareerDiscipline,
  postingAsksDiscipline,
  publicCareerUrl,
} from '@/lib/ops/careers';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ discipline?: string }>;
};

export const dynamic = 'force-dynamic';

async function loadPublishedPosting(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createAdminClient()
    .from('ops_job_postings')
    .select('id, slug, title, status, assessment_key')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const posting = await loadPublishedPosting(slug);
  if (!posting) return { title: 'Prueba no disponible' };
  return {
    title: `Prueba · ${posting.title}`,
    description: `Prueba de criterio para la vacante ${posting.title} en Codiva.dev.`,
    robots: { index: false, follow: false },
  };
}

export default async function EmpleoPruebaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { discipline: disciplineRaw } = await searchParams;
  const posting = await loadPublishedPosting(slug);
  if (!posting) notFound();

  const asksDiscipline = postingAsksDiscipline(posting.slug);
  const discipline = isCareerDiscipline(disciplineRaw || '') ? disciplineRaw : null;

  if (asksDiscipline && !discipline) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 pb-24 pt-28 md:px-12">
        <Link
          href={`/empleos/${posting.slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-codiva-primary hover:underline"
        >
          ← {posting.title}
        </Link>
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Elige el oficio de la prueba
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            Son testers con especialidad. Cada oficio tiene su propia prueba de criterio.
          </p>
        </header>
        <ul className="space-y-2">
          {CAREER_DISCIPLINES.map((key) => (
            <li key={key}>
              <Link
                href={`/empleos/${posting.slug}/prueba?discipline=${key}`}
                className="block rounded-2xl border border-zinc-200 bg-white px-5 py-4 font-medium text-zinc-900 transition hover:border-codiva-primary/40"
              >
                {CAREER_DISCIPLINE_LABELS[key]}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  const catalog = asksDiscipline
    ? catalogForApplication(posting.assessment_key, posting.slug, discipline)
    : catalogForPosting(posting.assessment_key, posting.slug);
  if (!catalog) notFound();

  const applyHref = discipline
    ? `${publicCareerUrl(posting.slug)}?discipline=${discipline}`
    : publicCareerUrl(posting.slug);
  const heading = discipline ? CAREER_DISCIPLINE_LABELS[discipline] : posting.title;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-24 pt-28 md:px-12">
      <Link
        href={`/empleos/${posting.slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-codiva-primary hover:underline"
      >
        ← {posting.title}
      </Link>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          {catalog.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">{catalog.intro}</p>
      </header>
      <CareerAssessment
        jobPostingId={posting.id}
        jobSlug={posting.slug}
        jobTitle={heading}
        applyHref={applyHref}
        discipline={discipline || undefined}
      />
    </main>
  );
}
