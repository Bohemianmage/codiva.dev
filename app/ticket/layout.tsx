import LayoutClient from '../LayoutClient';

export default function TicketLayout({ children }: { children: React.ReactNode }) {
  return <LayoutClient variant="ticket">{children}</LayoutClient>;
}
