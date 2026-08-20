import {
  createSiteAccess,
  deleteSiteAccess,
  updateProjectSiteUrls,
  updateSiteAccess,
} from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
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
  const t = await getT();
  const { SITE_ACCESS_KIND_LABELS } = labelsFor(t.locale);
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="font-semibold">{t('ops.siteAccess.title')}</h3>
        </div>
        <ToastForm success={t('ops.siteAccess.urlsSaved')}
          action={async (fd) => {
            'use server';
            await updateProjectSiteUrls(projectId, fd);
          }}
          className="space-y-3"
        >
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-zinc-700">{t('ops.siteAccess.previewUrl')}</span>
            <input
              name="sitePreviewUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              defaultValue={sitePreviewUrl ?? ''}
              placeholder="proyecto.vercel.app"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-zinc-700">{t('ops.siteAccess.productionUrl')}</span>
            <input
              name="siteProductionUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              defaultValue={siteProductionUrl ?? ''}
              placeholder="dominio-cliente.com"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
            {t('ops.siteAccess.saveUrls')}
          </button>
        </ToastForm>
      </div>

      <ToastForm success={t('ops.siteAccess.created')}
        action={async (fd) => {
          'use server';
          await createSiteAccess(projectId, fd);
        }}
        className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3"
      >
        <h3 className="font-semibold">{t('ops.siteAccess.add')}</h3>
        <input
          name="label"
          required
          placeholder={t('ops.siteAccess.labelPlaceholder')}
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
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder={t('ops.siteAccess.urlOptional')}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <input
          name="username"
          placeholder={t('ops.siteAccess.usernameOptional')}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
        <input
          name="secret"
          type="password"
          placeholder={t('ops.siteAccess.secretOptional')}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          autoComplete="new-password"
        />
        <textarea
          name="notes"
          rows={2}
          placeholder={t('ops.siteAccess.notesPlaceholder')}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="visibleToClient" defaultChecked /> {t('ops.siteAccess.visibleClient')}
        </label>
        <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
          {t('ops.siteAccess.create')}
        </button>
      </ToastForm>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <ToastForm success={t('ops.siteAccess.updated')}
              action={async (fd) => {
                'use server';
                await updateSiteAccess(item.id, projectId, fd);
              }}
              className="space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {SITE_ACCESS_KIND_LABELS[item.kind] ?? item.kind}
                  {!item.visible_to_client ? t('ops.siteAccess.hidden') : ''}
                  {item.secret ? t('ops.siteAccess.hasSecret') : ''}
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
                type="text"
                inputMode="url"
                autoComplete="url"
                defaultValue={item.url ?? ''}
                placeholder={t('ops.siteAccess.url')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="username"
                defaultValue={item.username ?? ''}
                placeholder={t('ops.siteAccess.username')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                autoComplete="off"
              />
              <input
                name="secret"
                type="password"
                placeholder={item.secret ? t('ops.siteAccess.secretReplace') : t('ops.siteAccess.secretNew')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                autoComplete="new-password"
              />
              {item.secret ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="keepSecret" defaultChecked /> {t('ops.siteAccess.keepSecret')}
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
                {t('ops.siteAccess.visibleClient')}
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
                  {t('ops.siteAccess.save')}
                </button>
              </div>
            </ToastForm>
            <ToastForm success={t('ops.siteAccess.deleted')}
              action={async () => {
                'use server';
                await deleteSiteAccess(item.id, projectId);
              }}
            >
              <button
                type="submit"
                className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                {t('ops.siteAccess.delete')}
              </button>
            </ToastForm>
          </li>
        ))}
        {!items.length && (
          <p className="text-sm text-zinc-500">{t('ops.siteAccess.empty')}</p>
        )}
      </ul>
    </div>
  );
}
