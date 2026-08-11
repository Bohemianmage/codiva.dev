import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ClientPortalLoginForm from '@/components/ops/ClientPortalLoginForm';
import { createClient } from '@/lib/supabase/server';
import { listPortalProjectsForUser } from '@/lib/ops/auth';

export default async function ClientPortalLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const projects = await listPortalProjectsForUser(supabase, user.id);
    if (projects.length === 1) {
      redirect(`/p/${projects[0].slug}`);
    }
    if (projects.length > 1) {
      redirect('/proyectos');
    }
  }

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">Cargando…</div>}>
      <ClientPortalLoginForm />
    </Suspense>
  );
}
