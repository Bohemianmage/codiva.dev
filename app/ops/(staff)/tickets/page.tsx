import Link from 'next/link';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { TICKET_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

export default async function TicketsPage() {
  const { supabase } = await requireStaff();
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, priority, status, reporter_name, reporter_email, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <OpsPageHeader title="Tickets" description="Soporte y solicitudes de clientes" />
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Reportó</th>
              <th className="px-4 py-3 font-medium">Prioridad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t) => (
              <tr key={t.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link href={`/tickets/${t.id}`} className="font-medium hover:text-codiva-primary">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{t.reporter_name}</div>
                  <div className="text-zinc-500">{t.reporter_email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{t.priority}</td>
                <td className="px-4 py-3">
                  <StatusBadge label={TICKET_STATUS_LABELS[t.status]} tone={ticketTone(t.status)} />
                </td>
                <td className="px-4 py-3 text-zinc-500">{formatDate(t.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tickets?.length && <p className="p-6 text-sm text-zinc-500">No hay tickets</p>}
      </div>
    </div>
  );
}
