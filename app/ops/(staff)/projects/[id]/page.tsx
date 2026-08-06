import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import {
  updateProject,
  createMilestone,
  updateMilestone,
  addMilestoneUpdate,
  createQuote,
  sendQuote,
  inviteProjectMember,
  uploadDocument,
  createDeliverable,
  markDocumentSigned,
  runDocumentRetentionDisposal,
} from '@/lib/ops/actions';
import {
  PROJECT_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  DELIVERABLE_KIND_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_SOURCE_LABELS,
  formatDate,
  formatCurrency,
} from '@/lib/ops/labels';
import { opsBaseUrl } from '@/lib/ops/host';
import OpsQuoteForm from '@/components/ops/OpsQuoteForm';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { LEGAL_DOCS_VERSION } from '@/lib/ops/legal/version';
import { opsFileHref } from '@/lib/ops/storage';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'resumen' } = await searchParams;
  const { supabase } = await requireStaff();

  const { data: project } = await supabase
    .from('projects')
    .select('*, organizations(*)')
    .eq('id', id)
    .single();

  if (!project) redirect('/projects');

  const [
    { data: milestones },
    { data: quotes },
    { data: documents },
    { data: deliverables },
    { data: members },
    { data: tickets },
  ] = await Promise.all([
    supabase.from('milestones').select('*, milestone_updates(*)').eq('project_id', id).order('sort_order'),
    supabase.from('quotes').select('*').eq('project_id', id).order('version', { ascending: false }),
    supabase.from('documents').select('*').eq('project_id', id).order('uploaded_at', { ascending: false }),
    supabase.from('deliverables').select('*').eq('project_id', id).order('sort_order', { ascending: true }),
    supabase
      .from('project_members')
      .select(
        'id, role, invited_at, user_id, terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version'
      )
      .eq('project_id', id),
    supabase.from('tickets').select('id, title, status, priority, created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(10),
  ]);

  const admin = createAdminClient();
  const [{ data: fileAccess }, { data: recentActivity }] = await Promise.all([
    admin
      .from('file_access_log')
      .select('id, file_path, action, actor_id, created_at, document_id, ip, user_agent')
      .eq('project_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('activity_log')
      .select('id, entity_type, action, actor_id, metadata, created_at')
      .contains('metadata', { project_id: id })
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const memberEmails = new Map<string, string>();
  const actorIds = new Set<string>();
  (members ?? []).forEach((m) => actorIds.add(m.user_id));
  (fileAccess ?? []).forEach((a) => {
    if (a.actor_id) actorIds.add(a.actor_id);
  });
  (recentActivity ?? []).forEach((a) => {
    if (a.actor_id) actorIds.add(a.actor_id);
  });
  await Promise.all(
    [...actorIds].map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data.user?.email) memberEmails.set(userId, data.user.email);
    })
  );

  const tabs = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'cotizaciones', label: 'Cotizaciones' },
    { key: 'documentos', label: 'Documentos' },
    { key: 'entregables', label: 'Entregables' },
    { key: 'accesos', label: 'Accesos' },
    { key: 'tickets', label: 'Tickets' },
  ];

  async function onUpdateProject(formData: FormData) {
    'use server';
    await updateProject(id, formData);
  }

  return (
    <div>
      <OpsPageHeader
        title={project.name}
        description={(project.organizations as { name?: string })?.name}
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/ops/projects/${id}/compliance-export`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Export compliance
            </a>
            <a
              href={`/p/${project.slug}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Ver como cliente
            </a>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} tone={projectTone(project.status)} />
        <span className="text-sm text-zinc-500">Slug: {project.slug}</span>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/projects/${id}?tab=${t.key}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.key ? 'bg-codiva-primary text-white' : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === 'resumen' && (
        <form action={onUpdateProject} className="max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input name="name" defaultValue={project.name} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Estado</label>
              <select name="status" defaultValue={project.status} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Avance %</label>
              <input name="progressPercent" type="number" min={0} max={100} defaultValue={project.progress_percent} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Inicio</label>
              <input name="startDate" type="date" defaultValue={project.start_date ?? ''} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Entrega estimada</label>
              <input name="targetDeliveryDate" type="date" defaultValue={project.target_delivery_date ?? ''} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Retención documentos (días)</label>
              <input
                name="documentRetentionDays"
                type="number"
                min={30}
                max={3650}
                defaultValue={project.document_retention_days ?? 365}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-zinc-500">Tras vencer, el cron/disposicion borra el archivo del storage.</p>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descripción</label>
            <textarea name="description" rows={4} defaultValue={project.description ?? ''} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="clientVisible" defaultChecked={project.client_visible} />
            Portal visible para el cliente
          </label>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
            Guardar cambios
          </button>
        </form>
      )}

      {tab === 'timeline' && (
        <div className="space-y-6">
          <MilestoneForm projectId={id} createMilestone={createMilestone} />
          {(milestones ?? []).map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              projectId={id}
              updateMilestone={updateMilestone}
              addMilestoneUpdate={addMilestoneUpdate}
            />
          ))}
          {!milestones?.length && <p className="text-sm text-zinc-500">Sin hitos. Agrega el primero arriba.</p>}
        </div>
      )}

      {tab === 'cotizaciones' && (
        <div className="space-y-6">
          <OpsQuoteForm
            title="Nueva cotización"
            defaultTitle={`Propuesta - ${project.name}`}
            action={async (formData) => {
              'use server';
              await createQuote(id, formData);
            }}
          />
          {(quotes ?? []).map((q) => (
            <article key={q.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{q.title} · v{q.version}</h3>
                <StatusBadge label={QUOTE_STATUS_LABELS[q.status]} tone={q.status === 'accepted' ? 'success' : 'info'} />
              </div>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{q.scope}</p>
              <p className="mt-2 text-sm font-medium">{formatCurrency(q.total_amount, q.currency)}</p>
              {q.status === 'draft' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/quotes/${q.id}/preview`}
                    target="_blank"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                  >
                    Vista previa
                  </Link>
                  <form action={async () => { 'use server'; await sendQuote(q.id, id); }}>
                    <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                      Enviar al cliente
                    </button>
                  </form>
                </div>
              )}
              {q.status !== 'draft' && (
                <Link
                  href={`/quotes/${q.id}/preview`}
                  target="_blank"
                  className="mt-4 inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Vista previa
                </Link>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <form action={async () => { 'use server'; await runDocumentRetentionDisposal(); }}>
              <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                Ejecutar retención ahora
              </button>
            </form>
            <a
              href={`/api/ops/projects/${id}/compliance-export`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Descargar export JSON
            </a>
          </div>
          <form action={async (fd) => { 'use server'; await uploadDocument(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Subir documento</h3>
            <input name="title" placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="type" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="contract">Contrato</option>
              <option value="nda">NDA</option>
              <option value="proposal_pdf">Propuesta PDF</option>
              <option value="other">Otro</option>
            </select>
            <textarea name="notes" placeholder="Notas internas / para el cliente" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="file" type="file" required className="w-full text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="signed" /> Firmado</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Subir</button>
          </form>
          <ul className="space-y-2">
            {(documents ?? []).map((d) => {
              const href = (() => {
                const base = opsFileHref(d.file_path, d.file_url);
                if (!base) return null;
                if (base.startsWith('/api/ops/file')) return `${base}&documentId=${encodeURIComponent(d.id)}`;
                return base;
              })();
              return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {d.title} {d.signed ? '✓' : ''}
                    {d.disposed_at ? ' · DISPUESTO' : ''}
                  </p>
                  <p className="text-zinc-500">
                    {DOCUMENT_TYPE_LABELS[d.type] ?? d.type}
                    {' · '}
                    {DOCUMENT_SOURCE_LABELS[d.source] ?? d.source ?? 'staff'}
                    {' · '}
                    {formatDate(d.uploaded_at)}
                    {d.scan_status ? ` · scan:${d.scan_status}` : ''}
                    {d.retain_until ? ` · retener hasta ${formatDate(d.retain_until)}` : ''}
                  </p>
                  {d.content_sha256 && (
                    <p className="mt-1 font-mono text-xs text-zinc-400" title={d.content_sha256}>
                      SHA-256: {d.content_sha256.slice(0, 20)}…
                    </p>
                  )}
                  {d.notes && <p className="mt-1 text-zinc-600">{d.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                      Ver
                    </a>
                  )}
                  {!d.signed && (
                    <form action={async () => { 'use server'; await markDocumentSigned(d.id, id, true); }}>
                      <button type="submit" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                        Marcar firmado
                      </button>
                    </form>
                  )}
                </div>
              </li>
              );
            })}
          </ul>

          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="mb-1 font-semibold">Auditoría reciente</h3>
            <p className="mb-3 text-sm text-zinc-500">Descargas y eventos del proyecto (uploads, legales).</p>
            <ul className="space-y-2 text-sm">
              {(fileAccess ?? []).slice(0, 10).map((a) => (
                <li key={a.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                  <span className="font-medium">Descarga</span>
                  {' · '}
                  {memberEmails.get(a.actor_id ?? '') ?? a.actor_id?.slice(0, 8) ?? 'sistema'}
                  {' · '}
                  <span className="text-zinc-500">{formatDate(a.created_at)}</span>
                  {a.ip && <span className="text-zinc-400"> · {a.ip}</span>}
                  <p className="truncate text-xs text-zinc-400">{a.file_path}</p>
                </li>
              ))}
              {(recentActivity ?? [])
                .filter((a) => a.action === 'uploaded' || a.action === 'legal_accepted')
                .slice(0, 10)
                .map((a) => (
                  <li key={a.id} className="rounded-lg border border-zinc-100 px-3 py-2">
                    <span className="font-medium">
                      {a.action === 'legal_accepted' ? 'Aceptación legal' : 'Documento subido'}
                    </span>
                    {' · '}
                    {memberEmails.get(a.actor_id ?? '') ?? a.actor_id?.slice(0, 8) ?? 'sistema'}
                    {' · '}
                    <span className="text-zinc-500">{formatDate(a.created_at)}</span>
                  </li>
                ))}
              {!fileAccess?.length &&
                !(recentActivity ?? []).some((a) => a.action === 'uploaded' || a.action === 'legal_accepted') && (
                  <p className="text-zinc-500">Sin eventos de auditoría aún.</p>
                )}
            </ul>
          </section>
        </div>
      )}

      {tab === 'entregables' && (
        <div className="space-y-6">
          <form action={async (fd) => { 'use server'; await createDeliverable(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Nuevo entregable</h3>
            <input name="title" required placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="kind" defaultValue="other" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="architecture">Arquitectura (canvas portal)</option>
              <option value="mvp">MVP / Propuesta (canvas portal)</option>
              <option value="proposal">Propuesta</option>
              <option value="other">Otro / entregable</option>
            </select>
            <input name="sortOrder" type="number" defaultValue={0} placeholder="Orden" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="url" placeholder="URL (client-pack, staging, Figma…)" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <textarea name="description" placeholder="Descripción" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="file" type="file" className="w-full text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Guardar</button>
          </form>
          <ul className="space-y-2">
            {(deliverables ?? []).map((d) => {
              const fileHref = opsFileHref(d.file_path, d.file_url);
              return (
              <li key={d.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                <p className="font-medium">{d.title}</p>
                <p className="text-zinc-500">{DELIVERABLE_KIND_LABELS[d.kind] ?? d.kind ?? 'Otro'}</p>
                {d.url && <a href={d.url} className="text-codiva-primary hover:underline">{d.url}</a>}
                {fileHref && (
                  <a href={fileHref} className="block text-codiva-primary hover:underline">
                    Descargar archivo
                  </a>
                )}
              </li>
              );
            })}
          </ul>
        </div>
      )}

      {tab === 'accesos' && (
        <div className="max-w-2xl space-y-6">
          <form action={async (fd) => { 'use server'; await inviteProjectMember(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Invitar usuario del cliente</h3>
            <p className="text-sm text-zinc-600">
              Puedes invitar a varias personas (legal, dirección, ops). Cada una aceptará TyC, aviso de
              privacidad y NDA en su primer acceso (versión {LEGAL_DOCS_VERSION}).
            </p>
            <input name="email" type="email" required placeholder="email@cliente.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="viewer">Viewer — solo lectura</option>
              <option value="approver">Approver — puede aceptar cotización</option>
            </select>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Enviar acceso</button>
          </form>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span>Login: {opsBaseUrl()}/p/{project.slug}/login</span>
            <Link href={`/p/${project.slug}`} className="text-codiva-primary hover:underline">
              Ver como cliente
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {(members ?? []).map((m) => {
              const acceptance = getAcceptanceStatus(m);
              return (
                <li key={m.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{memberEmails.get(m.user_id) ?? m.user_id.slice(0, 8)}</p>
                      <p className="text-zinc-500">
                        {m.role} · invitado {formatDate(m.invited_at)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        acceptance.complete
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {acceptance.complete ? 'Legales OK' : 'Pendiente aceptar'}
                    </span>
                  </div>
                  {!acceptance.complete && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Falta:{' '}
                      {[
                        !acceptance.terms ? 'TyC' : null,
                        !acceptance.privacy ? 'Privacidad' : null,
                        !acceptance.nda ? 'NDA' : null,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </li>
              );
            })}
            {!members?.length && (
              <p className="text-sm text-zinc-500">Aún no hay usuarios invitados. Agrega el primero arriba.</p>
            )}
          </ul>
        </div>
      )}

      {tab === 'tickets' && (
        <ul className="space-y-2">
          {(tickets ?? []).map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`} className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm hover:border-codiva-primary/30">
                {t.title}
              </Link>
            </li>
          ))}
          {!tickets?.length && <p className="text-sm text-zinc-500">Sin tickets vinculados</p>}
        </ul>
      )}
    </div>
  );
}

function MilestoneForm({
  projectId,
  createMilestone,
}: {
  projectId: string;
  createMilestone: typeof import('@/lib/ops/actions').createMilestone;
}) {
  async function action(formData: FormData) {
    'use server';
    await createMilestone(projectId, formData);
  }

  return (
    <form action={action} className="rounded-xl border border-zinc-200 bg-white p-5 grid gap-3 md:grid-cols-2">
      <h3 className="md:col-span-2 font-semibold">Nuevo hito</h3>
      <input name="title" required placeholder="Título del hito" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <input name="dueDate" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <select name="status" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
        {Object.entries(MILESTONE_STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
      <textarea name="description" placeholder="Descripción" rows={2} className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <button type="submit" className="w-fit rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Agregar hito</button>
    </form>
  );
}

function MilestoneCard({
  milestone,
  projectId,
  updateMilestone,
  addMilestoneUpdate,
}: {
  milestone: {
    id: string;
    title: string;
    description: string;
    status: string;
    due_date: string | null;
    visible_to_client: boolean;
    milestone_updates?: { id: string; body: string; created_at: string }[];
  };
  projectId: string;
  updateMilestone: typeof import('@/lib/ops/actions').updateMilestone;
  addMilestoneUpdate: typeof import('@/lib/ops/actions').addMilestoneUpdate;
}) {
  async function onUpdate(formData: FormData) {
    'use server';
    await updateMilestone(milestone.id, projectId, formData);
  }

  async function onAddUpdate(formData: FormData) {
    'use server';
    const body = String(formData.get('body') || '');
    if (body.trim()) await addMilestoneUpdate(milestone.id, projectId, body);
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5">
      <form action={onUpdate} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <input name="title" defaultValue={milestone.title} className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium" />
          <select name="status" defaultValue={milestone.status} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {Object.entries(MILESTONE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <textarea name="description" defaultValue={milestone.description ?? ''} rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <div className="flex flex-wrap gap-3 items-center">
          <input name="dueDate" type="date" defaultValue={milestone.due_date ?? ''} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="visibleToClient" defaultChecked={milestone.visible_to_client} /> Visible cliente
          </label>
          <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">Guardar</button>
        </div>
      </form>
      {milestone.milestone_updates && milestone.milestone_updates.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
          {milestone.milestone_updates.map((u) => (
            <li key={u.id} className="text-zinc-600">
              <span className="text-xs text-zinc-400">{formatDate(u.created_at)}</span>
              <p>{u.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form action={onAddUpdate} className="mt-3 flex gap-2">
        <input name="body" placeholder="Actualización…" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white">Publicar</button>
      </form>
    </article>
  );
}
