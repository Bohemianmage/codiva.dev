import { requireProjectMember } from '@/lib/ops/auth';

export default async function PortalDeliverablesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Entregables</h2>
      <ul className="space-y-3">
        {(deliverables ?? []).map((d) => (
          <li key={d.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
            <p className="font-medium">{d.title}</p>
            {d.description && <p className="mt-1 text-zinc-600">{d.description}</p>}
            {d.url && (
              <a href={d.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-codiva-primary hover:underline">
                Abrir enlace
              </a>
            )}
            {d.file_url && (
              <a href={d.file_url} target="_blank" rel="noreferrer" className="mt-2 ml-3 inline-block text-codiva-primary hover:underline">
                Descargar
              </a>
            )}
          </li>
        ))}
        {!deliverables?.length && <p className="text-sm text-zinc-500">Sin entregables publicados aún.</p>}
      </ul>
    </div>
  );
}
