import LayoutClient from '../LayoutClient';

export default function EmpleosLayout({ children }: { children: React.ReactNode }) {
  return <LayoutClient variant="career">{children}</LayoutClient>;
}
