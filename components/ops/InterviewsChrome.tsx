import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import PortalProjectsSignOut from '@/components/ops/PortalProjectsSignOut';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import { getT } from '@/i18n/locale';

export default async function InterviewsChrome({
  children,
  isStaffPreview,
  orgName,
}: {
  children: React.ReactNode;
  isStaffPreview?: boolean;
  orgName?: string | null;
}) {
  const t = await getT();
  return (
    <div className="min-h-screen bg-codiva-background">
      {isStaffPreview ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
            <p>
              <span className="font-semibold">{t('ops.preview.staff')}</span>
              {' · '}
              {t('interviews.previewBanner')}
            </p>
            <Link href="/team?tab=entrevistadores" className="font-medium underline underline-offset-2">
              {t('interviews.previewBack')}
            </Link>
          </div>
        </div>
      ) : null}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <CodivaWordmarkMark size="sm" />
            <p className="text-xs font-medium text-zinc-500">{orgName || t('interviews.eyebrow')}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
              {t('interviews.title')}
            </Link>
            <Link href="/cuenta" className="text-sm text-zinc-500 hover:text-zinc-800">
              {t('interviews.account')}
            </Link>
            <LanguageSwitcher />
            {!isStaffPreview ? <PortalProjectsSignOut /> : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
