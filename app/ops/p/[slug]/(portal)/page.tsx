import StatusBadge, { projectTone } from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { PROJECT_STATUS_LABELS, MILESTONE_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

function milestoneTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'neutral',
    in_progress: 'info',
    completed: 'success',
    blocked: 'danger',
  };
  return map[status] ?? 'neutral';
}

export default async function PortalHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);

  const { data: milestones } = await supabase
    .from('milestones')
    .select('id, title, status, due_date')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order');

  const nextMilestone = milestones?.find((m) => m.status !== 'completed');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge label={PROJECT_STATUS_LABELS[project.status]} tone={projectTone(project.status)} />
          <span className="text-sm text-zinc-500">Estado del proyecto</span>
        </div>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Progreso</span>
            <span>{project.progress_percent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-codiva-primary transition-all"
              style={{ width: `${project.progress_percent ?? 0}%` }}
            />
          </div>
        </div>
        {nextMilestone && (
          <div className="mt-6 rounded-lg bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase text-zinc-500">Próximo hito</p>
            <p className="mt-1 font-medium">{nextMilestone.title}</p>
            <p className="text-sm text-zinc-500">{formatDate(nextMilestone.due_date)}</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 font-semibold">Hitos recientes</h2>
        <ul className="space-y-3">
          {(milestones ?? []).slice(0, 5).map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{m.title}</span>
              <StatusBadge label={MILESTONE_STATUS_LABELS[m.status]} tone={milestoneTone(m.status)} />
            </li>
          ))}
          {!milestones?.length && <p className="text-sm text-zinc-500">Aún no hay hitos publicados.</p>}
        </ul>
      </section>
    </div>
  );
}
