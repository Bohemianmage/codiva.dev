import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getT } from '@/i18n/locale';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-sm font-medium text-codiva-primary hover:underline">
            ← {t('legal.back')}
          </Link>
          <CodivaWordmarkMark size="sm" />
          <LanguageSwitcher />
        </div>
      </header>
      {children}
    </div>
  );
}
