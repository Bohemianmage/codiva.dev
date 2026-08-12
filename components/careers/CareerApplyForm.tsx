'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Input, { Textarea } from '@/components/ui/Input';
import { marketingBaseUrl } from '@/lib/ops/host';
const MAX_CV_BYTES = 10 * 1024 * 1024;

type Props = {
  jobPostingId: string;
};

export default function CareerApplyForm({ jobPostingId }: Props) {
  const { t } = useTranslation();
  const legalBase = marketingBaseUrl();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [consentData, setConsentData] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = useMemo(() => {
    return (
      fullName.trim() &&
      email.includes('@') &&
      file &&
      file.type === 'application/pdf' &&
      file.size > 0 &&
      file.size <= MAX_CV_BYTES &&
      consentData &&
      consentTerms
    );
  }, [fullName, email, file, consentData, consentTerms]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !file) return;
    setSubmitting(true);
    setError('');
    try {
      const signRes = await fetch('/api/careers/sign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobPostingId,
          mime_type: 'application/pdf',
          byte_size: file.size,
          original_filename: file.name,
        }),
      });
      const sign = await signRes.json();
      if (!signRes.ok || !sign?.signed_upload_url || !sign?.path) {
        throw new Error(sign?.error || 'sign_failed');
      }

      const put = await fetch(sign.signed_upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': 'application/pdf' },
      });
      if (!put.ok) throw new Error('upload_failed');

      const applyRes = await fetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: jobPostingId,
          cv_storage_path: sign.path,
          original_filename: file.name,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          cover_letter: coverLetter.trim() || undefined,
          consent_data: true,
          consent_terms: true,
        }),
      });
      const apply = await applyRes.json();
      if (!applyRes.ok) throw new Error(apply?.error || 'apply_failed');
      setDone(true);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'duplicate_application') setError(t('career.error_duplicate'));
      else if (code === 'rate_limited' || code === 'rate_limited_email') setError(t('career.error_rate'));
      else setError(t('career.apply_error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-6 text-emerald-900 shadow-sm">
        <p className="font-semibold">{t('career.apply_success')}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{t('career.apply_title')}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t('career.apply_intro')}</p>
      </div>

      <div>
        <label htmlFor="career-name" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.field_name')}
        </label>
        <Input
          id="career-name"
          className=""
          value={fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
          required
          maxLength={200}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="career-email" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.field_email')}
        </label>
        <Input
          id="career-email"
          className=""
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          maxLength={320}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="career-phone" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.field_phone')}
        </label>
        <Input
          id="career-phone"
          className=""
          value={phone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          maxLength={40}
          autoComplete="tel"
        />
      </div>

      <div>
        <label htmlFor="career-letter" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.field_letter')}
        </label>
        <Textarea
          id="career-letter"
          className=""
          rows={4}
          value={coverLetter}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCoverLetter(e.target.value)}
          maxLength={8000}
        />
      </div>

      <div>
        <label htmlFor="career-cv" className="mb-1 block text-sm font-medium text-zinc-800">
          {t('career.field_cv')}
        </label>
        <input
          id="career-cv"
          type="file"
          accept="application/pdf,.pdf"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-codiva-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-codiva-primary-dark"
        />
        <p className="mt-1 text-xs text-zinc-500">{t('career.cv_hint')}</p>
      </div>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={consentData}
          onChange={(e) => setConsentData(e.target.checked)}
          required
        />
        <span>{t('career.consent_data')}</span>
      </label>

      <label className="flex items-start gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={consentTerms}
          onChange={(e) => setConsentTerms(e.target.checked)}
          required
        />
        <span>
          {t('career.consent_terms_prefix')}{' '}
          <a href={`${legalBase}/legal/terminos`} className="font-medium text-codiva-primary hover:underline">
            {t('footer.terms')}
          </a>{' '}
          {t('career.consent_terms_and')}{' '}
          <a href={`${legalBase}/legal/aviso-privacidad`} className="font-medium text-codiva-primary hover:underline">
            {t('footer.privacy')}
          </a>
          .
        </span>
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={!canSubmit || submitting} className="w-full">
        {submitting ? t('career.submitting') : t('career.submit')}
      </Button>
    </form>
  );
}
