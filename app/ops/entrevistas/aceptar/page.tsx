import Link from 'next/link';
import { redirect } from 'next/navigation';
import ToastForm from '@/components/ops/ToastForm';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import { requireInterviewsAccess } from '@/lib/ops/auth';
import { acceptInterviewLegalDocuments } from '@/lib/ops/interview-actions';
import { getAcceptanceStatus } from '@/lib/ops/legal/acceptances';
import { LEGAL_DOCS_VERSION, LEGAL_UPDATED_LABEL } from '@/lib/ops/legal/version';
import { interviewsHref } from '@/lib/ops/interview-view-as';
import { getT } from '@/i18n/locale';

export default async function InterviewsAcceptPage() {
  const access = await requireInterviewsAccess();
  const homeHref = await interviewsHref('/');
  if (!access.member) redirect(homeHref);
  const status = getAcceptanceStatus(access.member);
  if (status.complete) redirect(homeHref);
  const t = await getT();
  const readOnly = access.isStaffPreview;

  async function onAccept(formData: FormData) {
    'use server';
    await acceptInterviewLegalDocuments(formData);
  }

  return (
    <div className="min-h-screen bg-codiva-background px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-3">
          <CodivaWordmarkMark size="sm" />
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t('interviews.title')}</h1>
        {readOnly ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {t('interviews.previewAsBanner', {
              name: access.member.full_name,
              org: access.partner?.name || t('interviews.eyebrow'),
            })}{' '}
            <Link href="/team?tab=entrevistadores" className="font-medium underline underline-offset-2">
              {t('interviews.previewBack')}
            </Link>
          </p>
        ) : null}
        <p className="mt-3 text-sm text-zinc-600">
          {t('interviews.legal.intro', { version: LEGAL_DOCS_VERSION, updated: LEGAL_UPDATED_LABEL })}
        </p>
        <ToastForm success={t('interviews.legal.accepted')} action={onAccept} className="mt-8 space-y-4">
          <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-60">
            <label className="flex gap-3 rounded-xl border border-zinc-200 p-4 text-sm">
              <input type="checkbox" name="acceptTerms" required className="mt-1" />
              <span>
                {t('portal.legalAccept.termsPrefix')}{' '}
                <Link href="/legal/terminos" target="_blank" className="font-medium text-codiva-primary hover:underline">
                  {t('portal.legalAccept.terms')}
                </Link>
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
                </Link>
              </span>
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-codiva-primary px-4 py-3 text-sm font-semibold text-white hover:bg-codiva-primary-dark"
            >
              {t('interviews.legal.submit')}
            </button>
          </fieldset>
        </ToastForm>
      </div>
    </div>
  );
}
