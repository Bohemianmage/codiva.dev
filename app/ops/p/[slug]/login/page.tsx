import { Suspense } from 'react';
import PortalLoginForm from './PortalLoginForm';

export default async function PortalLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando…</div>}>
      <PortalLoginForm slug={slug} />
    </Suspense>
  );
}
