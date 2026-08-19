'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AuthCard from '@/components/ui/AuthCard';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/ops/safe-path';
import { authErrorMessage } from '@/lib/user-error';

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
      const msg = authErrorMessage(authError.message, t);
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
    router.push(safeNextPath(searchParams.get('next'), '/dashboard'));
    router.refresh();
  }

  return (
    <AuthCard
      title={t('ops.login.title')}
      subtitle={t('ops.login.subtitle')}
      message={message || urlErrorMessage || null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('portal.login.email')} htmlFor="ops-login-email">
          <Input
            id="ops-login-email"
            type="email"
            required
            autoComplete="email"
            size="sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label={t('portal.login.password')}
          htmlFor="ops-login-password"
          extra={
            <Link href="/forgot-password" className="text-xs text-codiva-primary hover:underline">
              {t('portal.login.forgot')}
            </Link>
          }
        >
          <Input
            id="ops-login-password"
            type="password"
            required
            autoComplete="current-password"
            size="sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? t('ops.login.submitting') : t('ops.login.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
