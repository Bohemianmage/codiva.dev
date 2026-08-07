export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  converted: 'Convertido',
  discarded: 'Descartado',
};

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  web_cotiza: 'Web /cotiza',
  referral: 'Referido / intermediario',
  manual: 'Manual (Ops)',
  contact_form: 'Formulario contacto',
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

export const DELIVERABLE_KIND_LABELS: Record<string, string> = {
  architecture: 'Arquitectura',
  mvp: 'MVP / Propuesta',
  proposal: 'Propuesta',
  other: 'Otro',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  contract: 'Contrato',
  nda: 'NDA',
  proposal_pdf: 'Propuesta PDF',
  other: 'Otro',
};

export const DOCUMENT_SOURCE_LABELS: Record<string, string> = {
  staff: 'Codiva',
  client: 'Cliente',
};

export const DOCUMENT_REQUEST_STATUS_LABELS: Record<string, string> = {
  open: 'Pendiente',
  fulfilled: 'Entregado',
  waived: 'Omitido',
  cancelled: 'Cancelado',
};

export const DOCUMENT_REQUEST_INPUT_LABELS: Record<string, string> = {
  file: 'Archivo',
  text: 'Texto',
  credentials: 'Accesos',
};

export const CHARGE_KIND_LABELS: Record<string, string> = {
  development: 'Desarrollo',
  hosting: 'Alojamiento',
  domain: 'Dominio',
  pass_through: 'Gasto a cargo del cliente',
  other: 'Otro',
};

export const CHARGE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
  waived: 'Omitido',
};

export const SITE_ACCESS_KIND_LABELS: Record<string, string> = {
  preview: 'Preview / staging',
  production: 'Producción',
  cms: 'Admin / CMS',
  other: 'Otro acceso',
};

/** Hosting, dominio y pass-through siempre van a cargo del cliente cuando aplican. */
export const CLIENT_BORNE_CHARGE_KINDS = ['hosting', 'domain', 'pass_through'] as const;

export function isClientBorneChargeKind(kind: string): boolean {
  return (CLIENT_BORNE_CHARGE_KINDS as readonly string[]).includes(kind);
}

export const INBOX_STATUS_LABELS: Record<string, string> = {
  unread: 'Sin leer',
  read: 'Leído',
  replied: 'Respondido',
  archived: 'Archivado',
};

export const EMPTY_LABEL = '-';

export const DEFAULT_PROJECT_STATE = 'Por iniciar - pendiente de aprobación formal';

export function formatDate(date: string | null | undefined): string {
  if (!date) return EMPTY_LABEL;
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatChargeAmount(amount: number | null | undefined, currency = 'MXN'): string {
  if (amount == null) return 'Por confirmar';
  return formatCurrency(amount, currency);
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD'): string {
  if (amount == null) return EMPTY_LABEL;
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}
