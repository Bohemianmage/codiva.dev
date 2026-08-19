'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AuthCard from '@/components/ui/AuthCard';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
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
    <AuthCard
      title={t('portal.forgot.title')}
      subtitle={t('portal.forgot.subtitlePortal')}
      message={message?.text ?? null}
      messageTone={message?.type === 'ok' ? 'success' : 'error'}
      footer={
        <Link href={`/p/${slug}/login`} className="text-codiva-primary hover:underline">
          {t('portal.forgot.back')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('portal.login.email')} htmlFor="slug-forgot-email">
          <Input
            id="slug-forgot-email"
            type="email"
            required
            size="sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? t('portal.forgot.sending') : t('portal.forgot.sendLink')}
        </Button>
      </form>
    </AuthCard>
  );
}
