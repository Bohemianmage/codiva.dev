import type { Metadata } from 'next';
import OpsToaster from '@/components/ops/OpsToaster';
import OpsI18n from '@/i18n/OpsI18n';
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
    <OpsI18n>
      <div className="min-h-screen bg-codiva-background font-sans text-zinc-900 antialiased">
        {children}
        <OpsToaster />
      </div>
    </OpsI18n>
  );
}
