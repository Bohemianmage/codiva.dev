import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import CareerApplyForm from '@/components/careers/CareerApplyForm';
import CareerPostingBody from '@/components/careers/CareerPostingBody';
import {
  JOB_EMPLOYMENT_LABELS,
  parseCareerPostingSections,
  publicCareerUrl,
  type JobEmploymentType,
} from '@/lib/ops/careers';
import { marketingBaseUrl } from '@/lib/ops/host';

type PageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

async function loadPublishedPosting(slug: string) {
  if (!isSupabaseConfigured()) return null;
  const { data } = await createAdminClient()
    .from('ops_job_postings')
    .select('id, slug, title, description, requirements, location, employment_type, published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const posting = await loadPublishedPosting(slug);
  if (!posting) {
    return { title: 'Vacante no disponible' };
  }
  return {
    title: posting.title,
    description: `Vacante ${posting.title} en Codiva.dev. Revisa el perfil y postula con tu CV.`,
    openGraph: {
      title: `${posting.title} · Codiva.dev`,
      url: publicCareerUrl(posting.slug),
    },
  };
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-codiva-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

export default async function EmpleoDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const posting = await loadPublishedPosting(slug);
  if (!posting) notFound();

  const employment =
    posting.employment_type && posting.employment_type in JOB_EMPLOYMENT_LABELS
      ? JOB_EMPLOYMENT_LABELS[posting.employment_type as JobEmploymentType]
      : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: posting.title,
    description: [posting.description, posting.requirements].filter(Boolean).join('\n\n'),
    datePosted: posting.published_at,
    hiringOrganization: {
      '@type': 'Organization',
      name: 'Codiva.dev',
      sameAs: marketingBaseUrl(),
    },
    employmentType: posting.employment_type
      ? posting.employment_type.toUpperCase()
      : undefined,
    jobLocationType: /remoto/i.test(posting.location || '') ? 'TELECOMMUTE' : undefined,
    url: publicCareerUrl(posting.slug),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-24 pt-28 md:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link
        href="/empleos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-codiva-primary hover:underline"
      >
        ← Volver al listado
      </Link>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start lg:gap-8">
        <article className="min-w-0">
          <header className="mb-6 rounded-2xl border border-codiva-primary/15 bg-gradient-to-br from-teal-50 via-white to-white px-5 py-6 shadow-sm sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-codiva-primary">
              Únete al equipo
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {posting.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {employment ? <MetaChip>{employment}</MetaChip> : null}
              {posting.location ? <MetaChip>{posting.location}</MetaChip> : null}
            </div>
          </header>

          <div className="space-y-4">
            {posting.description ? (
              <CareerPostingBody
                sections={parseCareerPostingSections(posting.description)}
                fallbackTitle="Sobre el puesto"
              />
            ) : null}
            {posting.requirements ? (
              <CareerPostingBody
                sections={parseCareerPostingSections(posting.requirements)}
                fallbackTitle="Requisitos"
              />
            ) : null}
          </div>
        </article>

        <aside className="mt-8 lg:sticky lg:top-28 lg:mt-0">
          <CareerApplyForm jobPostingId={posting.id} />
        </aside>
      </div>
    </main>
  );
}
