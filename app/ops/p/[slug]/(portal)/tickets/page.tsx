import StatusBadge, { ticketTone } from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { TICKET_STATUS_LABELS } from '@/lib/ops/labels';

export default async function PortalTicketsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase, user } = await requireProjectMember(slug);

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, title, status, priority, created_at')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Tickets de soporte</h2>
        <ul className="space-y-2">
          {(tickets ?? []).map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
              <span>{t.title}</span>
              <StatusBadge label={TICKET_STATUS_LABELS[t.status]} tone={ticketTone(t.status)} />
            </li>
          ))}
          {!tickets?.length && <p className="text-sm text-zinc-500">Sin tickets registrados.</p>}
        </ul>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="mb-3 font-semibold">Nuevo ticket</h3>
        <p className="text-sm text-zinc-600">
          Para reportar un incidente usa el{' '}
          <a href="https://codiva.dev/ticket" className="text-codiva-primary hover:underline">
            formulario de soporte
          </a>{' '}
          indicando el mismo email de tu cuenta ({user.email}).
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
