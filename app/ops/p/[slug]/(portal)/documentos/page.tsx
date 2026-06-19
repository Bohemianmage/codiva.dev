import { requireProjectMember } from '@/lib/ops/auth';

export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('uploaded_at', { ascending: false });

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Documentos</h2>
      <ul className="space-y-3">
        {(documents ?? []).map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{d.title}</p>
              <p className="text-zinc-500 capitalize">{d.type.replace('_', ' ')}</p>
            </div>
            {d.file_url && (
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                Ver PDF
              </a>
            )}
          </li>
        ))}
        {!documents?.length && <p className="text-sm text-zinc-500">Sin documentos compartidos aún.</p>}
      </ul>
    </div>
  );
}
