import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PortalAcceptedLegal from '@/components/ops/PortalAcceptedLegal';
import PortalProjectsSignOut from '@/components/ops/PortalProjectsSignOut';
import { listPortalProjectsForUser, requirePortalUser } from '@/lib/ops/auth';
import { getT } from '@/i18n/locale';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';

export async function generateMetadata() {
  const t = await getT();
  return { title: t('portal.account.title') };
}

export default async function PortalHubAccountPage() {
  const { user, supabase } = await requirePortalUser();
  const t = await getT();
  const projects = await listPortalProjectsForUser(supabase, user.id);

  if (projects.length === 1) {
    redirect(`/p/${projects[0].slug}/cuenta`);
  }

  const { data: membership } = await supabase
    .from('project_members')
    .select(
      'terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, nda_accepted_at, nda_version'
    )
    .eq('user_id', user.id)
    .order('nda_accepted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-codiva-background">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Codiva" width={32} height={32} />
            <div>
              <CodivaWordmarkMark size="sm" />
              <p className="text-xs font-medium text-zinc-500">{t('portal.hub.eyebrow')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/proyectos" className="text-sm font-medium text-codiva-primary hover:underline">
              ← {t('portal.myProjects')}
            </Link>
            <LanguageSwitcher />
            <PortalProjectsSignOut />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <PortalAcceptedLegal email={user.email} membership={membership} />
      </main>
    </div>
  );
}
