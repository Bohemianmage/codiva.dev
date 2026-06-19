import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { createProject } from '@/lib/ops/actions';
import { PROJECT_STATUS_LABELS, formatDate, EMPTY_LABEL } from '@/lib/ops/labels';
import { opsBaseUrl } from '@/lib/ops/host';

export default async function ProjectsPage() {
  const { supabase } = await requireStaff();
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, status, progress_percent, client_visible, target_delivery_date, organizations(name)')
    .order('updated_at', { ascending: false });

  async function onCreate(formData: FormData) {
    'use server';
    const id = await createProject(formData);
    const { redirect } = await import('next/navigation');
    redirect(`/projects/${id}`);
  }

  return (
    <div>
      <OpsPageHeader title="Proyectos" description="Gestión de proyectos y portales de cliente" />

      <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 font-semibold">Nuevo proyecto</h2>
        <form action={onCreate} className="grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Nombre del proyecto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="organizationName" placeholder="Empresa cliente" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="contactEmail" type="email" placeholder="Email contacto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="targetDeliveryDate" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Descripción" rows={2} className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-fit rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
            Crear proyecto
          </button>
        </form>
      </section>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Proyecto</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Portal</th>
              <th className="px-4 py-3 font-medium">Entrega</th>
            </tr>
          </thead>
          <tbody>
            {(projects ?? []).map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/projects/${p.id}`} className="font-medium hover:text-codiva-primary">
                    {p.name}
                  </Link>
                  <div className="text-xs text-zinc-500">{p.progress_percent}% avance</div>
                </td>
                <td className="px-4 py-3">{(p.organizations as { name?: string })?.name || EMPTY_LABEL}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={PROJECT_STATUS_LABELS[p.status]} tone={projectTone(p.status)} />
                </td>
                <td className="px-4 py-3">
                  {p.client_visible ? (
                    <a href={`${opsBaseUrl()}/p/${p.slug}`} className="text-codiva-primary hover:underline" target="_blank" rel="noreferrer">
                      /p/{p.slug}
                    </a>
                  ) : (
                    <span className="text-zinc-400">Oculto</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(p.target_delivery_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!projects?.length && <p className="p-6 text-sm text-zinc-500">No hay proyectos</p>}
      </div>
    </div>
  );
}
