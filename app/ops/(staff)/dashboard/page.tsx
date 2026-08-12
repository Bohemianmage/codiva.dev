import Link from 'next/link';
import DashboardFinance from '@/components/ops/DashboardFinance';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import PortalClientUrl from '@/components/ops/PortalClientUrl';
import StatusBadge, { leadTone, projectTone, ticketTone } from '@/components/ops/StatusBadge';
import { listVisibleProjectIds, requireStaff } from '@/lib/ops/auth';
import { buildFinanceSummary, type FinanceFilters } from '@/lib/ops/finance';
import { can } from '@/lib/ops/permissions';
import {
  LEAD_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  SPRINT_ITEM_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  formatDate,
} from '@/lib/ops/labels';

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0] || undefined;
  return value || undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string | string[];
    chargeStatus?: string | string[];
    kind?: string | string[];
    projectStatus?: string | string[];
  }>;
}) {
  const access = await requireStaff();
  const { supabase, user, staff } = access;
  const params = await searchParams;
  const showCommercial = can(staff.role, 'leads');
  const showFinance = can(staff.role, 'dashboard_finance');
  const visibleIds = await listVisibleProjectIds(supabase, user.id, staff.role);

  const filters: FinanceFilters = {
    org: firstParam(params.org),
    chargeStatus: firstParam(params.chargeStatus),
    kind: firstParam(params.kind),
    projectStatus: firstParam(params.projectStatus),
  };

  let projectsQuery = supabase
    .from('projects')
    .select('id, name, slug, status, target_delivery_date, progress_percent, client_visible')
    .in('status', ['active', 'quoting', 'draft'])
    .order('updated_at', { ascending: false })
    .limit(8);

  let financeProjectsQuery = supabase
    .from('projects')
    .select('id, name, status, organization_id, organizations(id, name)')
    .order('name', { ascending: true });

  if (visibleIds) {
    const ids = visibleIds.length ? visibleIds : ['00000000-0000-0000-0000-000000000000'];
    projectsQuery = projectsQuery.in('id', ids);
    financeProjectsQuery = financeProjectsQuery.in('id', ids);
  }

  const [
    { data: leads },
    { data: inbox },
    { data: tickets },
    { data: projects },
    { data: financeProjects },
    { data: charges },
    { data: quotes },
    { data: mySprintItems },
  ] = await Promise.all([
    showCommercial
      ? supabase
          .from('leads')
          .select('id, name, company, status, created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as never[] }),
    showCommercial
      ? supabase
          .from('inbox_messages')
          .select('id, name, email, status, created_at')
          .eq('status', 'unread')
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from('tickets')
      .select('id, title, priority, status, created_at')
      .in('status', ['new', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5),
    projectsQuery,
    showFinance ? financeProjectsQuery : Promise.resolve({ data: [] as never[] }),
    showFinance
      ? supabase
          .from('project_charges')
          .select(
            'id, kind, title, amount, currency, status, due_date, project_id, projects(id, name, status, organization_id, organizations(id, name))'
          )
          .order('due_date', { ascending: true })
      : Promise.resolve({ data: [] as never[] }),
    showFinance
      ? supabase
          .from('quotes')
          .select('id, project_id, status, total_amount, currency, version')
          .not('project_id', 'is', null)
          .order('version', { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase
      .from('sprint_items')
      .select(
        'id, title, status, sprint_id, project_sprints!inner(id, name, project_id, status, projects(id, name))'
      )
      .eq('assignee_id', user.id)
      .neq('status', 'done')
      .order('updated_at', { ascending: false })
      .limit(8),
  ]);

  const financeSummary = showFinance
    ? buildFinanceSummary(charges ?? [], quotes ?? [], financeProjects ?? [], filters)
    : null;

  return (
    <div>
      <OpsPageHeader
        title="Dashboard"
        description={
          showCommercial
            ? 'Resumen comercial y de proyectos'
            : 'Tus proyectos e ítems de sprint asignados'
        }
      />

      {financeSummary && <DashboardFinance summary={financeSummary} filters={filters} />}

      <div className="grid gap-6 lg:grid-cols-2">
        {!showCommercial && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Mis ítems de sprint</h2>
              <Link href="/projects" className="text-sm text-codiva-primary hover:underline">
                Ver proyectos
              </Link>
            </div>
            <ul className="space-y-3">
              {(mySprintItems ?? []).map((item) => {
                const sprint = item.project_sprints as {
                  name?: string;
                  project_id?: string;
                  projects?: { name?: string } | { name?: string }[] | null;
                } | null;
                const project = Array.isArray(sprint?.projects) ? sprint?.projects[0] : sprint?.projects;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <Link
                        href={`/projects/${sprint?.project_id}?tab=sprints`}
                        className="font-medium hover:text-codiva-primary"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {project?.name || 'Proyecto'} · {sprint?.name || 'Sprint'}
                      </p>
                    </div>
                    <StatusBadge
                      label={SPRINT_ITEM_STATUS_LABELS[item.status] ?? item.status}
                      tone={item.status === 'blocked' ? 'danger' : 'info'}
                    />
                  </li>
                );
              })}
              {!(mySprintItems ?? []).length && (
                <p className="text-sm text-zinc-500">No tienes ítems pendientes asignados.</p>
              )}
            </ul>
          </section>
        )}

        {showCommercial && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Leads nuevos</h2>
              <Link href="/leads" className="text-sm text-codiva-primary hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="space-y-3">
              {(leads ?? []).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
                  <Link href={`/leads/${l.id}`} className="font-medium hover:text-codiva-primary">
                    {l.company || l.name}
                  </Link>
                  <StatusBadge label={LEAD_STATUS_LABELS[l.status]} tone={leadTone(l.status)} />
                </li>
              ))}
              {!leads?.length && <p className="text-sm text-zinc-500">Sin leads nuevos</p>}
            </ul>
          </section>
        )}

        {showCommercial && (
          <section className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Inbox sin leer</h2>
              <Link href="/inbox" className="text-sm text-codiva-primary hover:underline">
                Ver inbox
              </Link>
            </div>
            <ul className="space-y-3">
              {(inbox ?? []).map((m) => (
                <li key={m.id} className="text-sm">
                  <p className="font-medium">{m.name}</p>
                  <p className="truncate text-zinc-500">{m.email}</p>
                </li>
              ))}
              {!inbox?.length && <p className="text-sm text-zinc-500">Inbox al día</p>}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Tickets abiertos</h2>
            <Link href="/tickets" className="text-sm text-codiva-primary hover:underline">
              Ver tickets
            </Link>
          </div>
          <ul className="space-y-3">
            {(tickets ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/tickets/${t.id}`} className="truncate font-medium hover:text-codiva-primary">
                  {t.title}
                </Link>
                <StatusBadge label={TICKET_STATUS_LABELS[t.status]} tone={ticketTone(t.status)} />
              </li>
            ))}
            {!tickets?.length && <p className="text-sm text-zinc-500">Sin tickets abiertos</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Proyectos activos</h2>
            <Link href="/projects" className="text-sm text-codiva-primary hover:underline">
              Ver proyectos
            </Link>
          </div>
          <ul className="space-y-3">
            {(projects ?? []).map((p) => (
              <li key={p.id} className="text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/projects/${p.id}`} className="font-medium hover:text-codiva-primary">
                    {p.name}
                  </Link>
                  <StatusBadge label={PROJECT_STATUS_LABELS[p.status]} tone={projectTone(p.status)} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>{p.progress_percent}% avance</span>
                  <span>Entrega: {formatDate(p.target_delivery_date)}</span>
                  <Link href={`/projects/${p.id}?tab=sprints`} className="font-medium text-codiva-primary hover:underline">
                    Sprints
                  </Link>
                  <PortalClientUrl slug={p.slug} />
                </div>
              </li>
            ))}
            {!projects?.length && <p className="text-sm text-zinc-500">Sin proyectos activos</p>}
          </ul>
        </section>
      </div>
    </div>
  );
}
