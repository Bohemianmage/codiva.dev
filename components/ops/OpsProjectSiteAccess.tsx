import {
  createSiteAccess,
  deleteSiteAccess,
  updateProjectSiteUrls,
  updateSiteAccess,
} from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getLocale } from '@/i18n/locale';
import ToastForm from '@/components/ops/ToastForm';

type SiteAccessRow = {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  username: string | null;
  secret: string | null;
  notes: string;
  visible_to_client: boolean;
  sort_order: number;
};

export default async function OpsProjectSiteAccess({
  projectId,
  sitePreviewUrl,
  siteProductionUrl,
  items,
}: {
  projectId: string;
  sitePreviewUrl: string | null;
  siteProductionUrl: string | null;
  items: SiteAccessRow[];
}) {
  const { SITE_ACCESS_KIND_LABELS } = labelsFor(await getLocale());
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-semibold">Sitio del cliente</h3>
          <p className="mt-1 text-sm text-zinc-600">
            URLs del desarrollo y accesos que el cliente verá en <strong>Tu sitio</strong>. No pegues
            secretos de terceros si basta con invitarlos a Vercel o 1Password. Si algo se filtra,
            rótalo.
          </p>
        </div>
        <ToastForm success="URLs guardadas"
          action={async (fd) => {
            'use server';
            await updateProjectSiteUrls(projectId, fd);
          }}
          className="space-y-3"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-zinc-700">URL preview / staging</span>
            <input
              name="sitePreviewUrl"
              type="url"
              defaultValue={sitePreviewUrl ?? ''}
              placeholder="https://proyecto.vercel.app"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-zinc-700">URL producción</span>
            <input
              name="siteProductionUrl"
              type="url"
              defaultValue={siteProductionUrl ?? ''}
              placeholder="https://dominio-cliente.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
            Guardar URLs
          </button>
        </ToastForm>
      </div>

      <ToastForm success="Acceso creado"
        action={async (fd) => {
          'use server';
          await createSiteAccess(projectId, fd);
        }}
        className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3"
      >
        <h3 className="font-semibold">Agregar acceso</h3>
        <input
          name="label"
          required
          placeholder="Ej. Preview Vercel, Admin CMS"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <select name="kind" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" defaultValue="preview">
          {Object.entries(SITE_ACCESS_KIND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="url"
          type="url"
          placeholder="URL del acceso (opcional)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="username"
          placeholder="Usuario (opcional)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
        <input
          name="secret"
          type="password"
          placeholder="Contraseña / token (opcional)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          autoComplete="new-password"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder="Notas (ej. te invitamos a Vercel Protection)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente
        </label>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          Crear acceso
        </button>
      </ToastForm>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <ToastForm success="Acceso actualizado"
              action={async (fd) => {
                'use server';
                await updateSiteAccess(item.id, projectId, fd);
              }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {SITE_ACCESS_KIND_LABELS[item.kind] ?? item.kind}
                  {!item.visible_to_client ? ' · oculto' : ''}
                  {item.secret ? ' · tiene secreto' : ''}
                </p>
              </div>
              <input
                name="label"
                required
                defaultValue={item.label}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select
                name="kind"
                defaultValue={item.kind}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                {Object.entries(SITE_ACCESS_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                name="url"
                type="url"
                defaultValue={item.url ?? ''}
                placeholder="URL"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="username"
                defaultValue={item.username ?? ''}
                placeholder="Usuario"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                autoComplete="off"
              />
              <input
                name="secret"
                type="password"
                placeholder={item.secret ? 'Nueva contraseña (deja vacío para conservar)' : 'Contraseña / token'}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                autoComplete="new-password"
              />
              {item.secret ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="keepSecret" defaultChecked /> Conservar secreto actual si el
                  campo queda vacío
                </label>
              ) : null}
              <textarea
                name="notes"
                rows={2}
                defaultValue={item.notes}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="visibleToClient" defaultChecked={item.visible_to_client} />{' '}
                Visible al cliente
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
                  Guardar
                </button>
              </div>
            </ToastForm>
            <ToastForm success="Eliminado"
              action={async () => {
                'use server';
                await deleteSiteAccess(item.id, projectId);
              }}
            >
              <button
                type="submit"
                className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                Eliminar acceso
              </button>
            </ToastForm>
          </li>
        ))}
        {!items.length && (
          <p className="text-sm text-zinc-500">Sin ítems de acceso. Las URLs del proyecto bastan si no hay login.</p>
        )}
      </ul>
    </div>
  );
}
