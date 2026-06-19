export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  converted: 'Convertido',
  discarded: 'Descartado',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  quoting: 'Cotización',
  active: 'En curso',
  paused: 'Pausado',
  delivered: 'Entregado',
  archived: 'Archivado',
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  in_progress: 'En progreso',
  waiting_client: 'Esperando cliente',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
};

export const MILESTONE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completado',
  blocked: 'Bloqueado',
};

export const INBOX_STATUS_LABELS: Record<string, string> = {
  unread: 'Sin leer',
  read: 'Leído',
  replied: 'Respondido',
  archived: 'Archivado',
};

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}
