import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireStaff } from '@/lib/ops/auth';
import { EMPTY_LABEL, formatDate } from '@/lib/ops/labels';
import { publishLegalVersionAndNotify } from '@/lib/ops/actions';
import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';
import Link from 'next/link';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  dev: 'Desarrollador',
};

export default async function SettingsPage() {
  const { user, staff, supabase } = await requireStaff();

  const { data: versions } = await supabase
    .from('legal_document_versions')
    .select('kind, version_code, changelog, published_at')
    .eq('kind', 'bundle')
    .order('published_at', { ascending: false })
    .limit(5);

  async function onPublish(formData: FormData) {
    'use server';
    await publishLegalVersionAndNotify(formData);
  }

  return (
    <div>
      <OpsPageHeader title="Configuración" description="Tu perfil y legales del portal" />
      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Tu cuenta</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Nombre</dt>
              <dd>{staff.full_name || EMPTY_LABEL}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Rol</dt>
              <dd>{ROLE_LABELS[staff.role] ?? staff.role}</dd>
            </div>
          </dl>
          {staff.role === 'admin' && (
            <p className="mt-4 text-sm">
              <Link href="/team" className="text-codiva-primary hover:underline">
                Gestionar equipo y altas →
              </Link>
            </p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-1 font-semibold">Legales del portal</h2>
          <p className="mb-4 text-sm text-zinc-600">
            Versión en código: <strong>{LEGAL_DOCS_VERSION}</strong> ({LEGAL_UPDATED_LABEL}).
            Al publicar con notificación, los usuarios con aceptación desactualizada reciben correo
            y deben re-aceptar en su próximo acceso.
          </p>
          <p className="mb-4 text-sm">
            <Link href="/legal/terminos" className="text-codiva-primary hover:underline">
              TyC
            </Link>
            {' · '}
            <Link href="/legal/aviso-privacidad" className="text-codiva-primary hover:underline">
              Privacidad
            </Link>
            {' · '}
            <Link href="/legal/nda" className="text-codiva-primary hover:underline">
              NDA
            </Link>
          </p>

          <ToastForm success="Versión publicada" action={onPublish} className="space-y-3 rounded-lg bg-zinc-50 p-4">
            <input
              name="versionCode"
              defaultValue={LEGAL_DOCS_VERSION}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              placeholder="Versión (ej. 2026.08.06)"
            />
            <textarea
              name="changelog"
              rows={2}
              placeholder="Changelog (qué cambió)"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sendEmails" />
              Enviar correo de re-aceptación a miembros desactualizados
            </label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
              Publicar versión en bitácora
            </button>
          </ToastForm>

          <ul className="mt-4 space-y-2 text-sm">
            {(versions ?? []).map((v) => (
              <li key={`${v.version_code}-${v.published_at}`} className="rounded-lg border border-zinc-100 px-3 py-2">
                <p className="font-medium">{v.version_code}</p>
                <p className="text-zinc-500">{formatDate(v.published_at)}</p>
                {v.changelog && <p className="mt-1 text-zinc-600">{v.changelog}</p>}
              </li>
            ))}
            {!versions?.length && (
              <p className="text-zinc-500">Sin versiones registradas aún (se crean al publicar).</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
