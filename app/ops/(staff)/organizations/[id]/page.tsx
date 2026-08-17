import Link from 'next/link';
import { notFound } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { listVisibleProjectIds, projectIdInFilter, requireCapability } from '@/lib/ops/auth';
import { updateOrganization } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user, staff } = await requireCapability('organizations');
  const t = await getT();
  const { EMPTY_LABEL, PROJECT_STATUS_LABELS, formatDate } = labelsFor(t.locale);

  const { data: org } = await supabase.from('organizations').select('*').eq('id', id).maybeSingle();
  if (!org) notFound();

  let projectsQuery = supabase
    .from('projects')
    .select('id, name, slug, status, progress_percent, target_delivery_date')
    .eq('organization_id', id)
    .order('name');
  const visibleIds = projectIdInFilter(await listVisibleProjectIds(supabase, user.id, staff.role));
  if (visibleIds) {
    projectsQuery = projectsQuery.in('id', visibleIds);
  }
  const { data: projects } = await projectsQuery;
  if (visibleIds && !(projects ?? []).length) notFound();

  async function onUpdate(formData: FormData) {
    'use server';
    await updateOrganization(id, formData);
  }

  return (
    <div>
      <OpsPageHeader
        title={org.name}
        description={t('ops.orgs.detailDesc')}
        actions={
          <Link href="/organizations" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
            {t('ops.orgs.back')}
          </Link>
        }
      />

      <ToastForm
        success={t('ops.orgs.saved')}
        action={onUpdate}
        className="mb-8 max-w-2xl space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <h2 className="font-semibold">{t('ops.orgs.data')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.orgs.name')}
            <input name="name" required defaultValue={org.name} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600">
            {t('ops.orgs.contactEmail')}
            <input name="contactEmail" type="email" defaultValue={org.contact_email ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600">
            {t('ops.orgs.phone')}
            <input name="contactPhone" defaultValue={org.contact_phone ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-sm text-zinc-600 sm:col-span-2">
            {t('ops.orgs.logoUrlLabel')}
            <input name="logoUrl" defaultValue={org.logo_url ?? ''} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <p className="text-xs text-zinc-400">{t('ops.orgs.createdOn', { date: formatDate(org.created_at) })}</p>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          {t('ops.orgs.save')}
        </button>
      </ToastForm>

      <section className="space-y-3">
        <h2 className="font-semibold">{t('ops.orgs.projects')}</h2>
        <ul className="space-y-2">
          {(projects ?? []).map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
              <div>
                <Link href={`/projects/${p.id}`} className="font-medium hover:text-codiva-primary">
                  {p.name}
                </Link>
                <p className="text-xs text-zinc-400">
                  {t('ops.orgs.deliveryPct', {
                    pct: p.progress_percent,
                    date: formatDate(p.target_delivery_date) || EMPTY_LABEL,
                  })}
                </p>
              </div>
              <StatusBadge label={PROJECT_STATUS_LABELS[p.status] ?? p.status} tone={projectTone(p.status)} />
            </li>
          ))}
          {!(projects ?? []).length && (
            <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
              {t('ops.orgs.noProjects')}
            </p>
          )}
        </ul>
      </section>
    </div>
  );
}
