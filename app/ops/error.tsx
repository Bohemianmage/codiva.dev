'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function OpsError({
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva</p>
      <p className="mt-4 font-display text-6xl font-bold tracking-tight text-zinc-200 sm:text-7xl">
        500
      </p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        Ocurrió un error inesperado. Reintenta o vuelve a una pantalla conocida.
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
          href="/dashboard"
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Dashboard
        </Link>
        <Link
          href="/login"
          className="text-sm text-zinc-500 hover:text-codiva-primary hover:underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}
