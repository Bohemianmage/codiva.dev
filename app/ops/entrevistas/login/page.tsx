import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import InterviewsLoginForm from '@/components/ops/InterviewsLoginForm';
import { createClient } from '@/lib/supabase/server';
import { loadActiveInterviewMember, getStaffIfAny } from '@/lib/ops/auth';
import { canAny } from '@/lib/ops/permissions';
import { isOpsHost } from '@/lib/ops/host';
import { headers } from 'next/headers';
import { safeNextPath } from '@/lib/ops/safe-path';
import { getT } from '@/i18n/locale';

export default async function InterviewsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const host = (await headers()).get('host');

  if (user) {
    const params = await searchParams;
    const next = safeNextPath(params.next, '/');
    if (isOpsHost(host)) {
      const staff = await getStaffIfAny();
      if (staff && canAny(staff.staff, ['team', 'careers_review'])) redirect(next || '/');
    } else {
      const loaded = await loadActiveInterviewMember(supabase, user.id);
      if (loaded) redirect(next || '/');
    }
  }

  const t = await getT();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
          {t('interviews.login.loading')}
        </div>
      }
    >
      <InterviewsLoginForm />
    </Suspense>
  );
}
