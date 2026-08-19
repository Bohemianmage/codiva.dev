import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ClientPortalLoginForm from '@/components/ops/ClientPortalLoginForm';
import { createClient } from '@/lib/supabase/server';
import { listPortalProjectsForUser } from '@/lib/ops/auth';
import { safeNextPath } from '@/lib/ops/safe-path';

import { getT } from '@/i18n/locale';

export default async function ClientPortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const params = await searchParams;
    const next = safeNextPath(params.next, '');
    if (next) redirect(next);
    const projects = await listPortalProjectsForUser(supabase, user.id);
    if (projects.length === 1) {
      redirect(`/p/${projects[0].slug}`);
    }
    if (projects.length > 1) {
      redirect('/proyectos');
    }
  }

  const t = await getT();

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">{t('portal.login.loading')}</div>}>
      <ClientPortalLoginForm />
    </Suspense>
  );
}
