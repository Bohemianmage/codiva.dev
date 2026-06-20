'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = (slug: string) => [
  { href: `/p/${slug}`, label: 'Resumen' },
  { href: `/p/${slug}/timeline`, label: 'Timeline' },
  { href: `/p/${slug}/cotizacion`, label: 'Cotización' },
  { href: `/p/${slug}/documentos`, label: 'Documentos' },
  { href: `/p/${slug}/entregables`, label: 'Entregables' },
  { href: `/p/${slug}/tickets`, label: 'Tickets' },
];

export default function PortalNav({ slug, projectName }: { slug: string; projectName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const normalized = pathname.replace(/^\/ops/, '');

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/p/${slug}/login`);
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
            <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">Portal del proyecto</p>
            <h1 className="text-xl font-bold text-zinc-900">{projectName}</h1>
          </div>
        </div>
        <button type="button" onClick={signOut} className="text-sm text-zinc-500 hover:text-zinc-800">
          Cerrar sesión
        </button>
      </div>
      <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 pb-3">
        {links(slug).map((l) => {
          const active = normalized === l.href || normalized.startsWith(`${l.href}/`);
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
