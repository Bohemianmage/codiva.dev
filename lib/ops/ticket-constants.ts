export const TICKET_MAX_FILES = 5;
export const TICKET_MAX_BYTES = 10 * 1024 * 1024;

export const TICKET_PRIORITY_UI = ['Alta', 'Media', 'Baja'] as const;
export type TicketPriorityUi = (typeof TICKET_PRIORITY_UI)[number];

export const TICKET_PRIORITY_MAP: Record<TicketPriorityUi, 'alta' | 'media' | 'baja'> = {
  Alta: 'alta',
  Media: 'media',
  Baja: 'baja',
};
