import { Suspense } from 'react';
import OpsLoginForm from './OpsLoginForm';
import { getT } from '@/i18n/locale';

export default async function OpsLoginPage() {
  const t = await getT();
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">{t('portal.login.loading')}</div>}>
      <OpsLoginForm />
    </Suspense>
  );
}
