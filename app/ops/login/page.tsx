import { Suspense } from 'react';
import OpsLoginForm from './OpsLoginForm';

export default function OpsLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Cargando…</div>}>
      <OpsLoginForm />
    </Suspense>
  );
}
