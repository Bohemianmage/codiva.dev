import StatusBadge from '@/components/ops/StatusBadge';
import { requireProjectMember } from '@/lib/ops/auth';
import { MILESTONE_STATUS_LABELS, formatDate } from '@/lib/ops/labels';

function milestoneTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'neutral',
    in_progress: 'info',
    completed: 'success',
    blocked: 'danger',
  };
  return map[status] ?? 'neutral';
}

export default async function PortalTimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { project, supabase } = await requireProjectMember(slug);

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*, milestone_updates(*)')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Timeline del proyecto</h2>
      {(milestones ?? []).map((m, i) => (
        <article key={m.id} className="relative rounded-xl border border-zinc-200 bg-white p-5 pl-8">
          <span className="absolute left-3 top-6 flex h-3 w-3 rounded-full bg-codiva-primary" />
          {i < (milestones?.length ?? 0) - 1 && (
            <span className="absolute left-[13px] top-9 h-[calc(100%-12px)] w-px bg-zinc-200" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{m.title}</h3>
            <StatusBadge label={MILESTONE_STATUS_LABELS[m.status]} tone={milestoneTone(m.status)} />
          </div>
          {m.due_date && <p className="mt-1 text-sm text-zinc-500">Fecha: {formatDate(m.due_date)}</p>}
          {m.description && <p className="mt-2 text-sm text-zinc-700">{m.description}</p>}
          {m.milestone_updates?.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
              {m.milestone_updates.map((u: { id: string; body: string; created_at: string }) => (
                <li key={u.id} className="text-sm">
                  <span className="text-xs text-zinc-400">{formatDate(u.created_at)}</span>
                  <p className="text-zinc-600">{u.body}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
      {!milestones?.length && <p className="text-sm text-zinc-500">El timeline se publicará pronto.</p>}
    </div>
  );
}
