import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { DataTable, EmptyRow, THead, Td, Th, Tr } from '@/components/ui/DataTable';
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
      <DataTable>
        <THead>
          <tr>
            <Th>{t('ops.ticketsPage.colTicket')}</Th>
            <Th>{t('ops.ticketsPage.colProject')}</Th>
            <Th>{t('ops.ticketsPage.colReporter')}</Th>
            <Th>{t('ops.ticketsPage.colAssignee')}</Th>
            <Th>{t('ops.ticketsPage.colPriority')}</Th>
            <Th>{t('ops.ticketsPage.colStatus')}</Th>
            <Th>{t('ops.ticketsPage.colDate')}</Th>
          </tr>
        </THead>
        <tbody>
          {(tickets ?? []).map((ticket) => (
            <Tr key={ticket.id}>
              <Td>
                <Link href={`/tickets/${ticket.id}`} className="font-medium hover:text-codiva-primary">
                  {ticket.title}
                </Link>
              </Td>
              <Td className="text-zinc-600">{asProject(ticket.projects)?.name || EMPTY_LABEL}</Td>
              <Td>
                <div>{ticket.reporter_name}</div>
                <div className="text-zinc-500">{ticket.reporter_email}</div>
              </Td>
              <Td className="text-zinc-600">
                {ticket.assigned_to ? names.get(ticket.assigned_to) || EMPTY_LABEL : EMPTY_LABEL}
              </Td>
              <Td>{TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</Td>
              <Td>
                <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
              </Td>
              <Td className="text-zinc-500">{formatDate(ticket.created_at)}</Td>
            </Tr>
          ))}
          {!tickets?.length && <EmptyRow colSpan={7}>{t('ops.ticketsPage.empty')}</EmptyRow>}
        </tbody>
      </DataTable>
    </div>
  );
}
