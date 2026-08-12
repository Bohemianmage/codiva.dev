import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import PortalClientUrl from '@/components/ops/PortalClientUrl';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { listVisibleProjectIds, requireStaff } from '@/lib/ops/auth';
import { createProject } from '@/lib/ops/actions';
import { can } from '@/lib/ops/permissions';
import { PROJECT_STATUS_LABELS, formatDate, EMPTY_LABEL } from '@/lib/ops/labels';
import { staffPortalPreviewPath } from '@/lib/ops/host';

export default async function ProjectsPage() {
  const access = await requireStaff();
  const { supabase, user, staff } = access;
  const canCreate = can(staff.role, 'projects_create');
  const visibleIds = await listVisibleProjectIds(supabase, user.id, staff.role);

  let projectsQuery = supabase
    .from('projects')
    .select('id, name, slug, status, progress_percent, client_visible, target_delivery_date, organizations(name)')
    .order('updated_at', { ascending: false });

  if (visibleIds) {
    if (visibleIds.length === 0) {
      projectsQuery = projectsQuery.in('id', ['00000000-0000-0000-0000-000000000000']);
    } else {
      projectsQuery = projectsQuery.in('id', visibleIds);
    }
  }

  const { data: projects } = await projectsQuery;

  async function onCreate(formData: FormData) {
    'use server';
    const id = await createProject(formData);
    const { redirectWithToast } = await import('@/lib/ops/toast');
    redirectWithToast(`/projects/${id}`, 'Proyecto creado');
  }

  return (
    <div>
      <OpsPageHeader
        title="Proyectos"
        description={
          can(staff.role, 'projects_all')
            ? 'Gestión de proyectos y portales de cliente'
            : 'Proyectos en los que estás asignado'
        }
      />

      {canCreate && (
        <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 font-semibold">Nuevo proyecto</h2>
          <ToastForm success="Creado" action={onCreate} className="grid gap-3 md:grid-cols-2">
            <input name="name" required placeholder="Nombre del proyecto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="organizationName" placeholder="Empresa cliente" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="contactEmail" type="email" placeholder="Email contacto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="targetDeliveryDate" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <textarea name="description" placeholder="Descripción" rows={2} className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <button type="submit" className="w-fit rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
              Crear proyecto
            </button>
          </ToastForm>
        </section>
      )}

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
                  <div className="flex flex-col items-start gap-1.5">
                    <Link href={staffPortalPreviewPath(p.slug)} className="text-codiva-primary hover:underline">
                      Vista previa
                    </Link>
                    <PortalClientUrl slug={p.slug} />
                    {!p.client_visible && (
                      <span className="text-[11px] text-amber-700">Aún oculto al cliente</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(p.target_delivery_date)}</td>
              </tr>
            ))}
            {!(projects ?? []).length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  No hay proyectos{can(staff.role, 'projects_all') ? '' : ' asignados'} aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
