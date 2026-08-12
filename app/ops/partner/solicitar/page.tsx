import PartnerRequestForm from '@/components/ops/PartnerRequestForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import { marketingBaseUrl } from '@/lib/ops/host';
import { getT } from '@/i18n/locale';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('partner.title'),
    robots: { index: false, follow: false },
  };
}

export default async function PartnerRequestPage() {
  const t = await getT();
  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <header className="mb-8 text-center">
          <div className="flex items-baseline justify-center gap-1.5">
            <CodivaWordmarkMark size="sm" />
            <span className="text-sm font-medium text-zinc-500">Partners</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t('partner.title')}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t('partner.subtitle')}</p>
        </header>

        <PartnerRequestForm />

        <footer className="mt-10 space-y-2 text-center text-xs text-zinc-500">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="/legal/terminos" className="hover:text-codiva-primary hover:underline">
              {t('partner.terms')}
            </a>
            <a href="/legal/aviso-privacidad" className="hover:text-codiva-primary hover:underline">
              {t('partner.privacy')}
            </a>
          </div>
          <a href={marketingBaseUrl()} className="text-codiva-primary hover:underline">
            codiva.dev
          </a>
        </footer>
      </div>
    </div>
  );
}
