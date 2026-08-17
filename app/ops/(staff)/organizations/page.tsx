import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { listVisibleProjectIds, projectIdInFilter, requireCapability } from '@/lib/ops/auth';
import { createOrganization } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { redirect } from 'next/navigation';

export default async function OrganizationsPage() {
  const { supabase, user, staff } = await requireCapability('organizations');
  const t = await getT();
  const { EMPTY_LABEL, formatDate } = labelsFor(t.locale);
  const visibleProjectIds = await listVisibleProjectIds(supabase, user.id, staff.role);

  let orgQuery = supabase
    .from('organizations')
    .select('id, name, contact_email, contact_phone, created_at, projects(id)')
    .order('name', { ascending: true });

  if (visibleProjectIds) {
    const { data: assigned } = await supabase
      .from('projects')
      .select('organization_id')
      .in('id', projectIdInFilter(visibleProjectIds)!);
    const orgIds = [...new Set((assigned ?? []).map((p) => p.organization_id).filter(Boolean))] as string[];
    orgQuery = orgQuery.in('id', orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: orgs } = await orgQuery;

  async function onCreate(formData: FormData) {
    'use server';
    const id = await createOrganization(formData);
    redirect(`/organizations/${id}`);
  }

  return (
    <div>
      <OpsPageHeader
        title={t('ops.pages.organizations')}
        description={t('ops.pages.organizationsDesc')}
      />

      <ToastForm
        success={t('ops.orgs.created')}
        action={onCreate}
        className="mb-8 max-w-2xl space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">{t('ops.orgs.newTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required placeholder={t('ops.orgs.name')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
          <input name="contactEmail" type="email" placeholder={t('ops.orgs.contactEmail')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="contactPhone" placeholder={t('ops.orgs.phone')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <input name="logoUrl" placeholder={t('ops.orgs.logoUrl')} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2" />
        </div>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          {t('ops.orgs.create')}
        </button>
      </ToastForm>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">{t('ops.orgs.colOrg')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.orgs.colContact')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.orgs.colProjects')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.orgs.colCreated')}</th>
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
        {!orgs?.length && <p className="p-6 text-sm text-zinc-500">{t('ops.orgs.empty')}</p>}
      </div>
    </div>
  );
}
