import Link from 'next/link';
import ToastForm from '@/components/ops/ToastForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { redirect } from 'next/navigation';
import { requirePortalAccess } from '@/lib/ops/auth';
import { acceptPortalLegalDocuments } from '@/lib/ops/actions';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';
import { getT } from '@/i18n/locale';

export default async function PortalAcceptLegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const access = await requirePortalAccess(slug);

  if (access.isStaffPreview) {
    redirect(`/p/${slug}`);
  }

  const status = getAcceptanceStatus(access.membership);
  if (status.complete) {
    redirect(`/p/${slug}`);
  }

  const t = await getT();

  async function onAccept(formData: FormData) {
    'use server';
    await acceptPortalLegalDocuments(slug, formData);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-codiva-primary">
            {t('portal.legalAccept.eyebrow')}
          </p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{access.project.name}</h1>
        <p className="mt-3 text-sm text-zinc-600">
          {t('portal.legalAccept.intro', { version: LEGAL_DOCS_VERSION, updated: LEGAL_UPDATED_LABEL })}{' '}
          <strong>{t('portal.legalAccept.allProjects')}</strong> {t('portal.legalAccept.introEnd')}
        </p>

        <ToastForm success={t('portal.legalAccept.accepted')} action={onAccept} className="mt-8 space-y-4">
          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptTerms" required className="mt-1" />
            <span>
              {t('portal.legalAccept.termsPrefix')}{' '}
              <Link href="/legal/terminos" target="_blank" className="font-medium text-codiva-primary hover:underline">
                {t('portal.legalAccept.terms')}
              </Link>
              {!status.terms ? '' : t('portal.legalAccept.alreadyAccepted')}
            </span>
          </label>

          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptPrivacy" required className="mt-1" />
            <span>
              {t('portal.legalAccept.privacyPrefix')}{' '}
              <Link
                href="/legal/aviso-privacidad"
                target="_blank"
                className="font-medium text-codiva-primary hover:underline"
              >
                {t('portal.legalAccept.privacy')}
              </Link>
            </span>
          </label>

          <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
            <input type="checkbox" name="acceptNda" required className="mt-1" />
            <span>
              {t('portal.legalAccept.ndaPrefix')}{' '}
              <Link href="/legal/nda" target="_blank" className="font-medium text-codiva-primary hover:underline">
                {t('portal.legalAccept.nda')}
              </Link>{' '}
              {t('portal.legalAccept.ndaSuffix')}
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-codiva-primary px-4 py-3 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
          >
            {t('portal.legalAccept.submit')}
          </button>
        </ToastForm>

        <p className="mt-6 text-xs text-zinc-500">{t('portal.legalAccept.representative')}</p>
      </div>
    </div>
  );
}
