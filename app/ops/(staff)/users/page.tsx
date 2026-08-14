import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { listVisibleProjectIds, projectIdInFilter, requireCapability } from '@/lib/ops/auth';
import { invitePortalUser } from '@/lib/ops/actions';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { createAdminClient } from '@/lib/supabase/admin';

type MemberRow = {
  user_id: string;
  role: string;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  nda_accepted_at: string | null;
  nda_version: string | null;
  projects: { id: string; name: string; organization_id: string | null } | null;
};

export default async function PortalUsersPage() {
  const { supabase, user, staff } = await requireCapability('portal_users');
  const admin = createAdminClient();
  const visibleIds = projectIdInFilter(await listVisibleProjectIds(supabase, user.id, staff.role));

  let membersQuery = supabase
    .from('project_members')
    .select(
      'user_id, role, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version, projects(id, name, organization_id)'
    )
    .order('invited_at', { ascending: false });
  let projectsQuery = supabase.from('projects').select('id, name, status, organizations(name)').order('name');
  if (visibleIds) {
    membersQuery = membersQuery.in('project_id', visibleIds);
    projectsQuery = projectsQuery.in('id', visibleIds);
  }

  const [{ data: members }, { data: projects }] = await Promise.all([membersQuery, projectsQuery]);

  const byUser = new Map<
    string,
    {
      roles: Set<string>;
      projects: { id: string; name: string }[];
      allComplete: boolean;
    }
  >();

  for (const row of (members ?? []) as unknown as MemberRow[]) {
    const project = row.projects;
    const entry = byUser.get(row.user_id) ?? {
      roles: new Set<string>(),
      projects: [],
      allComplete: true,
    };
    entry.roles.add(row.role);
    if (project && !entry.projects.some((p) => p.id === project.id)) {
      entry.projects.push({ id: project.id, name: project.name });
    }
    if (!getAcceptanceStatus(row).complete) entry.allComplete = false;
    byUser.set(row.user_id, entry);
  }

  const emails = new Map<string, string>();
  await Promise.all(
    [...byUser.keys()].map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data.user?.email) emails.set(userId, data.user.email);
    })
  );

  async function onInvite(formData: FormData) {
    'use server';
    await invitePortalUser(formData);
  }

  return (
    <div>
      <OpsPageHeader
        title="Usuarios del portal"
        description="Clientes con acceso a uno o más proyectos. Una invitación puede cubrir varios proyectos."
      />

      <div className="max-w-3xl space-y-8">
        <ToastForm
          success="Invitación enviada"
          action={onInvite}
          className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
        >
          <h2 className="font-semibold">Invitar usuario</h2>
          <input
            name="email"
            type="email"
            required
            placeholder="email@cliente.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="viewer">Viewer: solo lectura</option>
            <option value="approver">Approver: puede aceptar cotización</option>
          </select>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-zinc-700">Proyectos</legend>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {(projects ?? []).map((p) => {
                const org = p.organizations as { name?: string } | { name?: string }[] | null;
                const orgName = Array.isArray(org) ? org[0]?.name : org?.name;
                return (
                  <label key={p.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="projectIds" value={p.id} className="mt-1" />
                    <span>
                      {p.name}
                      {orgName ? <span className="text-zinc-500"> · {orgName}</span> : null}
                    </span>
                  </label>
                );
              })}
              {!projects?.length && (
                <p className="text-sm text-zinc-500">No hay proyectos todavía.</p>
              )}
            </div>
          </fieldset>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
            Enviar acceso
          </button>
        </ToastForm>

        <section className="space-y-3">
          <h2 className="font-semibold">Usuarios</h2>
          <ul className="space-y-2">
            {[...byUser.entries()].map(([userId, info]) => (
              <li key={userId}>
                <Link
                  href={`/users/${userId}`}
                  className="block rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-codiva-primary/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{emails.get(userId) ?? userId.slice(0, 8)}</p>
                      <p className="text-sm text-zinc-500">
                        {info.projects.map((p) => p.name).join(' · ') || 'Sin proyectos'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-zinc-700">
                        {[...info.roles].join(', ')}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                          info.allComplete
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {info.allComplete ? 'Legales OK' : 'Legales pendientes'}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
            {!byUser.size && (
              <p className="text-sm text-zinc-500">Aún no hay usuarios del portal.</p>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
