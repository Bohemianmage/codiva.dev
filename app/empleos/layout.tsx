import CareerI18n from '@/i18n/CareerI18n';
import LayoutClient from '../LayoutClient';

export default function EmpleosLayout({ children }: { children: React.ReactNode }) {
  return (
    <CareerI18n>
      <LayoutClient variant="career">{children}</LayoutClient>
    </CareerI18n>
  );
}
