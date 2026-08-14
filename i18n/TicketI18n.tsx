'use client';

import { injectTranslationBundle } from '@/i18n/injectBundle';
import en from '@/i18n/locales/en/ticket.json';
import es from '@/i18n/locales/es/ticket.json';

injectTranslationBundle('ticket', es, en);

export default function TicketI18n({ children }: { children: React.ReactNode }) {
  return children;
}
