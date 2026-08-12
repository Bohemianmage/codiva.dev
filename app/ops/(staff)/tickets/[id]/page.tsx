import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { requireCapability } from '@/lib/ops/auth';
import { updateTicketAssignment } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireCapability('tickets');
  const t = await getT();
  const { EMPTY_LABEL, TICKET_STATUS_LABELS, formatDate } = labelsFor(t.locale);

  const [{ data: ticket }, { data: staff }] = await Promise.all([
    supabase.from('tickets').select('*, ticket_attachments(*)').eq('id', id).single(),
    supabase.from('staff_profiles').select('id, full_name').eq('active', true).order('full_name'),
  ]);

  if (!ticket) redirect('/tickets');

  const assigneeName =
    staff?.find((s) => s.id === ticket.assigned_to)?.full_name || null;

  async function onUpdate(formData: FormData) {
    'use server';
    await updateTicketAssignment(id, formData);
  }

  return (
    <div>
      <OpsPageHeader title={ticket.title} description={`Reportado por ${ticket.reporter_name}`} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
        <span className="text-sm capitalize text-zinc-500">Prioridad {ticket.priority}</span>
        <span className="text-sm text-zinc-500">{formatDate(ticket.created_at)}</span>
        <span className="text-sm text-zinc-500">Asignado: {assigneeName || EMPTY_LABEL}</span>
      </div>

      <ToastForm success="Guardado" action={onUpdate} className="mb-8 flex flex-wrap items-end gap-3">
        <label className="text-sm text-zinc-600">
          Estado
          <select name="status" defaultValue={ticket.status} className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-600">
          Asignado a
          <select
            name="assignedTo"
            defaultValue={ticket.assigned_to ?? ''}
            className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Sin asignar</option>
            {(staff ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          Guardar
        </button>
      </ToastForm>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Descripción</h2>
        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
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
