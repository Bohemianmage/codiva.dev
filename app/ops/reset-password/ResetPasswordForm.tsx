'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import CodivaWordmarkMark from '@/components/CodivaWordmarkMark';
import { updatePassword } from '@/lib/ops/password-reset';

export default function ResetPasswordForm({ loginPath = '/login' }: { loginPath?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      const msg = t('portal.reset.mismatch');
      setMessage({ type: 'err', text: msg });
      toast.error(msg);
      return;
    }
    setLoading(true);
    setMessage(null);
    const toastId = toast.loading(t('portal.reset.saving'));
    const result = await updatePassword(password);
    setMessage({ type: result.ok ? 'ok' : 'err', text: result.message });
    setLoading(false);
    if (result.ok) {
      toast.success(result.message, { id: toastId });
      setTimeout(() => router.push(loginPath), 2000);
    } else {
      toast.error(result.message, { id: toastId });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <CodivaWordmarkMark size="sm" />
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t('portal.reset.title')}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t('portal.reset.hint')}</p>

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
            <label className="mb-1 block text-sm font-medium">{t('portal.reset.newPassword')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('portal.reset.confirmPassword')}</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-codiva-primary py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? t('portal.reset.saving') : t('portal.reset.save')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link href={loginPath} className="text-codiva-primary hover:underline">
            {t('portal.reset.back')}
          </Link>
        </p>
      </div>
    </div>
  );
}
