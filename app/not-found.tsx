import Link from 'next/link';
import { getT } from '@/i18n/locale';

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-center font-sans antialiased">
      <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Codiva</p>
      <p className="mt-4 font-display text-6xl font-bold tracking-tight text-zinc-200 sm:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-zinc-900">{t('errors.notFoundTitle')}</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-600">{t('errors.notFoundBody')}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-codiva-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
        >
          {t('errors.home')}
        </Link>
        <Link
          href="/cotiza"
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t('errors.quoteCta')}
        </Link>
      </div>
    </main>
  );
}
