import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { leadTone, projectTone, ticketTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import {
  LEAD_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  formatDate,
} from '@/lib/ops/labels';

export default async function DashboardPage() {
  const { supabase } = await requireStaff();

  const [
    { data: leads },
    { data: inbox },
    { data: tickets },
    { data: projects },
  ] = await Promise.all([
    supabase.from('leads').select('id, name, company, status, created_at').eq('status', 'new').order('created_at', { ascending: false }).limit(5),
    supabase.from('inbox_messages').select('id, name, email, status, created_at').eq('status', 'unread').order('created_at', { ascending: false }).limit(5),
    supabase.from('tickets').select('id, title, priority, status, created_at').in('status', ['new', 'in_progress']).order('created_at', { ascending: false }).limit(5),
    supabase.from('projects').select('id, name, slug, status, target_delivery_date, progress_percent').in('status', ['active', 'quoting']).order('updated_at', { ascending: false }).limit(5),
  ]);

  return (
    <div>
      <OpsPageHeader
        title="Dashboard"
        description="Resumen operativo de Codiva Ops"
      />

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
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{p.progress_percent}% avance</span>
                  <span>Entrega: {formatDate(p.target_delivery_date)}</span>
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
