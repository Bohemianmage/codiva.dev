import Link from 'next/link';
import { redirect } from 'next/navigation';
import OpsPageHeader from '@/components/ops/OpsPageHeader';
import ToastForm from '@/components/ops/ToastForm';
import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { assertProjectAccess, requireCapability } from '@/lib/ops/auth';
import { updateTicketAssignment } from '@/lib/ops/actions';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';
import { opsProjectPath } from '@/lib/ops/project-path';

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireCapability('tickets');
  const { supabase } = access;
  const t = await getT();
  const { EMPTY_LABEL, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS, formatDate } = labelsFor(t.locale);

  const [{ data: ticket }, { data: staff }] = await Promise.all([
    supabase.from('tickets').select('*, ticket_attachments(*), projects(slug)').eq('id', id).single(),
    supabase.from('staff_profiles').select('id, full_name').eq('active', true).order('full_name'),
  ]);

  if (!ticket) redirect('/tickets');
  if (ticket.project_id) {
    await assertProjectAccess(access, ticket.project_id);
  }
  const ticketProject = Array.isArray(ticket.projects) ? ticket.projects[0] : ticket.projects;
  const ticketProjectSlug =
    (ticketProject as { slug?: string } | null)?.slug ?? ticket.project_id;

  const assigneeName =
    staff?.find((s) => s.id === ticket.assigned_to)?.full_name || null;

  async function onUpdate(formData: FormData) {
    'use server';
    await updateTicketAssignment(id, formData);
  }

  return (
    <div>
      <OpsPageHeader title={ticket.title} description={t('ops.ticketsPage.reportedBy', { name: ticket.reporter_name })} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
        <span className="text-sm text-zinc-500">
          {t('ops.ticketsPage.priority', {
            priority: TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
          })}
        </span>
        <span className="text-sm text-zinc-500">{formatDate(ticket.created_at)}</span>
        <span className="text-sm text-zinc-500">
          {t('ops.ticketsPage.assigned', { name: assigneeName || EMPTY_LABEL })}
        </span>
      </div>

      <ToastForm success={t('ops.ticketsPage.saved')} action={onUpdate} className="mb-8 flex flex-wrap items-end gap-3">
        <label className="text-sm text-zinc-600">
          {t('ops.ticketsPage.status')}
          <select name="status" defaultValue={ticket.status} className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            {Object.entries(TICKET_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-600">
          {t('ops.ticketsPage.assignTo')}
          <select
            name="assignedTo"
            defaultValue={ticket.assigned_to ?? ''}
            className="mt-1 block rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">{t('ops.ticketsPage.unassigned')}</option>
            {(staff ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name || s.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50">
          {t('ops.ticketsPage.save')}
        </button>
      </ToastForm>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">{t('ops.ticketsPage.description')}</h2>
        {ticket.incident_time && (
          <p className="mb-3 text-sm text-zinc-500">{t('ops.ticketsPage.incidentTime', { time: ticket.incident_time })}</p>
        )}
        <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
      </section>

      {ticket.ticket_attachments?.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">{t('ops.ticketsPage.attachments')}</h2>
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
          <Link href={opsProjectPath(ticketProjectSlug)} className="text-codiva-primary hover:underline">
            {t('ops.ticketsPage.viewProject')}
          </Link>
        </p>
      )}
    </div>
  );
}
