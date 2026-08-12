'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function PartnerRequestForm() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = Object.fromEntries(formData.entries());
    const toastId = toast.loading(t('partner.sending'));

    try {
      const res = await fetch('/api/partner-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || t('partner.sendError');
        setError(msg);
        toast.error(msg, { id: toastId });
        return;
      }
      setSubmitted(true);
      form.reset();
      toast.success(t('partner.sent'), { id: toastId });
    } catch {
      const msg = t('partner.connectionError');
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">{t('partner.receivedTitle')}</h2>
        <p className="mt-2 text-sm text-emerald-800">{t('partner.receivedBody')}</p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-medium text-codiva-primary hover:underline"
        >
          {t('partner.sendAnother')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-codiva-primary">
          {t('partner.yourData')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.name')}</span>
            <input name="partnerName" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.email')}</span>
            <input name="partnerEmail" type="email" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">{t('partner.company')}</span>
            <input name="partnerCompany" required className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">{t('partner.phone')}</span>
            <input name="phone" type="tel" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          {t('partner.endClient')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.endClientName')}</span>
            <input name="endClientName" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.endClientCompany')}</span>
            <input name="endClientCompany" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          {t('partner.project')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.serviceType')}</span>
            <select name="serviceType" className="w-full rounded-lg border border-zinc-300 px-3 py-2">
              <option value="Web">{t('partner.web')}</option>
              <option value="PWA">{t('partner.pwa')}</option>
              <option value="App">{t('partner.app')}</option>
              <option value="E-Shop">{t('partner.eshop')}</option>
              <option value="LMS">{t('partner.lms')}</option>
              <option value="Otro">{t('partner.other')}</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.delivery')}</span>
            <input name="deliveryDate" type="date" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">{t('partner.need')}</span>
            <textarea
              name="need"
              required
              rows={5}
              placeholder={t('partner.needPlaceholder')}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.budget')}</span>
            <input name="budget" type="number" step="0.01" min="0" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('partner.reference')}</span>
            <input name="referenceSite" type="url" placeholder="https://" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
          </label>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-zinc-500">
          {t('partner.consent')}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-codiva-primary px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? t('partner.submitting') : t('partner.submit')}
        </button>
      </div>

      <p className="text-center text-sm text-zinc-500">
        {t('partner.directClient')}{' '}
        <Link href="https://codiva.dev/cotiza" className="text-codiva-primary hover:underline">
          {t('partner.quoteOnSite')}
        </Link>
      </p>
    </form>
  );
}
