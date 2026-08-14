import TicketI18n from '@/i18n/TicketI18n';
import LayoutClient from '../LayoutClient';

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return (
    <TicketI18n>
      <LayoutClient variant="ticket">{children}</LayoutClient>
    </TicketI18n>
  );
}
