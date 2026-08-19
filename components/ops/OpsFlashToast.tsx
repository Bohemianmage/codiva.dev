'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { toUserErrorMessage } from '@/lib/user-error';

/** Muestra toasts disparados vía ?toast=success|error&toastMsg=... (p. ej. tras redirect). */
export default function OpsFlashToast() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const type = searchParams.get('toast');
    const msg = searchParams.get('toastMsg');
    if (!type || !msg) return;

    if (type === 'error') toast.error(toUserErrorMessage(msg, t('common.status.actionFailed')));
    else toast.success(msg);

    const next = new URLSearchParams(searchParams.toString());
    next.delete('toast');
    next.delete('toastMsg');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname, t]);

  return null;
}
