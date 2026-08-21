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

export default function InterviewsLoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const toastId = toast.loading(t('interviews.login.submitting'));
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
      const msg = t('interviews.login.failed');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    const { data: membership } = await supabase
      .from('ops_recruiting_partner_members')
      .select('id, active, ops_recruiting_partners!inner(active)')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    const partner = membership?.ops_recruiting_partners as { active?: boolean } | { active?: boolean }[] | null;
    const org = Array.isArray(partner) ? partner[0] : partner;
    if (!membership?.id || org?.active === false) {
      await supabase.auth.signOut();
      const msg = t('interviews.login.noAccess');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    toast.success(t('interviews.login.welcome'), { id: toastId });
    router.push(safeNextPath(searchParams.get('next'), '/'));
    router.refresh();
  }

  const errorMsg =
    error === 'no_access'
      ? t('interviews.login.noAccess')
      : error === 'auth'
        ? t('interviews.login.authExpired')
        : message;

  return (
    <AuthCard title={t('interviews.login.title')} subtitle={t('interviews.login.subtitle')} message={errorMsg || null}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('interviews.login.email')} htmlFor="interviews-login-email">
          <Input
            id="interviews-login-email"
            type="email"
            required
            autoComplete="email"
            size="sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label={t('interviews.login.password')}
          htmlFor="interviews-login-password"
          extra={
            <Link href="/login/forgot-password" className="text-xs text-codiva-primary hover:underline">
              {t('interviews.login.forgot')}
            </Link>
          }
        >
          <Input
            id="interviews-login-password"
            type="password"
            required
            autoComplete="current-password"
            size="sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? t('interviews.login.submitting') : t('interviews.login.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
