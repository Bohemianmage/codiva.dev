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
  ContactRound,
  UserCog,
  Building2,
  Gauge,
} from 'lucide-react';
import { can, type Capability, type StaffRole } from '@/lib/ops/permissions';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';

const NAV: {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  capability?: Capability | null;
}[] = [
  { href: '/dashboard', labelKey: 'ops.nav.dashboard', icon: LayoutDashboard },
  { href: '/leads', labelKey: 'ops.nav.leads', icon: Users, capability: 'leads' },
  { href: '/inbox', labelKey: 'ops.nav.inbox', icon: Inbox, capability: 'inbox' },
  { href: '/projects', labelKey: 'ops.nav.projects', icon: FolderKanban },
  { href: '/workload', labelKey: 'ops.nav.workload', icon: Gauge, capability: 'workload' },
  { href: '/organizations', labelKey: 'ops.nav.organizations', icon: Building2, capability: 'organizations' },
  { href: '/users', labelKey: 'ops.nav.users', icon: ContactRound, capability: 'portal_users' },
  { href: '/tickets', labelKey: 'ops.nav.tickets', icon: Ticket, capability: 'tickets' },
  { href: '/team', labelKey: 'ops.nav.team', icon: UserCog, capability: 'team' },
  { href: '/settings', labelKey: 'ops.nav.settings', icon: Settings, capability: 'settings_profile' },
];

export default function OpsSidebar({
  staffName,
  staffRole = 'dev',
}: {
  staffName: string;
  staffRole?: StaffRole | string;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();

  const normalized = pathname.replace(/^\/ops/, '') || '/dashboard';
  const items = NAV.filter((item) => {
    if (!item.capability) return true;
    return can(staffRole, item.capability);
  });

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-5">
        <CodivaWordmarkMark size="sm" />
        <p className="mt-1 truncate text-sm text-zinc-600">{staffName}</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map(({ href, labelKey, icon: Icon }) => {
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
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 space-y-2">
        <div className="flex justify-center py-1">
          <LanguageSwitcher />
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        >
          <LogOut className="h-4 w-4" />
          {t('ops.signOut')}
        </button>
      </div>
    </aside>
  );
}
