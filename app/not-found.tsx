import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-center font-sans antialiased">
      <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva</p>
      <p className="mt-4 font-display text-6xl font-bold tracking-tight text-zinc-200 sm:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">
        El enlace no existe o ya no está disponible. Revisa la URL o vuelve al inicio.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-codiva-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
        >
          Ir al inicio
        </Link>
        <Link
          href="/cotiza"
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Cotizar un proyecto
        </Link>
      </div>
    </main>
  );
}
