'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Inbox,
  Users,
  FolderKanban,
  Ticket,
  LogOut,
  Settings,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export default function OpsSidebar({ staffName }: { staffName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const normalized = pathname.replace(/^\/ops/, '') || '/dashboard';

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">
          Codiva Ops
        </p>
        <p className="mt-1 truncate text-sm text-zinc-600">{staffName}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = normalized === href || normalized.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-codiva-primary text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
