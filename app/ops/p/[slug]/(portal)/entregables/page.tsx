import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { opsFileHref } from '@/lib/ops/storage';

export default async function PortalDeliverablesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('id, title, description, url, file_path, file_url, kind, sort_order')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order', { ascending: true });

  const operational = (deliverables ?? []).filter(
    (d) => !['architecture', 'mvp', 'proposal'].includes(d.kind ?? 'other')
  );

  return (
    <div>
      <h2 className="mb-1 text-lg font-semibold">Entregables</h2>
      <p className="mb-4 text-sm text-zinc-600">
        Entregas de proyecto. Arquitectura y MVP viven en la pestaña Propuesta.
      </p>
      <ul className="space-y-3">
        {operational.map((d) => (
          <li key={d.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-medium">{d.title}</p>
            {d.description && <p className="mt-1 text-zinc-600">{d.description}</p>}
            {d.url && (
              <a href={d.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-codiva-primary hover:underline">
                Abrir enlace
              </a>
            )}
            {opsFileHref(d.file_path, d.file_url) && (
              <a
                href={opsFileHref(d.file_path, d.file_url)!}
                target="_blank"
                rel="noreferrer"
                className="mt-2 ml-3 inline-block text-codiva-primary hover:underline"
              >
                Descargar
              </a>
            )}
          </li>
        ))}
        {!operational.length && <p className="text-sm text-zinc-500">Sin entregables operativos publicados aún.</p>}
      </ul>
    </div>
  );
}
