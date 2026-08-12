'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { requestPortalPasswordReset } from '@/lib/ops/password-reset';

export default function PortalForgotPasswordForm({ slug }: { slug: string }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const toastId = toast.loading(t('portal.forgot.sending'));
    const result = await requestPortalPasswordReset(email, slug);
    setMessage({ type: result.ok ? 'ok' : 'err', text: result.message });
    if (result.ok) toast.success(result.message, { id: toastId });
    else toast.error(result.message, { id: toastId });
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('portal.forgot.title')}</h1>
          <LanguageSwitcher />
        </div>
        <p className="mt-1 text-sm text-zinc-600">{t('portal.forgot.subtitlePortal')}</p>

        {message && (
          <p
            className={`mt-4 rounded-lg px-3 py-2 text-sm ${
              message.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('portal.login.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-codiva-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? t('portal.forgot.sending') : t('portal.forgot.sendLink')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link href={`/p/${slug}/login`} className="text-codiva-primary hover:underline">
            {t('portal.forgot.back')}
          </Link>
        </p>
      </div>
    </div>
  );
}
