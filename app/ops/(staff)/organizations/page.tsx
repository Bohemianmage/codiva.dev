import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import Button from '@/components/ui/Button';
import { SectionTitle } from '@/components/ui/Card';
import { DataTable, EmptyRow, THead, Td, Th, Tr } from '@/components/ui/DataTable';
import Input from '@/components/ui/Input';
import { listVisibleProjectIds, projectIdInFilter, requireCapability } from '@/lib/ops/auth';
import { createOrganization } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { redirect } from 'next/navigation';

export default async function OrganizationsPage() {
  const { supabase, user, staff } = await requireCapability('organizations');
  const t = await getT();
  const { EMPTY_LABEL, formatDate } = labelsFor(t.locale);
  const visibleProjectIds = await listVisibleProjectIds(supabase, user.id, staff);

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
      <OpsPageHeader title={t('ops.pages.organizations')} description={t('ops.pages.organizationsDesc')} />

      <ToastForm
        success={t('ops.orgs.created')}
        action={onCreate}
        className="mb-8 max-w-2xl space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <SectionTitle>{t('ops.orgs.newTitle')}</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="name" required placeholder={t('ops.orgs.name')} size="sm" className="sm:col-span-2" />
          <Input name="contactEmail" type="email" placeholder={t('ops.orgs.contactEmail')} size="sm" />
          <Input name="contactPhone" placeholder={t('ops.orgs.phone')} size="sm" />
          <Input name="logoUrl" placeholder={t('ops.orgs.logoUrl')} size="sm" className="sm:col-span-2" />
        </div>
        <Button type="submit" size="sm">
          {t('ops.orgs.create')}
        </Button>
      </ToastForm>

      <DataTable>
        <THead>
          <tr>
            <Th>{t('ops.orgs.colOrg')}</Th>
            <Th>{t('ops.orgs.colContact')}</Th>
            <Th>{t('ops.orgs.colProjects')}</Th>
            <Th>{t('ops.orgs.colCreated')}</Th>
          </tr>
        </THead>
        <tbody>
          {(orgs ?? []).map((org) => {
            const projectCount = Array.isArray(org.projects) ? org.projects.length : 0;
            return (
              <Tr key={org.id}>
                <Td>
                  <Link href={`/organizations/${org.id}`} className="font-medium hover:text-codiva-primary">
                    {org.name}
                  </Link>
                </Td>
                <Td className="text-zinc-600">
                  <div>{org.contact_email || EMPTY_LABEL}</div>
                  <div className="text-xs text-zinc-400">{org.contact_phone || ''}</div>
                </Td>
                <Td>{projectCount}</Td>
                <Td className="text-zinc-500">{formatDate(org.created_at)}</Td>
              </Tr>
            );
          })}
          {!orgs?.length && <EmptyRow colSpan={4}>{t('ops.orgs.empty')}</EmptyRow>}
        </tbody>
      </DataTable>
    </div>
  );
}
