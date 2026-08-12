import Link from 'next/link';
import { notFound } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import { requireCapability } from '@/lib/ops/auth';
import {
  addPortalUserProjects,
  removePortalUserProject,
  resendPortalInvite,
} from '@/lib/ops/actions';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function PortalUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase } = await requireCapability('portal_users');
  const t = await getT();
  const { formatDate } = labelsFor(t.locale);
  const admin = createAdminClient();

  const { data: authUser, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !authUser.user) notFound();

  const [{ data: memberships }, { data: allProjects }] = await Promise.all([
    supabase
      .from('project_members')
      .select(
        'id, role, invited_at, project_id, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version, projects(id, name, slug, organization_id, organizations(name))'
      )
      .eq('user_id', userId)
      .order('invited_at', { ascending: false }),
    supabase.from('projects').select('id, name, organizations(name)').order('name'),
  ]);

  const assignedIds = new Set((memberships ?? []).map((m) => m.project_id));
  const available = (allProjects ?? []).filter((p) => !assignedIds.has(p.id));
  const email = authUser.user.email ?? userId;

  async function onResend() {
    'use server';
    await resendPortalInvite(userId);
  }

  async function onAdd(formData: FormData) {
    'use server';
    await addPortalUserProjects(userId, formData);
  }

  return (
    <div>
      <OpsPageHeader
        title={email}
        description="Accesos del portal y estado de documentos legales"
      />

      <div className="max-w-2xl space-y-8">
        <div className="flex flex-wrap gap-3">
          <ToastForm success="Invitación reenviada" action={onResend}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Reenviar acceso
            </button>
          </ToastForm>
          <Link href="/users" className="rounded-lg px-4 py-2 text-sm text-codiva-primary hover:underline">
            ← Usuarios
          </Link>
        </div>

        <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Proyectos asignados</h2>
          <ul className="space-y-3 text-sm">
            {(memberships ?? []).map((m) => {
              const rawProject = m.projects as unknown;
              const project = (Array.isArray(rawProject) ? rawProject[0] : rawProject) as {
                id: string;
                name: string;
                slug: string;
                organizations?: { name?: string } | { name?: string }[] | null;
              } | null;
              const org = project?.organizations;
              const orgName = Array.isArray(org) ? org?.[0]?.name : org?.name;
              const acceptance = getAcceptanceStatus(m);
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-3"
                >
                  <div>
                    <Link
                      href={`/projects/${m.project_id}`}
                      className="font-medium text-codiva-primary hover:underline"
                    >
                      {project?.name ?? m.project_id.slice(0, 8)}
                    </Link>
                    <p className="text-zinc-500">
                      {m.role}
                      {orgName ? ` · ${orgName}` : ''} · invitado {formatDate(m.invited_at)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {acceptance.complete
                        ? 'Legales OK'
                        : `Pendiente: ${[
                            !acceptance.terms ? 'TyC' : null,
                            !acceptance.privacy ? 'Privacidad' : null,
                            !acceptance.nda ? 'NDA' : null,
                          ]
                            .filter(Boolean)
                            .join(', ')}`}
                    </p>
                  </div>
                  <ToastForm
                    success="Acceso quitado"
                    action={async () => {
                      'use server';
                      await removePortalUserProject(userId, m.project_id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      Quitar
                    </button>
                  </ToastForm>
                </li>
              );
            })}
            {!memberships?.length && (
              <p className="text-zinc-500">Sin proyectos asignados.</p>
            )}
          </ul>
        </section>

        {available.length > 0 && (
          <ToastForm
            success="Proyectos agregados"
            action={onAdd}
            className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
          >
            <h2 className="font-semibold">Agregar proyectos</h2>
            <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="viewer">Viewer</option>
              <option value="approver">Approver</option>
            </select>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3">
              {available.map((p) => {
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
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="sendEmail" />
              Enviar correo de aviso
            </label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">
              Agregar
            </button>
          </ToastForm>
        )}
      </div>
    </div>
  );
}
