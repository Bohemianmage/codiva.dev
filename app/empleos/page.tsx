import Link from 'next/link';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import {
  JOB_EMPLOYMENT_LABELS,
  type JobEmploymentType,
} from '@/lib/ops/careers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Empleos',
  description: 'Vacantes abiertas en Codiva.dev. Únete al equipo y envía tu CV en minutos.',
};

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-codiva-primary/15 bg-white/80 px-3 py-1 text-xs font-medium text-zinc-700">
      {children}
    </span>
  );
}

export default async function EmpleosPage() {
  const postings = isSupabaseConfigured()
    ? (
        await createAdminClient()
          .from('ops_job_postings')
          .select('id, slug, title, location, employment_type, published_at')
          .eq('status', 'published')
          .order('sort_order', { ascending: true })
          .order('published_at', { ascending: false })
      ).data
    : [];

  const rows = postings ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-28 md:px-12">
      <header className="mb-8 overflow-hidden rounded-2xl border border-codiva-primary/15 bg-gradient-to-br from-teal-50 via-white to-zinc-50 px-6 py-8 text-center sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-codiva-primary">
          Únete al equipo
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Vacantes
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-zinc-600 sm:text-base">
          Software a la medida, en producción. Revisa las posiciones abiertas y envía tu CV en unos
          minutos.
        </p>
        {rows.length ? (
          <p className="mt-4 inline-flex rounded-full border border-codiva-primary/20 bg-white/90 px-4 py-1.5 text-xs font-semibold text-codiva-primary">
            {rows.length === 1 ? '1 posición abierta' : `${rows.length} posiciones abiertas`}
          </p>
        ) : null}
      </header>

      {!rows.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <h2 className="font-semibold text-zinc-900">Sin vacantes por ahora</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Vuelve pronto o escríbenos si quieres colaborar con Codiva.dev.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const employment =
              row.employment_type && row.employment_type in JOB_EMPLOYMENT_LABELS
                ? JOB_EMPLOYMENT_LABELS[row.employment_type as JobEmploymentType]
                : null;
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
                      </div>
                    </div>
                    <span className="mt-0.5 text-sm font-medium text-codiva-primary opacity-0 transition group-hover:opacity-100">
                      Ver vacante
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
