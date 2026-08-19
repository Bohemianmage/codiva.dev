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

export default function PortalLoginForm({ slug }: { slug: string }) {
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

    const { data: staff } = await supabase
      .from('staff_profiles')
      .select('id')
      .eq('id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    if (staff) {
      toast.success(t('portal.login.welcome'), { id: toastId });
      router.push(safeNextPath(searchParams.get('next'), `/p/${slug}`));
      router.refresh();
      return;
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .eq('client_visible', true)
      .maybeSingle();

    if (!project) {
      await supabase.auth.signOut();
      const msg = t('portal.login.projectUnavailable');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    const { data: member } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', project.id)
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (!member) {
      await supabase.auth.signOut();
      const msg = t('portal.login.noAccess');
      setMessage(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
      return;
    }

    toast.success(t('portal.login.welcome'), { id: toastId });
    router.push(safeNextPath(searchParams.get('next'), `/p/${slug}`));
    router.refresh();
  }

  const errorMsg =
    error === 'no_access'
      ? t('portal.login.noAccess')
      : error === 'not_found'
        ? t('portal.login.notFound')
        : error === 'auth'
          ? t('portal.login.authExpired')
          : message;

  return (
    <AuthCard title={t('portal.login.title')} subtitle={t('portal.login.subtitle')} message={errorMsg || null}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('portal.login.email')} htmlFor="slug-login-email">
          <Input
            id="slug-login-email"
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
          htmlFor="slug-login-password"
          extra={
            <Link
              href={`/p/${slug}/login/forgot-password`}
              className="text-xs text-codiva-primary hover:underline"
            >
              {t('portal.login.forgot')}
            </Link>
          }
        >
          <Input
            id="slug-login-password"
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
