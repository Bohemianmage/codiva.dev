'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';

export default function PortalProjectsSignOut() {
  const router = useRouter();
  const { t } = useTranslation();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} className="text-sm text-zinc-500 hover:text-zinc-800">
      {t('portal.signOut')}
    </button>
  );
}
