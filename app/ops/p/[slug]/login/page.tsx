import { Suspense } from 'react';
import PortalLoginForm from './PortalLoginForm';
import { getT } from '@/i18n/locale';

export default async function PortalLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getT();
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">{t('portal.login.loading')}</div>}>
      <PortalLoginForm slug={slug} />
    </Suspense>
  );
}
