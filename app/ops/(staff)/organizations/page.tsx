import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireCapability } from '@/lib/ops/auth';
import { createOrganization } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { redirect } from 'next/navigation';

export default async function OrganizationsPage() {
  const { supabase } = await requireCapability('organizations');
  const t = await getT();
  const { EMPTY_LABEL, formatDate } = labelsFor(t.locale);

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, contact_email, contact_phone, created_at, projects(id)')
    .order('name', { ascending: true });

  async function onCreate(formData: FormData) {
    'use server';
    const id = await createOrganization(formData);
    redirect(`/organizations/${id}`);
  }

  return (
    <div>
      <OpsPageHeader
        title="Organizaciones"
        description="Clientes y empresas vinculadas a proyectos."
      />

      <ToastForm
        success="Organización creada"
        action={onCreate}
        className="mb-8 max-w-2xl space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">Nueva organización</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder="Nombre" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="contactEmail" type="email" placeholder="Email de contacto" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="contactPhone" placeholder="Teléfono" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="logoUrl" placeholder="URL logo (opcional)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
        </div>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          Crear
        </button>
      </ToastForm>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Organización</th>
              <th className="px-4 py-3 font-medium">Contacto</th>
              <th className="px-4 py-3 font-medium">Proyectos</th>
              <th className="px-4 py-3 font-medium">Alta</th>
            </tr>
          </thead>
          <tbody>
            {(orgs ?? []).map((org) => {
              const projectCount = Array.isArray(org.projects) ? org.projects.length : 0;
              return (
                <tr key={org.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link href={`/organizations/${org.id}`} className="font-medium hover:text-codiva-primary">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    <div>{org.contact_email || EMPTY_LABEL}</div>
                    <div className="text-xs text-zinc-400">{org.contact_phone || ''}</div>
                  </td>
                  <td className="px-4 py-3">{projectCount}</td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(org.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!orgs?.length && <p className="p-6 text-sm text-zinc-500">Aún no hay organizaciones.</p>}
      </div>
    </div>
  );
}
