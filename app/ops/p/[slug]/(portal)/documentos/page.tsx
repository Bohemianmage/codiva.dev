import { requirePortalMemberWithAcceptances } from '@/lib/ops/auth';
import { clientUploadDocument } from '@/lib/ops/actions';
import { DOCUMENT_SOURCE_LABELS, DOCUMENT_TYPE_LABELS, formatDate } from '@/lib/ops/labels';
import { opsFileHref } from '@/lib/ops/storage';

export default async function PortalDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requirePortalMemberWithAcceptances(slug);

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .is('disposed_at', null)
    .order('uploaded_at', { ascending: false });

  const shared = (documents ?? []).filter((d) => d.source !== 'client');
  const inbound = (documents ?? []).filter((d) => d.source === 'client');

  async function onUpload(formData: FormData) {
    'use server';
    await clientUploadDocument(project.id, slug, formData);
  }

  function hrefFor(d: { id: string; file_path: string | null; file_url: string | null }) {
    const base = opsFileHref(d.file_path, d.file_url);
    if (!base) return null;
    if (base.startsWith('/api/ops/file')) {
      return `${base}&documentId=${encodeURIComponent(d.id)}`;
    }
    return base;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Documentos compartidos</h2>
        <p className="mb-4 text-sm text-zinc-600">NDA, contratos y materiales enviados por Codiva.</p>
        <ul className="space-y-3">
          {shared.map((d) => {
            const href = hrefFor(d);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-zinc-500">
                    {DOCUMENT_TYPE_LABELS[d.type] ?? d.type}
                    {d.signed ? ' · Firmado' : ''}
                    {' · '}
                    {formatDate(d.uploaded_at)}
                  </p>
                </div>
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                    Ver / descargar
                  </a>
                )}
              </li>
            );
          })}
          {!shared.length && <p className="text-sm text-zinc-500">Sin documentos compartidos aún.</p>}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 text-lg font-semibold">Tu bandeja</h2>
        <p className="mb-4 text-sm text-zinc-600">
          Sube el NDA firmado u otros documentos que Codiva te solicite (PDF, imagen o ZIP · máx. 10 MB).
          Los accesos quedan registrados.
        </p>
        <form action={onUpload} className="mb-6 space-y-3 rounded-xl bg-zinc-50 p-4">
          <input
            name="title"
            placeholder="Título (ej. NDA firmado)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <select name="type" defaultValue="nda" className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
            <option value="nda">NDA firmado</option>
            <option value="contract">Contrato firmado</option>
            <option value="other">Otro documento</option>
          </select>
          <textarea
            name="notes"
            rows={2}
            placeholder="Notas opcionales"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.doc,.docx" className="w-full text-sm" />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="signed" defaultChecked />
            Marcar como firmado
          </label>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
            Subir documento
          </button>
        </form>

        <ul className="space-y-3">
          {inbound.map((d) => {
            const href = hrefFor(d);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-zinc-500">
                    {DOCUMENT_TYPE_LABELS[d.type] ?? d.type} · {DOCUMENT_SOURCE_LABELS[d.source] ?? d.source}
                    {d.signed ? ' · Firmado' : ''}
                    {' · '}
                    {formatDate(d.uploaded_at)}
                  </p>
                  {d.notes && <p className="mt-1 text-zinc-600">{d.notes}</p>}
                </div>
                {href && (
                  <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                    Ver
                  </a>
                )}
              </li>
            );
          })}
          {!inbound.length && <p className="text-sm text-zinc-500">Aún no has subido documentos.</p>}
        </ul>
      </section>
    </div>
  );
}
