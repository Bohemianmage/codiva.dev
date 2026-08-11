'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PortalVisibility } from '@/lib/ops/portal-visibility';

function links(slug: string, visibility: PortalVisibility) {
  const all = [
    { href: `/p/${slug}`, label: 'Resumen', key: 'home' },
    { href: `/p/${slug}/propuesta`, label: 'Propuesta', key: 'proposal' },
    { href: `/p/${slug}/cotizacion`, label: 'Cotización', key: 'quote' },
    { href: `/p/${slug}/pagos`, label: 'Pagos', key: 'payments' },
    { href: `/p/${slug}/sitio`, label: 'Tu sitio', key: 'site' },
    { href: `/p/${slug}/documentos`, label: 'Documentos', key: 'docs' },
    { href: `/p/${slug}/timeline`, label: 'Timeline', key: 'timeline' },
    { href: `/p/${slug}/entregables`, label: 'Entregables', key: 'deliverables' },
    { href: `/p/${slug}/tickets`, label: 'Tickets', key: 'tickets' },
  ];
  return all.filter((l) => {
    if (l.key === 'quote') return visibility.showQuote;
    if (l.key === 'payments') return visibility.showCosts;
    return true;
  });
}

export default function PortalNav({
  slug,
  projectName,
  visibility,
  showProjectsLink = false,
}: {
  slug: string;
  projectName: string;
  visibility: PortalVisibility;
  showProjectsLink?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const normalized = pathname.replace(/^\/ops/, '');

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(showProjectsLink ? '/login' : `/p/${slug}/login`);
    router.refresh();
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <Link href={`/p/${slug}`} className="mt-0.5 shrink-0 sm:mt-0">
            <Image src="/logo.svg" alt="Codiva" width={32} height={32} />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">
              Portal del proyecto
            </p>
            <h1 className="text-xl font-bold text-zinc-900">{projectName}</h1>
            {showProjectsLink ? (
              <Link
                href="/proyectos"
                className="mt-1 inline-block text-xs font-medium text-codiva-primary hover:underline"
              >
                ← Mis proyectos
              </Link>
            ) : null}
          </div>
        </div>
        <button type="button" onClick={signOut} className="text-sm text-zinc-500 hover:text-zinc-800">
          Cerrar sesión
        </button>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 pb-3">
        {links(slug, visibility).map((l) => {
          const active =
            l.href === `/p/${slug}`
              ? normalized === l.href
              : normalized === l.href || normalized.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                active ? 'bg-codiva-primary text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
