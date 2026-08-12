import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge from '@/components/ops/StatusBadge';
import {
  JOB_APPLICATION_STATUS_LABELS,
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  JOB_POSTING_STATUS_LABELS,
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
import { EMPTY_LABEL, formatDate } from '@/lib/ops/labels';

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
  status: string;
  created_at: string;
  personnel_offer_id: string | null;
  original_filename: string | null;
  ops_job_postings: { title: string; slug: string } | { title: string; slug: string }[] | null;
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

function postingTitle(row: OpsJobApplicationRow): string {
  const posting = Array.isArray(row.ops_job_postings) ? row.ops_job_postings[0] : row.ops_job_postings;
  return posting?.title || EMPTY_LABEL;
}

export default function OpsCareersPanel({
  postings,
  applications,
}: {
  postings: OpsJobPostingRow[];
  applications: OpsJobApplicationRow[];
}) {
  async function onCreate(formData: FormData) {
    'use server';
    await createJobPosting(formData);
  }

  return (
    <div className="max-w-4xl space-y-10">
      <ToastForm
        success="Vacante creada"
        action={onCreate}
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">Nueva vacante</h2>
        <p className="text-sm text-zinc-500">
          Los borradores no aparecen en{' '}
          <a href={publicCareerListUrl()} className="text-codiva-primary hover:underline">
            career.codiva.dev
          </a>
          . Publica cuando el texto esté listo.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="title"
            required
            placeholder="Título del puesto"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <input
            name="slug"
            placeholder="slug-opcional"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="location"
            placeholder="Ubicación (ej. Remoto · México)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="employmentType" defaultValue="full_time" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {JOB_EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {JOB_EMPLOYMENT_LABELS[type]}
              </option>
            ))}
          </select>
          <select name="status" defaultValue="draft" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="closed">Cerrada</option>
          </select>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            Descripción
            <textarea
              name="description"
              rows={5}
              placeholder={'Descripción:\nConstruimos software a la medida…\n- Responsabilidad 1'}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            Requisitos
            <textarea
              name="requirements"
              rows={4}
              placeholder={'- Experiencia con TypeScript\n- Comunicación clara'}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          Crear vacante
        </button>
      </ToastForm>

      <section className="space-y-3">
        <h2 className="font-semibold">Vacantes</h2>
        {!postings.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            Aún no hay vacantes. Crea la primera arriba.
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
                    <p className="mt-1 text-xs text-zinc-400">Actualizada {formatDate(row.updated_at)}</p>
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
                    Editar
                  </Link>
                  {row.status === 'published' ? (
                    <a
                      href={publicCareerUrl(row.slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      Ver pública
                    </a>
                  ) : null}
                  {row.status === 'draft' ? (
                    <ToastForm
                      success="Vacante eliminada"
                      action={async () => {
                        'use server';
                        await deleteDraftJobPosting(row.id);
                      }}
                    >
                      <button type="submit" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
                        Eliminar borrador
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
        <h2 className="font-semibold">Postulaciones</h2>
        {!applications.length ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
            Todavía no hay postulaciones.
          </p>
        ) : (
          <ul className="space-y-3">
            {applications.map((row) => (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.full_name}</p>
                    <p className="text-sm text-zinc-500">
                      {row.email}
                      {row.phone ? ` · ${row.phone}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {postingTitle(row)} · {formatDate(row.created_at)}
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
                    Descargar CV
                  </a>
                  {row.personnel_offer_id ? (
                    <Link
                      href={`/team/ofertas/${row.personnel_offer_id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                    >
                      Ver carta oferta
                    </Link>
                  ) : (
                    <ToastForm
                      success="Carta oferta creada"
                      loading="Creando…"
                      action={async () => {
                        'use server';
                        await createPersonnelOfferFromApplication(row.id);
                      }}
                    >
                      <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                        Contratar
                      </button>
                    </ToastForm>
                  )}
                  <ToastForm
                    success="Estado actualizado"
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
                      <option value="new">Nueva</option>
                      <option value="reviewed">Revisada</option>
                      <option value="hired">Contratada</option>
                      <option value="rejected">Descartada</option>
                    </select>
                    <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                      Guardar
                    </button>
                  </ToastForm>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
