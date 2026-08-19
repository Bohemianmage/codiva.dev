'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AuthCard from '@/components/ui/AuthCard';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import Input from '@/components/ui/Input';
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
    <AuthCard
      title={t('portal.reset.title')}
      subtitle={t('portal.reset.hint')}
      message={message?.text ?? null}
      messageTone={message?.type === 'ok' ? 'success' : 'error'}
      footer={
        <Link href={loginPath} className="text-codiva-primary hover:underline">
          {t('portal.reset.back')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('portal.reset.newPassword')} htmlFor="reset-password">
          <Input
            id="reset-password"
            type="password"
            required
            minLength={8}
            size="sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label={t('portal.reset.confirmPassword')} htmlFor="reset-confirm">
          <Input
            id="reset-confirm"
            type="password"
            required
            minLength={8}
            size="sm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" size="sm" className="w-full" disabled={loading}>
          {loading ? t('portal.reset.saving') : t('portal.reset.save')}
        </Button>
      </form>
    </AuthCard>
  );
}
