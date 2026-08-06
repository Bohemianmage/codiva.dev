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

function nodeClasses(status: string) {
  const map: Record<string, string> = {
    completed: 'border-emerald-500 bg-emerald-500 text-white',
    in_progress: 'border-codiva-primary bg-codiva-primary text-white ring-4 ring-codiva-primary/15',
    blocked: 'border-red-500 bg-red-50 text-red-600',
    pending: 'border-zinc-300 bg-white text-zinc-400',
  };
  return map[status] ?? map.pending;
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
    .select('id, title, description, status, due_date, sort_order, milestone_updates(id, body, created_at)')
    .eq('project_id', project.id)
    .eq('visible_to_client', true)
    .order('sort_order');

  const items = milestones ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Timeline del proyecto</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Hitos acordados y avances visibles para el equipo del cliente.
        </p>
      </div>

      {items.length > 0 ? (
        <ol className="space-y-0">
          {items.map((m, i) => {
            const isLast = i === items.length - 1;
            const updates = (m.milestone_updates ?? []) as {
              id: string;
              body: string;
              created_at: string;
            }[];

            return (
              <li key={m.id} className="flex gap-4">
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <span
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold ${nodeClasses(m.status)}`}
                    aria-hidden
                  >
                    {m.status === 'completed' ? '✓' : i + 1}
                  </span>
                  {!isLast && <span className="mt-2 w-px flex-1 bg-zinc-200" aria-hidden />}
                </div>

                <div className={isLast ? 'min-w-0 flex-1 pb-2' : 'min-w-0 flex-1 pb-10'}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Hito {i + 1}
                        {m.due_date ? ` · ${formatDate(m.due_date)}` : ''}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-zinc-900">{m.title}</h3>
                    </div>
                    <StatusBadge
                      label={MILESTONE_STATUS_LABELS[m.status] ?? m.status}
                      tone={milestoneTone(m.status)}
                    />
                  </div>

                  {m.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
                      {m.description}
                    </p>
                  )}

                  {updates.length > 0 && (
                    <ul className="mt-4 space-y-3 border-l border-zinc-200 pl-4">
                      {updates.map((u) => (
                        <li key={u.id}>
                          <time className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                            {formatDate(u.created_at)}
                          </time>
                          <p className="mt-0.5 text-sm text-zinc-600">{u.body}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500">
          El timeline se publicará pronto.
        </p>
      )}
    </div>
  );
}
