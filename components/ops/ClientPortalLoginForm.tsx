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

export default function ClientPortalLoginForm() {
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
    const toastId = toast.loading(t('portal.login.submitting'));

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

    const { data: memberships } = await supabase
      .from('project_members')
      .select('id, projects!inner(id, client_visible)')
      .eq('user_id', data.user.id);

    const hasVisible = (memberships ?? []).some((row) => {
      const raw = row.projects as { client_visible?: boolean } | { client_visible?: boolean }[] | null;
      const p = Array.isArray(raw) ? raw[0] : raw;
      return p?.client_visible === true;
    });

    if (!hasVisible) {
      await supabase.auth.signOut();
      const msg = t('portal.login.noProject');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    toast.success(t('portal.login.welcome'), { id: toastId });
    router.push(safeNextPath(searchParams.get('next'), '/proyectos'));
    router.refresh();
  }

  const errorMsg =
    error === 'no_access'
      ? t('portal.login.noAccess')
      : error === 'auth'
        ? t('portal.login.authExpired')
        : message;

  return (
    <AuthCard title={t('portal.login.title')} subtitle={t('portal.login.subtitle')} message={errorMsg || null}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('portal.login.email')} htmlFor="portal-login-email">
          <Input
            id="portal-login-email"
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
          htmlFor="portal-login-password"
          extra={
            <Link href="/login/forgot-password" className="text-xs text-codiva-primary hover:underline">
              {t('portal.login.forgot')}
            </Link>
          }
        >
          <Input
            id="portal-login-password"
            type="password"
            required
            autoComplete="current-password"
            size="sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? t('portal.login.submitting') : t('portal.login.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
