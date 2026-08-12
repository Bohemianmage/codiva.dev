import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { labelsFor } from '@/lib/ops/labels';
import { getT } from '@/i18n/locale';

export default async function PortalTicketsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase, user } = await requireProjectMember(slug);
  const t = await getT();
  const { TICKET_STATUS_LABELS } = labelsFor(t.locale);

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, status, priority, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold">{t('portal.ticketsPage.title')}</h2>
        <ul className="space-y-2">
          {(tickets ?? []).map((ticket) => (
            <li
              key={ticket.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm"
            >
              <span>{ticket.title}</span>
              <StatusBadge label={TICKET_STATUS_LABELS[ticket.status]} tone={ticketTone(ticket.status)} />
            </li>
          ))}
          {!tickets?.length && (
            <p className="text-sm text-zinc-500">{t('portal.ticketsPage.empty')}</p>
          )}
        </ul>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">{t('portal.ticketsPage.new')}</h3>
        <p className="text-sm text-zinc-600">
          {t('portal.ticketsPage.hintPrefix')}{' '}
          <a href="https://codiva.dev/ticket" className="text-codiva-primary hover:underline">
            {t('portal.ticketsPage.form')}
          </a>{' '}
          {t('portal.ticketsPage.hintSuffix', { email: user.email })}
        </p>
        <form
          action={`/api/ticket`}
          method="POST"
          encType="multipart/form-data"
          className="mt-4 hidden"
        >
          <input type="hidden" name="projectId" value={project.id} />
        </form>
      </section>
    </div>
  );
}
