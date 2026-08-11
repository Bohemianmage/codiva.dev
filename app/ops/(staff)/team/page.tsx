import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireAdminStaff } from '@/lib/ops/auth';
import { inviteStaff, updateStaffProfile } from '@/lib/ops/actions';
import { EMPTY_LABEL, formatDate } from '@/lib/ops/labels';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  dev: 'Desarrollador',
};

export default async function TeamPage() {
  const { supabase } = await requireAdminStaff();
  const admin = createAdminClient();

  const { data: staffRows } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role, active, created_at')
    .order('created_at', { ascending: true });

  const emails = new Map<string, string>();
  await Promise.all(
    (staffRows ?? []).map(async (row) => {
      const { data } = await admin.auth.admin.getUserById(row.id);
      if (data.user?.email) emails.set(row.id, data.user.email);
    })
  );

  async function onInvite(formData: FormData) {
    'use server';
    await inviteStaff(formData);
  }

  return (
    <div>
      <OpsPageHeader
        title="Equipo"
        description="Usuarios staff de Codiva Ops. Solo administradores pueden gestionar el equipo."
      />

      <div className="max-w-2xl space-y-8">
        <p className="text-sm">
          <Link href="/settings" className="text-codiva-primary hover:underline">
            ← Configuración
          </Link>
        </p>

        <ToastForm
          success="Invitación enviada"
          action={onInvite}
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
        >
          <h2 className="font-semibold">Invitar staff</h2>
          <input
            name="email"
            type="email"
            required
            placeholder="nombre@codiva.dev"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="fullName"
            type="text"
            placeholder="Nombre completo"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="role" defaultValue="pm" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="admin">Administrador</option>
            <option value="pm">Project Manager</option>
            <option value="dev">Desarrollador</option>
          </select>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
            Enviar acceso a Ops
          </button>
        </ToastForm>

        <section className="space-y-3">
          <h2 className="font-semibold">Miembros</h2>
          <ul className="space-y-3">
            {(staffRows ?? []).map((row) => (
              <li key={row.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{row.full_name || EMPTY_LABEL}</p>
                    <p className="text-sm text-zinc-500">{emails.get(row.id) ?? row.id.slice(0, 8)}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Desde {formatDate(row.created_at)} ·{' '}
                      {row.active ? 'Activo' : 'Inactivo'}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">
                    {ROLE_LABELS[row.role] ?? row.role}
                  </span>
                </div>
                <ToastForm
                  success="Perfil actualizado"
                  action={async (fd) => {
                    'use server';
                    await updateStaffProfile(row.id, fd);
                  }}
                  className="grid gap-2 sm:grid-cols-3"
                >
                  <input
                    name="fullName"
                    defaultValue={row.full_name ?? ''}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-1"
                  />
                  <select
                    name="role"
                    defaultValue={row.role}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="admin">Administrador</option>
                    <option value="pm">Project Manager</option>
                    <option value="dev">Desarrollador</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="active" defaultChecked={row.active} />
                    Activo
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 sm:col-span-3"
                  >
                    Guardar
                  </button>
                </ToastForm>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
