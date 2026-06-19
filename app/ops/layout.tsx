import type { Metadata } from 'next';
import OpsToaster from '@/components/ops/OpsToaster';

export const metadata: Metadata = {
  title: 'Codiva Ops',
  description: 'Backoffice operativo Codiva',
  robots: { index: false, follow: false },
};

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      {children}
      <OpsToaster />
    </div>
  );
}
