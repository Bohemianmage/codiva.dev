import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { requireStaff } from '@/lib/ops/auth';
import { updateTicketStatus } from '@/lib/ops/actions';
import { TICKET_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireStaff();

  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, ticket_attachments(*)')
    .eq('id', id)
    .single();

  if (!ticket) redirect('/tickets');

  async function onStatus(formData: FormData) {
    'use server';
    await updateTicketStatus(id, String(formData.get('status')));
  }

  return (
    <div>
      <OpsPageHeader title={ticket.title} description={`Reportado por ${ticket.reporter_name}`} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
        <span className="text-sm capitalize text-zinc-500">Prioridad {ticket.priority}</span>
        <span className="text-sm text-zinc-500">{formatDate(ticket.created_at)}</span>
      </div>

      <form action={onStatus} className="mb-8 flex items-end gap-3">
        <select name="status" defaultValue={ticket.status} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
          {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Actualizar estado
        </button>
      </form>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Descripción</h2>
        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
      </section>

      {ticket.ticket_attachments?.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Adjuntos</h2>
          <ul className="space-y-2 text-sm">
            {ticket.ticket_attachments.map((a: { id: string; file_name: string; file_url: string }) => (
              <li key={a.id}>
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-codiva-primary hover:underline">
                  {a.file_name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ticket.project_id && (
        <p className="mt-4 text-sm">
          <Link href={`/projects/${ticket.project_id}`} className="text-codiva-primary hover:underline">
            Ver proyecto vinculado
          </Link>
        </p>
      )}
    </div>
  );
}
