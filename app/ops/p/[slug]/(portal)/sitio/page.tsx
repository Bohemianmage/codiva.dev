import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import SecretReveal from '@/components/ops/SecretReveal';
import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { SITE_ACCESS_KIND_LABELS } from '@/lib/ops/labels';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Tu sitio',
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

  const { data: accessItems } = await supabase
    .from('project_site_access')
    .select('id, label, kind, url, username, secret, notes, sort_order')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order', { ascending: true });

  const previewUrl = project.site_preview_url?.trim() || null;
  const productionUrl = project.site_production_url?.trim() || null;
  const hasUrls = Boolean(previewUrl || productionUrl);
  const items = accessItems ?? [];
  const empty = !hasUrls && items.length === 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Tu sitio</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Aquí encuentras las URLs de tu desarrollo y, cuando aplique, los accesos que te compartimos
          (preview, producción o admin).
        </p>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center">
          <p className="font-medium text-zinc-900">Aún no hay preview publicado</p>
          <p className="mt-2 text-sm text-zinc-600">
            Cuando tengamos una URL de desarrollo o accesos listos para ti, aparecerán en esta
            sección.
          </p>
        </div>
      ) : (
        <>
          {hasUrls && (
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
              <h3 className="font-semibold text-zinc-900">Enlaces</h3>
              <ul className="space-y-3 text-sm">
                {previewUrl && (
                  <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-500">Preview / staging</span>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-codiva-primary hover:underline"
                    >
                      {previewUrl}
                    </a>
                  </li>
                )}
                {productionUrl && (
                  <li className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-zinc-500">Producción</span>
                    <a
                      href={productionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-codiva-primary hover:underline"
                    >
                      {productionUrl}
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {items.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-semibold text-zinc-900">Accesos</h3>
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
                      <p className="text-sm">
                        <span className="text-zinc-500">URL: </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="break-all text-codiva-primary hover:underline"
                        >
                          {item.url}
                        </a>
                      </p>
                    )}
                    {item.username && (
                      <p className="text-sm">
                        <span className="text-zinc-500">Usuario: </span>
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
