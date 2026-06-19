import OpsPageHeader from '@/components/ops/OpsPageHeader';
import { requireStaff } from '@/lib/ops/auth';

export default async function SettingsPage() {
  const { user, staff } = await requireStaff();

  return (
    <div>
      <OpsPageHeader title="Configuración" description="Cuenta y setup de Codiva Ops" />
      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Tu cuenta</h2>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-zinc-500">Email</dt><dd>{user.email}</dd></div>
            <div><dt className="text-zinc-500">Nombre</dt><dd>{staff.full_name || '—'}</dd></div>
            <div><dt className="text-zinc-500">Rol</dt><dd className="capitalize">{staff.role}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Primer setup (Supabase)</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-700">
            <li>Crea un proyecto en Supabase y aplica la migración en <code className="rounded bg-zinc-100 px-1">supabase/migrations/</code></li>
            <li>Configura las variables de entorno en Vercel (ver <code className="rounded bg-zinc-100 px-1">.env.example</code>)</li>
            <li>Crea un usuario en Supabase Auth (Authentication → Users)</li>
            <li>Inserta su fila en <code className="rounded bg-zinc-100 px-1">staff_profiles</code> con su UUID</li>
            <li>Apunta <code className="rounded bg-zinc-100 px-1">ops.codiva.dev</code> al mismo proyecto Vercel</li>
          </ol>
          <pre className="mt-4 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs text-zinc-100">
{`INSERT INTO staff_profiles (id, full_name, role)
VALUES ('TU-USER-UUID', 'Tu Nombre', 'admin');`}
          </pre>
        </section>
      </div>
    </div>
  );
}
