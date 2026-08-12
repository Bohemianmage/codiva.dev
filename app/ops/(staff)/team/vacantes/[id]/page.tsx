import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireAdminStaff } from '@/lib/ops/auth';
import { updateJobPosting } from '@/lib/ops/career-actions';
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  publicCareerUrl,
} from '@/lib/ops/careers';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function VacanteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminStaff();
  const { data: posting } = await supabase
    .from('ops_job_postings')
    .select(
      'id, slug, title, description, requirements, location, employment_type, status, sort_order'
    )
    .eq('id', id)
    .maybeSingle();

  if (!posting) notFound();

  async function onSave(formData: FormData) {
    'use server';
    await updateJobPosting(id, formData);
  }

  return (
    <div className="max-w-2xl">
      <OpsPageHeader
        title={posting.title}
        description="Edita la vacante. Al publicarla aparece en career.codiva.dev."
      />
      <p className="mb-6 text-sm">
        <Link href="/team?tab=bolsa" className="text-codiva-primary hover:underline">
          ← Bolsa de trabajo
        </Link>
        {posting.status === 'published' ? (
          <>
            {' · '}
            <a
              href={publicCareerUrl(posting.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-codiva-primary hover:underline"
            >
              Ver pública
            </a>
          </>
        ) : null}
      </p>

      <ToastForm
        success="Vacante actualizada"
        action={onSave}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <label className="block text-sm text-zinc-600">
          Título
          <input
            name="title"
            required
            defaultValue={posting.title}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-zinc-600">
          Slug
          <input
            name="slug"
            required
            defaultValue={posting.slug}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm text-zinc-600">
            Ubicación
            <input
              name="location"
              defaultValue={posting.location ?? ''}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-zinc-600">
            Tipo de empleo
            <select
              name="employmentType"
              defaultValue={posting.employment_type ?? 'full_time'}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              {JOB_EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {JOB_EMPLOYMENT_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-zinc-600">
            Estado
            <select
              name="status"
              defaultValue={posting.status}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
              <option value="closed">Cerrada</option>
            </select>
          </label>
          <label className="block text-sm text-zinc-600">
            Orden
            <input
              name="sortOrder"
              type="number"
              defaultValue={posting.sort_order ?? 0}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-sm text-zinc-600">
          Descripción
          <textarea
            name="description"
            rows={8}
            defaultValue={posting.description ?? ''}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm text-zinc-600">
          Requisitos
          <textarea
            name="requirements"
            rows={6}
            defaultValue={posting.requirements ?? ''}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          Guardar
        </button>
      </ToastForm>
    </div>
  );
}
