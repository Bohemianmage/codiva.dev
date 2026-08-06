'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-center font-sans antialiased">
      <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva</p>
      <p className="mt-4 font-display text-6xl font-bold tracking-tight text-zinc-200 sm:text-7xl">
        500
      </p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        Ocurrió un error inesperado. Puedes reintentar o volver al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-codiva-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
