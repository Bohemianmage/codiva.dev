import Link from 'next/link';
import DashboardFinance from '@/components/ops/DashboardFinance';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import PortalClientUrl from '@/components/ops/PortalClientUrl';
import StatusBadge, { leadTone, projectTone, ticketTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { buildFinanceSummary, type FinanceFilters } from '@/lib/ops/finance';
import {
  LEAD_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
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
  const { supabase } = await requireStaff();
  const params = await searchParams;

  const filters: FinanceFilters = {
    org: firstParam(params.org),
    chargeStatus: firstParam(params.chargeStatus),
    kind: firstParam(params.kind),
    projectStatus: firstParam(params.projectStatus),
  };

  const [
    { data: leads },
    { data: inbox },
    { data: tickets },
    { data: projects },
    { data: financeProjects },
    { data: charges },
    { data: quotes },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, name, company, status, created_at')
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('inbox_messages')
      .select('id, name, email, status, created_at')
      .eq('status', 'unread')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('tickets')
      .select('id, title, priority, status, created_at')
      .in('status', ['new', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('projects')
      .select('id, name, slug, status, target_delivery_date, progress_percent, client_visible')
      .in('status', ['active', 'quoting', 'draft'])
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('projects')
      .select('id, name, status, organization_id, organizations(id, name)')
      .order('name', { ascending: true }),
    supabase
      .from('project_charges')
      .select(
        'id, kind, title, amount, currency, status, due_date, project_id, projects(id, name, status, organization_id, organizations(id, name))'
      )
      .order('due_date', { ascending: true }),
    supabase
      .from('quotes')
      .select('id, project_id, status, total_amount, currency, version')
      .not('project_id', 'is', null)
      .order('version', { ascending: false }),
  ]);

  const financeSummary = buildFinanceSummary(
    charges ?? [],
    quotes ?? [],
    financeProjects ?? [],
    filters
  );

  return (
    <div>
      <OpsPageHeader
        title="Dashboard"
        description="Resumen operativo de Codiva Ops"
      />

      <DashboardFinance summary={financeSummary} filters={filters} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Leads nuevos</h2>
            <Link href="/leads" className="text-sm text-codiva-primary hover:underline">Ver todos</Link>
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

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Inbox sin leer</h2>
            <Link href="/inbox" className="text-sm text-codiva-primary hover:underline">Ver inbox</Link>
          </div>
          <ul className="space-y-3">
            {(inbox ?? []).map((m) => (
              <li key={m.id} className="text-sm">
                <p className="font-medium">{m.name}</p>
                <p className="text-zinc-500 truncate">{m.email}</p>
              </li>
            ))}
            {!inbox?.length && <p className="text-sm text-zinc-500">Inbox al día</p>}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Tickets abiertos</h2>
            <Link href="/tickets" className="text-sm text-codiva-primary hover:underline">Ver tickets</Link>
          </div>
          <ul className="space-y-3">
            {(tickets ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/tickets/${t.id}`} className="font-medium hover:text-codiva-primary truncate">
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
            <Link href="/projects" className="text-sm text-codiva-primary hover:underline">Ver proyectos</Link>
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
                  <a
                    href={`/p/${p.slug}`}
                    className="font-medium text-codiva-primary hover:underline"
                    title="Misma sesión staff en ops"
                  >
                    Vista previa
                  </a>
                  <PortalClientUrl slug={p.slug} />
                </div>
              </li>
            ))}
            {!projects?.length && <p className="text-sm text-zinc-500">Sin proyectos activos</p>}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Vista portal cliente</h2>
            <p className="text-sm text-zinc-500">
              <strong>Vista previa</strong> usa tu sesión en ops. El chip corto es la URL del cliente
              (copiar / abrir en portal.codiva.dev).
            </p>
          </div>
          <Link href="/projects" className="text-sm text-codiva-primary hover:underline">
            Todos los proyectos
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(projects ?? []).map((p) => (
            <li key={`preview-${p.id}`} className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm">
              <p className="font-medium text-zinc-900">{p.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <a href={`/p/${p.slug}`} className="text-codiva-primary hover:underline">
                  Vista previa (ops)
                </a>
                <PortalClientUrl slug={p.slug} />
              </div>
            </li>
          ))}
          {!projects?.length && <p className="text-sm text-zinc-500">Sin proyectos para previsualizar</p>}
        </ul>
      </section>
    </div>
  );
}
