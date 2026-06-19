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
} from '@/lib/ops/actions';
import {
  PROJECT_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  MILESTONE_STATUS_LABELS,
  formatDate,
  formatCurrency,
} from '@/lib/ops/labels';
import { opsBaseUrl } from '@/lib/ops/host';

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
    supabase.from('deliverables').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('project_members').select('id, role, invited_at, user_id').eq('project_id', id),
    supabase.from('tickets').select('id, title, status, priority, created_at').eq('project_id', id).order('created_at', { ascending: false }).limit(10),
  ]);

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
          project.client_visible ? (
            <a
              href={`${opsBaseUrl()}/p/${project.slug}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Abrir portal
            </a>
          ) : null
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
          <QuoteForm projectId={id} createQuote={createQuote} />
          {(quotes ?? []).map((q) => (
            <article key={q.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{q.title} · v{q.version}</h3>
                <StatusBadge label={QUOTE_STATUS_LABELS[q.status]} tone={q.status === 'accepted' ? 'success' : 'info'} />
              </div>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap">{q.scope}</p>
              <p className="mt-2 text-sm font-medium">{formatCurrency(q.total_amount, q.currency)}</p>
              {q.status === 'draft' && (
                <form action={async () => { 'use server'; await sendQuote(q.id, id); }} className="mt-4">
                  <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                    Enviar al cliente
                  </button>
                </form>
              )}
            </article>
          ))}
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-6">
          <form action={async (fd) => { 'use server'; await uploadDocument(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Subir documento</h3>
            <input name="title" placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="type" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="contract">Contrato</option>
              <option value="nda">NDA</option>
              <option value="proposal_pdf">Propuesta PDF</option>
              <option value="other">Otro</option>
            </select>
            <input name="file" type="file" required className="w-full text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" /> Visible al cliente</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="signed" /> Firmado</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Subir</button>
          </form>
          <ul className="space-y-2">
            {(documents ?? []).map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                <span>{d.title} {d.signed && '✓'}</span>
                {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">Ver</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'entregables' && (
        <div className="space-y-6">
          <form action={async (fd) => { 'use server'; await createDeliverable(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Nuevo entregable</h3>
            <input name="title" required placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="url" placeholder="URL (staging, Figma…)" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <textarea name="description" placeholder="Descripción" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="file" type="file" className="w-full text-sm" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Guardar</button>
          </form>
          <ul className="space-y-2">
            {(deliverables ?? []).map((d) => (
              <li key={d.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                <p className="font-medium">{d.title}</p>
                {d.url && <a href={d.url} className="text-codiva-primary hover:underline">{d.url}</a>}
                {d.file_url && <a href={d.file_url} className="block text-codiva-primary hover:underline">Descargar archivo</a>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'accesos' && (
        <div className="max-w-lg space-y-6">
          <form action={async (fd) => { 'use server'; await inviteProjectMember(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Invitar cliente</h3>
            <input name="email" type="email" required placeholder="email@cliente.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="viewer">Viewer</option>
              <option value="approver">Approver</option>
            </select>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Enviar acceso</button>
          </form>
          <p className="text-sm text-zinc-500">Portal: {opsBaseUrl()}/p/{project.slug}/login</p>
          <ul className="text-sm space-y-2">
            {(members ?? []).map((m) => (
              <li key={m.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-2">
                Usuario {m.user_id.slice(0, 8)}… · {m.role}
              </li>
            ))}
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

function QuoteForm({
  projectId,
  createQuote,
}: {
  projectId: string;
  createQuote: typeof import('@/lib/ops/actions').createQuote;
}) {
  async function action(formData: FormData) {
    'use server';
    await createQuote(projectId, formData);
  }

  return (
    <form action={action} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
      <h3 className="font-semibold">Nueva cotización</h3>
      <input name="title" defaultValue="Propuesta comercial" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <textarea name="scope" placeholder="Alcance y condiciones" rows={5} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      <div className="grid gap-3 md:grid-cols-3">
        <input name="totalAmount" type="number" step="0.01" placeholder="Monto total" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <select name="currency" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          <option value="USD">USD</option>
          <option value="MXN">MXN</option>
        </select>
        <input name="validUntil" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
      </div>
      <input type="hidden" name="phases" value="[]" />
      <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Crear borrador</button>
    </form>
  );
}
