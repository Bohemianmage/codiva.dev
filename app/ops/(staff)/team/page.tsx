import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireAdminStaff } from '@/lib/ops/auth';
import {
  createPersonnelOffer,
  inviteStaff,
  updateStaffProfile,
} from '@/lib/ops/actions';
import {
  OFFER_STATUS_LABELS,
  OPS_ROLE_LABELS,
  WORK_MODALITY_LABELS,
} from '@/lib/ops/offer-letter';
import { EMPTY_LABEL, formatCurrency, formatDate } from '@/lib/ops/labels';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  pm: 'Project Manager',
  dev: 'Desarrollador',
};

const DEFAULT_RESPONSIBILITIES = `Coordinar el avance de proyectos de software a la medida y productos digitales.
Ser el punto de contacto operativo entre cliente, diseño y desarrollo.
Dar seguimiento a alcance, tiempos, riesgos y entregables en Codiva Ops.
Mantener claridad de prioridades y comunicar bloqueos a tiempo.
Apoyar la documentación operativa del proyecto (hitos, tickets, entregables).`;

function tabClass(active: boolean) {
  return active
    ? 'border-b-2 border-codiva-primary px-1 pb-2 text-sm font-semibold text-codiva-primary'
    : 'border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-zinc-500 hover:text-zinc-800';
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === 'ofertas' ? 'ofertas' : 'miembros';

  const { supabase } = await requireAdminStaff();
  const admin = createAdminClient();

  const [{ data: staffRows }, { data: offers }] = await Promise.all([
    supabase
      .from('staff_profiles')
      .select('id, full_name, role, active, created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('ops_personnel_offers')
      .select(
        'id, full_name, email, position_title, ops_role, monthly_compensation, currency, work_modality, status, issued_at, created_at'
      )
      .order('created_at', { ascending: false }),
  ]);

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

  async function onCreateOffer(formData: FormData) {
    'use server';
    await createPersonnelOffer(formData);
  }

  return (
    <div>
      <OpsPageHeader
        title="Equipo"
        description="Acceso a Ops, altas y cartas oferta del personal de operaciones. Solo administradores."
      />

      <div className="mb-8 flex gap-6 border-b border-zinc-200">
        <Link href="/team?tab=miembros" className={tabClass(tab === 'miembros')}>
          Miembros Ops
        </Link>
        <Link href="/team?tab=ofertas" className={tabClass(tab === 'ofertas')}>
          Cartas oferta
          {(offers ?? []).length > 0 ? (
            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
              {(offers ?? []).length}
            </span>
          ) : null}
        </Link>
      </div>

      {tab === 'miembros' ? (
        <div className="max-w-2xl space-y-8">
          <ToastForm
            success="Invitación enviada"
            action={onInvite}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">Invitar staff</h2>
            <p className="text-sm text-zinc-500">
              Crea o reactiva acceso a Codiva Ops. Para formalizar una oferta económica, usa la pestaña Cartas oferta.
            </p>
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
                        Desde {formatDate(row.created_at)} · {row.active ? 'Activo' : 'Inactivo'}
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
      ) : (
        <div className="max-w-3xl space-y-8">
          <ToastForm
            success="Carta oferta creada"
            loading="Creando…"
            action={onCreateOffer}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">Nueva carta oferta</h2>
            <p className="text-sm text-zinc-500">
              Formaliza compensación y condiciones. El acceso a Ops se gestiona en Miembros Ops.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="fullName"
                required
                placeholder="Nombre completo"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="positionTitle"
                required
                defaultValue="Project Manager"
                placeholder="Puesto"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="opsRole" defaultValue="pm" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="pm">Project Manager</option>
                <option value="dev">Desarrollador</option>
                <option value="admin">Administrador</option>
              </select>
              <input
                name="monthlyCompensation"
                type="number"
                required
                min={1}
                step="0.01"
                defaultValue={1200}
                placeholder="Compensación mensual"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="currency" defaultValue="USD" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
              </select>
              <select name="workModality" defaultValue="remote" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="remote">Remoto</option>
                <option value="hybrid">Híbrido</option>
                <option value="onsite">Presencial</option>
              </select>
              <select name="status" defaultValue="draft" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceptada</option>
              </select>
              <label className="text-sm text-zinc-600">
                Inicio
                <input
                  name="startDate"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600">
                Vigencia de la oferta
                <input
                  name="validUntil"
                  type="date"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Fecha de emisión
                <input
                  name="issuedAt"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Responsabilidades (una por línea)
                <textarea
                  name="responsibilities"
                  rows={5}
                  defaultValue={DEFAULT_RESPONSIBILITIES}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Condiciones (opcional; si vacío usa el texto estándar)
                <textarea
                  name="terms"
                  rows={4}
                  placeholder="Dejar vacío para usar condiciones estándar"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-zinc-600 sm:col-span-2">
                Notas internas (no aparecen en la carta)
                <textarea
                  name="notesInternal"
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              Crear carta oferta
            </button>
          </ToastForm>

          <section className="space-y-3">
            <h2 className="font-semibold">Ofertas</h2>
            {!(offers ?? []).length ? (
              <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
                Aún no hay cartas oferta. Crea la primera arriba.
              </p>
            ) : (
              <ul className="space-y-3">
                {(offers ?? []).map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/team/ofertas/${row.id}`}
                      className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-codiva-primary/40"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{row.full_name}</p>
                          <p className="text-sm text-zinc-500">
                            {row.position_title} · {OPS_ROLE_LABELS[row.ops_role] ?? row.ops_role}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            {formatCurrency(Number(row.monthly_compensation), row.currency || 'USD')} / mes ·{' '}
                            {WORK_MODALITY_LABELS[row.work_modality] ?? row.work_modality}
                            {row.email ? ` · ${row.email}` : ''}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">
                            Emitida {row.issued_at ? formatDate(row.issued_at) : EMPTY_LABEL} ·{' '}
                            {formatDate(row.created_at)}
                          </p>
                        </div>
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">
                          {OFFER_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
