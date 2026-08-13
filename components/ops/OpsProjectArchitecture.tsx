import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import {
  createArchitectureCanvas,
  setDeliverableVisibility,
  hydrateArchitectureFromPacks,
} from '@/lib/ops/actions';
import { isCanvasKind, portalCanvasPath } from '@/lib/ops/architecture';
import { staffPortalPreviewPath } from '@/lib/ops/host';
import { requireStaff } from '@/lib/ops/auth';

export default async function OpsProjectArchitecture({
  projectId,
  slug,
  kindLabels,
  canEdit,
}: {
  projectId: string;
  slug: string;
  kindLabels: Record<string, string>;
  canEdit: boolean;
}) {
  if (canEdit) {
    await hydrateArchitectureFromPacks(projectId);
  }

  const { supabase } = await requireStaff();
  const { data: canvases } = await supabase
    .from('deliverables')
    .select('id, title, description, kind, url, body_html, visible_to_client, sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true });

  const items = (canvases ?? []).filter((row) => isCanvasKind(row.kind));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="font-semibold">Arquitectura y propuesta</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Aquí se crea y edita el canvas. El cliente lo ve en la pestaña <strong>Propuesta</strong> del
          portal. En proyectos existentes, el pack estático se copia a Ops al abrir esta pestaña.
        </p>
        <Link
          href={staffPortalPreviewPath(slug, '/propuesta')}
          className="mt-3 inline-block text-sm font-medium text-codiva-primary hover:underline"
        >
          Ver como el cliente (Propuesta)
        </Link>
      </div>

      {canEdit && (
        <ToastForm
          success="Canvas creado"
          action={async (formData) => {
            'use server';
            await createArchitectureCanvas(projectId, formData);
          }}
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
        >
          <h3 className="font-semibold">Nuevo canvas</h3>
          <input
            name="title"
            required
            placeholder="Título"
            defaultValue="Arquitectura"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="kind" defaultValue="architecture" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="architecture">Arquitectura</option>
            <option value="mvp">MVP / alcance</option>
            <option value="proposal">Propuesta / identidad</option>
          </select>
          <input
            name="sortOrder"
            type="number"
            defaultValue={items.length + 1}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            placeholder="Descripción breve para el portal"
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="visibleToClient" defaultChecked />
            Visible al cliente
          </label>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
            Crear y editar
          </button>
        </ToastForm>
      )}

      <ul className="space-y-2">
        {items.map((item) => {
          const source = item.body_html?.trim() ? 'Ops' : item.url ? 'Pack estático' : 'Borrador';
          return (
            <li key={item.id} className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-zinc-500">
                    {kindLabels[item.kind ?? ''] ?? item.kind}
                    {' · '}
                    {item.visible_to_client ? 'visible al cliente' : 'solo Ops'}
                    {' · '}
                    {source}
                  </p>
                  {item.description && <p className="mt-1 text-zinc-600">{item.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/projects/${projectId}/arquitectura/${item.id}`}
                    className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-medium text-white"
                  >
                    Editar en Ops
                  </Link>
                  <Link
                    href={portalCanvasPath(slug, item.id)}
                    target="_blank"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    Abrir canvas
                  </Link>
                  {canEdit && (
                    <ToastForm
                      success="Visibilidad actualizada"
                      action={async () => {
                        'use server';
                        await setDeliverableVisibility(projectId, item.id, !item.visible_to_client);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {item.visible_to_client ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </ToastForm>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {!items.length && (
          <p className="text-sm text-zinc-500">Aún no hay arquitectura. Crea el primer canvas arriba.</p>
        )}
      </ul>
    </div>
  );
}
