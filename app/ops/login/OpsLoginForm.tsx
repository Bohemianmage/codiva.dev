'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';

export default function OpsLoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const urlErrorMessage =
    urlError === 'not_staff'
      ? t('ops.login.notStaff')
      : urlError === 'auth'
        ? t('ops.login.authExpired')
        : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const toastId = toast.loading(t('ops.login.submitting'));

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      const msg =
        authError.message === 'Invalid login credentials'
          ? t('portal.login.invalid')
          : authError.message;
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    if (!data.user) {
      const msg = t('portal.login.failed');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    const { data: staff, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    if (staffError || !staff) {
      await supabase.auth.signOut();
      const msg = t('ops.login.notStaffLong');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    toast.success(t('ops.login.welcome'), { id: toastId });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">
            Codiva<span className="font-medium text-codiva-primary">.dev</span>
          </p>
          <LanguageSwitcher />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{t('ops.login.title')}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t('ops.login.subtitle')}</p>

        {(urlErrorMessage || message) && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {message || urlErrorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('portal.login.email')}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm font-medium">{t('portal.login.password')}</label>
              <Link href="/forgot-password" className="text-xs text-codiva-primary hover:underline">
                {t('portal.login.forgot')}
              </Link>
            </div>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:ring-2 focus:ring-codiva-primary/30"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-codiva-primary py-2.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          >
            {loading ? t('ops.login.submitting') : t('ops.login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
