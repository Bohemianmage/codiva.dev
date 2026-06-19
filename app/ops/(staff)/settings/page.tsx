import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { requireStaff } from '@/lib/ops/auth';
import { EMPTY_LABEL } from '@/lib/ops/labels';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  dev: 'Desarrollador',
};

export default async function SettingsPage() {
  const { user, staff } = await requireStaff();

  return (
    <div>
      <OpsPageHeader title="Configuración" description="Tu perfil en Codiva Ops" />
      <div className="max-w-2xl">
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
        </section>
      </div>
    </div>
  );
}
