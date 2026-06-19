export default function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones = {
    neutral: 'bg-zinc-100 text-zinc-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-sky-100 text-sky-800',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
}

export function leadTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    new: 'info',
    contacted: 'warning',
    qualified: 'success',
    converted: 'success',
    discarded: 'danger',
  };
  return map[status] ?? 'neutral';
}

export function projectTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    draft: 'neutral',
    quoting: 'info',
    active: 'success',
    paused: 'warning',
    delivered: 'success',
    archived: 'neutral',
  };
  return map[status] ?? 'neutral';
}

export function ticketTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    new: 'info',
    in_progress: 'warning',
    waiting_client: 'warning',
    resolved: 'success',
    closed: 'neutral',
  };
  return map[status] ?? 'neutral';
}
