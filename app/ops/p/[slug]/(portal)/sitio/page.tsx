import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import CopyableUrl from '@/components/ops/CopyableUrl';
import SecretReveal from '@/components/ops/SecretReveal';
import PortalReleasesPanel from '@/components/ops/PortalReleasesPanel';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t('portal.site.title'),
    other: {
      'Cache-Control': 'private, no-store',
    },
  };
}

export default async function PortalSitioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);
  const t = await getT();
  const { SITE_ACCESS_KIND_LABELS } = labelsFor(t.locale);

  const [{ data: accessItems }, { data: releaseSettings }, { data: releaseRequests }] =
    await Promise.all([
      supabase
        .from('project_site_access')
        .select('id, label, kind, url, username, secret, notes, sort_order')
        .eq('project_id', project.id)
        .eq('visible_to_client', true)
        .order('sort_order', { ascending: true }),
      supabase.from('project_release_settings').select('*').eq('project_id', project.id).maybeSingle(),
      supabase
        .from('project_release_requests')
        .select(
          'id, project_id, status, preview_url, production_url, notes, commit_sha, commit_message, vercel_deployment_id, error_message, github_run_url, requested_by_kind, created_at, updated_at, completed_at'
        )
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

  const previewUrl = project.site_preview_url?.trim() || null;
  const productionUrl = project.site_production_url?.trim() || null;
  const hasUrls = Boolean(previewUrl || productionUrl);
  const items = accessItems ?? [];
  const releasesEnabled = Boolean(releaseSettings?.enabled);
  const empty = !hasUrls && items.length === 0 && !releasesEnabled;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t('portal.site.title')}</h2>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
          <p className="font-medium text-zinc-900">{t('portal.site.emptyTitle')}</p>
          <p className="mt-2 text-sm text-zinc-600">{t('portal.site.emptyBody')}</p>
        </div>
      ) : (
        <>
          {hasUrls && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-zinc-900">{t('portal.site.links')}</h3>
              <ul className="space-y-3 text-sm">
                {previewUrl && (
                  <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-500">{t('portal.site.preview')}</span>
                    <CopyableUrl href={previewUrl} />
                  </li>
                )}
                {productionUrl && (
                  <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-500">{t('portal.site.production')}</span>
                    <CopyableUrl href={productionUrl} />
                  </li>
                )}
              </ul>
            </section>
          )}

          <PortalReleasesPanel settings={releaseSettings} requests={releaseRequests ?? []} />

          {items.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-zinc-900">{t('portal.site.access')}</h3>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        {SITE_ACCESS_KIND_LABELS[item.kind] ?? item.kind}
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">{item.label}</p>
                    </div>
                    {item.url && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-zinc-500">{t('portal.site.url')}</span>
                        <CopyableUrl href={item.url} />
                      </div>
                    )}
                    {item.username && (
                      <p className="text-sm">
                        <span className="text-zinc-500">{t('portal.site.user')}</span>
                        <span className="font-mono text-zinc-800">{item.username}</span>
                      </p>
                    )}
                    {item.secret && <SecretReveal value={item.secret} />}
                    {item.notes?.trim() ? (
                      <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
