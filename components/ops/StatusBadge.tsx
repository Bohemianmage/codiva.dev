export default function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const tones = {
    neutral: 'bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-200/70',
    success: 'bg-emerald-50/80 text-emerald-700 ring-1 ring-inset ring-emerald-200/50',
    warning: 'bg-amber-50/80 text-amber-700 ring-1 ring-inset ring-amber-200/50',
    danger: 'bg-red-50/80 text-red-700 ring-1 ring-inset ring-red-200/50',
    info: 'bg-sky-50/80 text-sky-700 ring-1 ring-inset ring-sky-200/50',
  };
  return (
    <span
      className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${tones[tone]}`}
    >
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

export function chargeTone(status: string) {
  const map: Record<string, 'neutral' | 'success' | 'warning' | 'danger' | 'info'> = {
    pending: 'warning',
    paid: 'success',
    overdue: 'danger',
    waived: 'neutral',
  };
  return map[status] ?? 'neutral';
}
