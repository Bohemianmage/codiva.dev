import type { Metadata } from 'next';
import TicketRequestForm from '@/components/ticket/TicketRequestForm';
import { getT } from '@/i18n/locale';
import { ticketBaseUrl } from '@/lib/ops/host';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const url = ticketBaseUrl();
  return {
    title: t('ticket.title'),
    description: t('ticket.subtitle'),
    alternates: { canonical: url },
    openGraph: { url },
  };
}

export default function TicketPage() {
  return <TicketRequestForm variant="public" />;
}
