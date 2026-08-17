import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { listVisibleProjectIds, projectIdInFilter, requireCapability } from '@/lib/ops/auth';
import { labelsFor } from '@/lib/ops/labels';
import { asProject } from '@/lib/ops/tickets';
import { getT } from '@/i18n/locale';

export default async function TicketsPage() {
  const { supabase, user, staff } = await requireCapability('tickets');
  const t = await getT();
  const { EMPTY_LABEL, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, formatDate } = labelsFor(t.locale);
  const visibleIds = projectIdInFilter(await listVisibleProjectIds(supabase, user.id, staff));
  let ticketsQuery = supabase
    .from('tickets')
    .select('id, title, priority, status, reporter_name, reporter_email, assigned_to, created_at, projects(name)')
    .order('created_at', { ascending: false });
  if (visibleIds) ticketsQuery = ticketsQuery.in('project_id', visibleIds);

  const [{ data: tickets }, { data: staffRows }] = await Promise.all([
    ticketsQuery,
    supabase.from('staff_profiles').select('id, full_name').eq('active', true),
  ]);

  const names = new Map((staffRows ?? []).map((s) => [s.id, s.full_name || s.id.slice(0, 8)]));

  return (
    <div>
      <OpsPageHeader title={t('ops.pages.tickets')} description={t('ops.pages.ticketsDesc')} />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colTicket')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colProject')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colReporter')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colAssignee')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colPriority')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colStatus')}</th>
              <th className="px-4 py-3 font-medium">{t('ops.ticketsPage.colDate')}</th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((ticket) => (
              <tr key={ticket.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="font-medium hover:text-codiva-primary">
                    {ticket.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {asProject(ticket.projects)?.name || EMPTY_LABEL}
                </td>
                <td className="px-4 py-3">
                  <div>{ticket.reporter_name}</div>
                  <div className="text-zinc-500">{ticket.reporter_email}</div>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {ticket.assigned_to ? names.get(ticket.assigned_to) || EMPTY_LABEL : EMPTY_LABEL}
                </td>
                <td className="px-4 py-3">{TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(ticket.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tickets?.length && <p className="p-6 text-sm text-zinc-500">{t('ops.ticketsPage.empty')}</p>}
      </div>
    </div>
  );
}
