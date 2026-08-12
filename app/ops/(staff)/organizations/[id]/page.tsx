import Link from 'next/link';
import { notFound } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { requireCapability } from '@/lib/ops/auth';
import { updateOrganization } from '@/lib/ops/actions';
import { EMPTY_LABEL, PROJECT_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireCapability('organizations');

  const { data: org } = await supabase.from('organizations').select('*').eq('id', id).maybeSingle();
  if (!org) notFound();

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, status, progress_percent, target_delivery_date')
    .eq('organization_id', id)
    .order('name');

  async function onUpdate(formData: FormData) {
    'use server';
    await updateOrganization(id, formData);
  }

  return (
    <div>
      <OpsPageHeader
        title={org.name}
        description="Datos de la organización cliente"
        actions={
          <Link href="/organizations" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
            Volver
          </Link>
        }
      />

      <ToastForm
        success="Guardado"
        action={onUpdate}
        className="mb-8 max-w-2xl space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">Datos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 sm:col-span-2">
            Nombre
            <input name="name" required defaultValue={org.name} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600">
            Email
            <input name="contactEmail" type="email" defaultValue={org.contact_email ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600">
            Teléfono
            <input name="contactPhone" defaultValue={org.contact_phone ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            URL logo
            <input name="logoUrl" defaultValue={org.logo_url ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <p className="text-xs text-zinc-400">Alta: {formatDate(org.created_at)}</p>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Guardar cambios
        </button>
      </ToastForm>

      <section className="space-y-3">
        <h2 className="font-semibold">Proyectos</h2>
        <ul className="space-y-2">
          {(projects ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
              <div>
                <Link href={`/projects/${p.id}`} className="font-medium hover:text-codiva-primary">
                  {p.name}
                </Link>
                <p className="text-xs text-zinc-400">
                  {p.progress_percent}% · Entrega {formatDate(p.target_delivery_date) || EMPTY_LABEL}
                </p>
              </div>
              <StatusBadge label={PROJECT_STATUS_LABELS[p.status] ?? p.status} tone={projectTone(p.status)} />
            </li>
          ))}
          {!(projects ?? []).length && (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
              Sin proyectos vinculados.
            </p>
          )}
        </ul>
      </section>
    </div>
  );
}
