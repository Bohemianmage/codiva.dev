import type { Metadata } from 'next';
import OpsToaster from '@/components/ops/OpsToaster';
import { getT } from '@/i18n/locale';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: 'Codiva.dev',
    description: t('ops.metaDescription'),
    robots: { index: false, follow: false },
  };
}

export default function OpsRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased">
      {children}
      <OpsToaster />
    </div>
  );
}
