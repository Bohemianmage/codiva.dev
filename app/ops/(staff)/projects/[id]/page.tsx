import Link from 'next/link';
import { redirect } from 'next/navigation';
import BrandedFileInput from '@/components/ops/BrandedFileInput';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import PortalClientUrl from '@/components/ops/PortalClientUrl';
import StatusBadge, { chargeTone, projectTone } from '@/components/ops/StatusBadge';
import { assertProjectAccess, requireStaff } from '@/lib/ops/auth';
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
  createDocumentRequest,
  updateDocumentRequestStatus,
  setDeliverableVisibility,
  setQuoteVisibility,
  createProjectCharge,
  updateProjectCharge,
  deleteProjectCharge,
} from '@/lib/ops/actions';
import OpsProjectSiteAccess from '@/components/ops/OpsProjectSiteAccess';
import OpsProjectSprints from '@/components/ops/OpsProjectSprints';
import OpsProjectHours from '@/components/ops/OpsProjectHours';
import ToastForm from '@/components/ops/ToastForm';
import { can } from '@/lib/ops/permissions';
import { labelsFor, isClientBorneChargeKind } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { projectPortalUrl, staffPortalPreviewPath } from '@/lib/ops/host';
import OpsQuoteForm from '@/components/ops/OpsQuoteForm';
import OpsProjectArchitecture from '@/components/ops/OpsProjectArchitecture';
import { isCanvasKind } from '@/lib/ops/architecture';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { LEGAL_DOCS_VERSION } from '@/lib/ops/legal/version';
import { isLegacyNdaDraftDocument, opsFileHref } from '@/lib/ops/storage';
import { isLegacyQuotePackDocument } from '@/lib/ops/quotes';

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'resumen' } = await searchParams;
  const access = await requireStaff();
  await assertProjectAccess(access, id);
  const { supabase, user, staff } = access;
  const t = await getT();
  const {
    PROJECT_STATUS_LABELS,
    QUOTE_STATUS_LABELS,
    MILESTONE_STATUS_LABELS,
    DELIVERABLE_KIND_LABELS,
    DOCUMENT_TYPE_LABELS,
    DOCUMENT_SOURCE_LABELS,
    DOCUMENT_REQUEST_STATUS_LABELS,
    DOCUMENT_REQUEST_INPUT_LABELS,
    CHARGE_KIND_LABELS,
    CHARGE_STATUS_LABELS,
    formatDate,
    formatCurrency,
    formatChargeAmount,
  } = labelsFor(t.locale);

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
    { data: docRequests },
    { data: charges },
    { data: siteAccess },
    { data: siblingProjects },
    { data: projectStaffRows },
    { data: sprints },
    { data: allStaffRows },
    { data: timeEntries },
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
    supabase
      .from('document_requests')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_charges')
      .select('*')
      .eq('project_id', id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('project_site_access')
      .select('id, label, kind, url, username, secret, notes, visible_to_client, sort_order')
      .eq('project_id', id)
      .order('sort_order', { ascending: true }),
    project.organization_id
      ? supabase
          .from('projects')
          .select('id, name')
          .eq('organization_id', project.organization_id)
          .neq('id', id)
          .order('name')
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from('project_staff')
      .select('staff_id, role_on_project, staff_profiles(full_name, role)')
      .eq('project_id', id),
    supabase
      .from('project_sprints')
      .select('id, name, goal, starts_on, ends_on, status')
      .eq('project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('staff_profiles')
      .select('id, full_name, role')
      .eq('active', true)
      .order('full_name'),
    supabase
      .from('time_entries')
      .select('id, hours, worked_on, notes, staff_id, sprint_item_id')
      .eq('project_id', id)
      .order('worked_on', { ascending: false })
      .limit(100),
  ]);

  const sprintIds = (sprints ?? []).map((s) => s.id);
  const { data: sprintItems } = sprintIds.length
    ? await supabase
        .from('sprint_items')
        .select('id, sprint_id, title, details, status, assignee_id')
        .in('sprint_id', sprintIds)
        .order('sort_order', { ascending: true })
    : { data: [] as never[] };

  const { data: orgNdaDocs } = project.organization_id
    ? await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', project.organization_id)
        .eq('type', 'nda')
        .eq('signed', true)
        .is('disposed_at', null)
        .order('uploaded_at', { ascending: false })
    : { data: [] as never[] };

  const staffDocuments = [
    ...(documents ?? []),
    ...(orgNdaDocs ?? []).filter((d) => !(documents ?? []).some((p) => p.id === d.id)),
  ];

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
    { key: 'sprints', label: 'Sprints' },
    { key: 'horas', label: 'Horas', capability: 'time_entries' as const },
    { key: 'timeline', label: 'Timeline' },
    { key: 'arquitectura', label: 'Arquitectura' },
    { key: 'cotizaciones', label: 'Cotizaciones', capability: 'quotes' as const },
    { key: 'pagos', label: 'Pagos', capability: 'charges' as const },
    { key: 'documentos', label: 'Documentos' },
    { key: 'entregables', label: 'Entregables' },
    { key: 'accesos', label: 'Accesos' },
    { key: 'tickets', label: 'Tickets' },
  ].filter((t) => !('capability' in t && t.capability) || can(staff.role, t.capability!));

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
              href={staffPortalPreviewPath(project.slug)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              title="Vista previa con sesión staff (ops)"
            >
              Vista previa
            </a>
            <a
              href={projectPortalUrl(project.slug)}
              className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-medium text-white hover:bg-codiva-primary-dark"
              title="Abrir URL del cliente"
            >
              URL cliente
            </a>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} tone={projectTone(project.status)} />
        <PortalClientUrl slug={project.slug} />
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
        <ToastForm success="Proyecto actualizado" action={onUpdateProject} className="max-w-2xl space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
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
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <p className="text-sm font-medium text-zinc-900">Visibilidad en portal</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="clientVisible" defaultChecked={project.client_visible} />
              Portal visible para el cliente
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="portalShowQuote"
                defaultChecked={project.portal_show_quote !== false}
              />
              Mostrar cotización (nav + página + cards)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="portalShowCosts"
                defaultChecked={project.portal_show_costs !== false}
              />
              Mostrar canvas MVP / propuesta comercial
            </label>
            <p className="text-xs text-zinc-500">
              Cotización y canvas comercial también dependen de “visible al cliente” en cada ítem.
              No uses la descripción del proyecto para montos si costos está apagado.
            </p>
          </div>
          <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
            Guardar cambios
          </button>
        </ToastForm>
      )}

      {tab === 'sprints' && (
        <OpsProjectSprints
          projectId={id}
          staffRole={staff.role}
          currentUserId={user.id}
          projectStaff={(projectStaffRows ?? []) as never[]}
          allStaff={(allStaffRows ?? []).map((s) => ({
            id: s.id,
            full_name: s.full_name || '',
            role: s.role,
          }))}
          sprints={sprints ?? []}
          items={sprintItems ?? []}
        />
      )}

      {tab === 'horas' && can(staff.role, 'time_entries') && (
        <OpsProjectHours
          projectId={id}
          staffRole={staff.role}
          currentUserId={user.id}
          entries={(timeEntries ?? []) as never[]}
          sprintItems={(sprintItems ?? []).map((i) => ({ id: i.id, title: i.title }))}
          staffOptions={(allStaffRows ?? []).map((s) => ({
            id: s.id,
            full_name: s.full_name || '',
          }))}
        />
      )}

      {tab === 'timeline' && (
        <div className="space-y-6">
          {can(staff.role, 'milestones_write') && (
            <MilestoneForm projectId={id} createMilestone={createMilestone} />
          )}
          {(milestones ?? []).map((m) =>
            can(staff.role, 'milestones_write') ? (
              <MilestoneCard
                key={m.id}
                milestone={m}
                projectId={id}
                updateMilestone={updateMilestone}
                addMilestoneUpdate={addMilestoneUpdate}
              />
            ) : (
              <div key={m.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{m.title}</p>
                  <StatusBadge
                    label={MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                    tone={m.status === 'completed' ? 'success' : m.status === 'blocked' ? 'danger' : 'info'}
                  />
                </div>
                {m.description && <p className="mt-2 text-sm text-zinc-600">{m.description}</p>}
                <p className="mt-2 text-xs text-zinc-400">
                  Entrega: {formatDate(m.due_date)}
                </p>
              </div>
            )
          )}
          {!milestones?.length && <p className="text-sm text-zinc-500">Sin hitos.</p>}
        </div>
      )}

      {tab === 'arquitectura' && (
        <OpsProjectArchitecture
          projectId={id}
          slug={project.slug}
          kindLabels={DELIVERABLE_KIND_LABELS}
          canEdit={can(staff.role, 'deliverables')}
        />
      )}

      {tab === 'cotizaciones' && can(staff.role, 'quotes') && (
        <div className="space-y-6">
          <p className="text-sm text-zinc-600">
            Aquí se arma el documento. El cliente lo ve igual en la pestaña <strong>Cotización</strong> del
            portal (no como PDF suelto en Documentos).
          </p>
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
              <p className="mt-2 text-xs text-zinc-500">
                Portal:{' '}
                {q.visible_to_client !== false ? 'visible al cliente' : 'oculta al cliente'}
                {!project.portal_show_quote ? ' · módulo cotización OFF en proyecto' : ''}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/quotes/${q.id}`}
                  className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-medium text-white"
                >
                  Editar en Ops
                </Link>
                <Link
                  href={`/quotes/${q.id}/preview`}
                  target="_blank"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                >
                  Vista previa
                </Link>
                {q.status === 'draft' && (
                  <ToastForm success="Cotización enviada" action={async () => { 'use server'; await sendQuote(q.id, id); }}>
                    <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                      Enviar al cliente
                    </button>
                  </ToastForm>
                )}
                <ToastForm success="Visibilidad actualizada"
                  action={async () => {
                    'use server';
                    await setQuoteVisibility(id, q.id, q.visible_to_client === false);
                  }}
                >
                  <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                    {q.visible_to_client === false ? 'Mostrar en portal' : 'Ocultar en portal'}
                  </button>
                </ToastForm>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === 'pagos' && can(staff.role, 'charges') && (
        <div className="space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="font-semibold">Nuevo cargo</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Desarrollo (honorarios Codiva) o pass-through: hosting/dominio siempre a cargo del
              cliente cuando aplican. Vacío en monto = “Por confirmar” (p. ej. renovación anual al
              costo real).
            </p>
            <ToastForm success="Cargo creado"
              action={async (fd) => {
                'use server';
                await createProjectCharge(id, fd);
              }}
              className="mt-4 grid gap-3 md:grid-cols-2"
            >
              <input
                name="title"
                required
                placeholder="Concepto"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="kind" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" defaultValue="development">
                {Object.entries(CHARGE_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="Monto (opcional)"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <select name="status" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" defaultValue="pending">
                {Object.entries(CHARGE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input name="periodLabel" placeholder="Periodo (ej. 2025)" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <input name="dueDate" type="date" className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <input
                name="noticeDays"
                type="number"
                min="0"
                defaultValue={30}
                placeholder="Aviso T-N (días)"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-zinc-500 md:col-span-1">
                Con fecha de vencimiento, el portal avisa desde T-N (default 30).
              </p>
              <textarea
                name="description"
                rows={2}
                placeholder="Descripción visible al cliente"
                className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <textarea
                name="staffNotes"
                rows={2}
                placeholder="Notas internas (no salen al portal)"
                className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2">
                <input type="checkbox" name="visibleToClient" value="on" defaultChecked />
                Visible en portal (requiere “temas de costos” ON)
              </label>
              <button type="submit" className="w-fit rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white">
                Agregar cargo
              </button>
            </ToastForm>
          </section>

          {(charges ?? []).map((c) => (
            <article key={c.id} className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge label={CHARGE_STATUS_LABELS[c.status]} tone={chargeTone(c.status)} />
                  <span className="text-xs uppercase tracking-wide text-zinc-500">
                    {CHARGE_KIND_LABELS[c.kind] ?? c.kind}
                  </span>
                  {isClientBorneChargeKind(c.kind) && (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      A cargo del cliente
                    </span>
                  )}
                </div>
                <p className="font-semibold text-codiva-primary">
                  {formatChargeAmount(c.amount, c.currency)}
                </p>
              </div>
              <ToastForm success="Cargo actualizado"
                action={async (fd) => {
                  'use server';
                  await updateProjectCharge(c.id, id, fd);
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <input type="hidden" name="existingPaidAt" value={c.paid_at ?? ''} />
                <input
                  name="title"
                  required
                  defaultValue={c.title}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <select name="kind" defaultValue={c.kind} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                  {Object.entries(CHARGE_KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={c.amount ?? ''}
                  placeholder="Por confirmar"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <select name="status" defaultValue={c.status} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                  {Object.entries(CHARGE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  name="periodLabel"
                  defaultValue={c.period_label ?? ''}
                  placeholder="Periodo"
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={c.due_date ?? ''}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <input
                  name="noticeDays"
                  type="number"
                  min="0"
                  defaultValue={c.notice_days ?? 30}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  title="Aviso T-N en días"
                />
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={c.description ?? ''}
                  className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <textarea
                  name="staffNotes"
                  rows={2}
                  defaultValue={c.staff_notes ?? ''}
                  placeholder="Notas internas"
                  className="md:col-span-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" name="visibleToClient" defaultChecked={c.visible_to_client !== false} />
                  Visible en portal
                </label>
                <p className="text-xs text-zinc-500">
                  {c.status === 'paid' ? `Pagado ${formatDate(c.paid_at)}` : c.due_date ? `Vence ${formatDate(c.due_date)}` : 'Sin vencimiento'}
                </p>
                <div className="flex flex-wrap items-center gap-2 md:col-span-2">
                  <button type="submit" className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm text-white">
                    Guardar
                  </button>
                  <p className="text-xs text-zinc-500">
                    Para quitar un cargo (p. ej. hosting que no aplica): usa Eliminar abajo, o marca estado
                    Omitido y ocúltalo del portal.
                  </p>
                </div>
              </ToastForm>
              <ToastForm success="Eliminado"
                action={async () => {
                  'use server';
                  await deleteProjectCharge(c.id, id);
                }}
                className="mt-3 border-t border-zinc-100 pt-3"
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Eliminar cargo
                </button>
              </ToastForm>
            </article>
          ))}
          {!charges?.length && <p className="text-sm text-zinc-500">Sin cargos. Agrega anticipo, saldo u hosting arriba.</p>}
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <ToastForm success="Retención ejecutada" action={async () => { 'use server'; await runDocumentRetentionDisposal(); }}>
              <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50">
                Ejecutar retención ahora
              </button>
            </ToastForm>
            <a
              href={`/api/ops/projects/${id}/compliance-export`}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              Descargar export JSON
            </a>
          </div>

          <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h3 className="font-semibold">Solicitudes al cliente</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Al crear una solicitud se habilita el slot en el portal. El cliente solo puede
                responder a lo que pidas aquí.
              </p>
            </div>
            <ToastForm success="Solicitud creada"
              action={async (fd) => {
                'use server';
                await createDocumentRequest(id, fd);
              }}
              className="grid gap-3 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-2"
            >
              <input
                name="title"
                required
                placeholder="Título (ej. Brandbook)"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
              />
              <input
                name="code"
                placeholder="Código interno (opcional)"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <select name="inputMode" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                <option value="file">Archivo</option>
                <option value="text">Texto</option>
                <option value="credentials">Accesos (hosting/dominio)</option>
              </select>
              <select name="expectedType" className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm">
                <option value="other">Otro</option>
                <option value="nda">NDA</option>
                <option value="contract">Contrato</option>
                <option value="proposal_pdf">Propuesta PDF</option>
              </select>
              <input
                name="sortOrder"
                type="number"
                defaultValue={((docRequests ?? []).length + 1) * 10}
                placeholder="Orden"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
              />
              <textarea
                name="description"
                rows={2}
                placeholder="Descripción corta para el cliente"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
              />
              <textarea
                name="instructions"
                rows={2}
                placeholder="Instrucciones (qué incluir, formato, etc.)"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm sm:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="required" defaultChecked />
                Requerido
              </label>
              <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit">
                Crear solicitud (habilita en portal)
              </button>
            </ToastForm>

            <ul className="space-y-2">
              {(docRequests ?? []).map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-zinc-200 px-4 py-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {r.title}
                        {r.code ? (
                          <span className="ml-2 font-mono text-xs text-zinc-400">{r.code}</span>
                        ) : null}
                      </p>
                      <p className="text-zinc-500">
                        {DOCUMENT_REQUEST_STATUS_LABELS[r.status] ?? r.status}
                        {' · '}
                        {DOCUMENT_REQUEST_INPUT_LABELS[r.input_mode] ?? r.input_mode}
                        {r.required ? ' · requerido' : ''}
                      </p>
                      {r.description && <p className="mt-1 text-zinc-600">{r.description}</p>}
                      {r.response_text && (
                        <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-2 text-xs text-zinc-700">
                          {r.response_text}
                        </pre>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.status !== 'open' && (
                        <ToastForm success="Solicitud reabierta"
                          action={async () => {
                            'use server';
                            await updateDocumentRequestStatus(id, r.id, 'open');
                          }}
                        >
                          <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                            Reabrir
                          </button>
                        </ToastForm>
                      )}
                      {r.status === 'open' && (
                        <>
                          <ToastForm success="Solicitud omitida"
                            action={async () => {
                              'use server';
                              await updateDocumentRequestStatus(id, r.id, 'waived');
                            }}
                          >
                            <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                              Omitir
                            </button>
                          </ToastForm>
                          <ToastForm success="Solicitud cancelada"
                            action={async () => {
                              'use server';
                              await updateDocumentRequestStatus(id, r.id, 'cancelled');
                            }}
                          >
                            <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                              Cancelar
                            </button>
                          </ToastForm>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
              {!docRequests?.length && (
                <p className="text-sm text-zinc-500">Sin solicitudes. Crea la primera para desbloquear la bandeja del cliente.</p>
              )}
            </ul>
          </section>

          <ToastForm success="Documento subido" action={async (fd) => { 'use server'; await uploadDocument(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Subir documento (Codiva → cliente)</h3>
            <p className="text-sm text-zinc-500">
              Cotizaciones viven en la pestaña Cotizaciones, no como PDF aquí.
            </p>
            <input name="title" placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <select name="type" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              <option value="contract">Contrato</option>
              <option value="nda">NDA</option>
              <option value="other">Otro</option>
            </select>
            <textarea name="notes" placeholder="Nota visible para el cliente (opcional)" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <BrandedFileInput required hint="PDF, imagen, Office o ZIP" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="signed" /> Firmado</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Subir</button>
          </ToastForm>
          <ul className="space-y-2">
            {staffDocuments.map((d) => {
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
                    {isLegacyQuotePackDocument(d) ? ' · pack de cotización, oculto al cliente (vive en Cotización)' : ''}
                    {isLegacyNdaDraftDocument(d) ? ' · borrador pack, oculto al cliente (vive el NDA mutuo de Ops)' : ''}
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
                    <ToastForm success="Documento marcado como firmado" action={async () => { 'use server'; await markDocumentSigned(d.id, id, true); }}>
                      <button type="submit" className="rounded-lg border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                        Marcar firmado
                      </button>
                    </ToastForm>
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
          <p className="text-sm text-zinc-600">
            Entregas operativas del proyecto. La arquitectura y la propuesta se editan en{' '}
            <Link href={`/projects/${id}?tab=arquitectura`} className="text-codiva-primary hover:underline">
              Arquitectura
            </Link>
            .
          </p>
          <ToastForm success="Entregable creado" action={async (fd) => { 'use server'; await createDeliverable(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold">Nuevo entregable</h3>
            <input name="title" required placeholder="Título" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input type="hidden" name="kind" value="other" />
            <input name="sortOrder" type="number" defaultValue={0} placeholder="Orden" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <input name="url" placeholder="URL (staging, Figma…)" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <textarea name="description" placeholder="Descripción" rows={2} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
            <BrandedFileInput hint="Opcional · PDF, imagen, Office o ZIP" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visibleToClient" defaultChecked /> Visible al cliente</label>
            <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Guardar</button>
          </ToastForm>
          <ul className="space-y-2">
            {(deliverables ?? []).filter((d) => !isCanvasKind(d.kind)).map((d) => {
              const fileHref = opsFileHref(d.file_path, d.file_url);
              return (
              <li key={d.id} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{d.title}</p>
                    <p className="text-zinc-500">
                      {DELIVERABLE_KIND_LABELS[d.kind] ?? d.kind ?? 'Otro'}
                      {' · '}
                      {d.visible_to_client ? 'visible al cliente' : 'oculto al cliente'}
                    </p>
                    {d.url && <a href={d.url} className="text-codiva-primary hover:underline">{d.url}</a>}
                    {fileHref && (
                      <a href={fileHref} className="block text-codiva-primary hover:underline">
                        Descargar archivo
                      </a>
                    )}
                  </div>
                  <ToastForm success="Visibilidad actualizada"
                    action={async () => {
                      'use server';
                      await setDeliverableVisibility(id, d.id, !d.visible_to_client);
                    }}
                  >
                    <button type="submit" className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-50">
                      {d.visible_to_client ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </ToastForm>
                </div>
              </li>
              );
            })}
            {!(deliverables ?? []).some((d) => !isCanvasKind(d.kind)) && (
              <p className="text-sm text-zinc-500">Sin entregables operativos.</p>
            )}
          </ul>
        </div>
      )}

      {tab === 'accesos' && (
        <div className="max-w-2xl space-y-10">
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Portal Codiva</h3>
              <p className="mt-1 text-sm text-zinc-600">Invitaciones al portal del proyecto (no son logins del sitio web).</p>
            </div>
            <ToastForm success="Invitación enviada" action={async (fd) => { 'use server'; await inviteProjectMember(id, fd); }} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
              <h3 className="font-semibold">Invitar usuario del cliente</h3>
              <p className="text-sm text-zinc-600">
                Puedes invitar a varias personas (legal, dirección, ops). Cada una aceptará TyC, aviso de
                privacidad y NDA en su primer acceso (versión {LEGAL_DOCS_VERSION}). También puedes
                gestionar usuarios multi-proyecto en{' '}
                <Link href="/users" className="text-codiva-primary hover:underline">
                  Usuarios
                </Link>
                .
              </p>
              <input name="email" type="email" required placeholder="email@cliente.com" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
              <select name="role" className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                <option value="viewer">Viewer - solo lectura</option>
                <option value="approver">Approver - puede aceptar cotización</option>
              </select>
              {(siblingProjects ?? []).length > 0 && (
                <fieldset className="space-y-2 rounded-lg border border-zinc-200 p-3">
                  <legend className="px-1 text-sm font-medium text-zinc-700">
                    También en otros proyectos de este cliente
                  </legend>
                  {(siblingProjects ?? []).map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="siblingProjectIds" value={p.id} defaultChecked />
                      {p.name}
                    </label>
                  ))}
                </fieldset>
              )}
              <button type="submit" className="rounded-lg bg-codiva-primary px-4 py-2 text-sm text-white">Enviar acceso</button>
            </ToastForm>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="inline-flex flex-wrap items-center gap-2">
                Login cliente:
                <PortalClientUrl slug={project.slug} path="/login" />
              </span>
              <Link href={staffPortalPreviewPath(project.slug)} className="text-codiva-primary hover:underline">
                Vista previa (ops)
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
          </section>

          <OpsProjectSiteAccess
            projectId={id}
            sitePreviewUrl={project.site_preview_url}
            siteProductionUrl={project.site_production_url}
            items={siteAccess ?? []}
          />
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

async function MilestoneForm({
  projectId,
  createMilestone,
}: {
  projectId: string;
  createMilestone: typeof import('@/lib/ops/actions').createMilestone;
}) {
  const { MILESTONE_STATUS_LABELS } = labelsFor((await getT()).locale);
  async function action(formData: FormData) {
    'use server';
    await createMilestone(projectId, formData);
  }

  return (
    <ToastForm success="Hito agregado" action={action} className="rounded-xl border border-zinc-200 bg-white p-5 grid gap-3 md:grid-cols-2">
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
    </ToastForm>
  );
}

async function MilestoneCard({
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
  const { MILESTONE_STATUS_LABELS, formatDate } = labelsFor((await getT()).locale);
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
      <ToastForm success="Guardado" action={onUpdate} className="space-y-3">
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
      </ToastForm>
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
      <ToastForm success="Actualización publicada" action={onAddUpdate} className="mt-3 flex gap-2">
        <input name="body" placeholder="Actualización…" className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white">Publicar</button>
      </ToastForm>
    </article>
  );
}
