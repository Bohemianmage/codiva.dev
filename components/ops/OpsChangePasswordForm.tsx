'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { changeStaffPassword } from '@/lib/ops/password-reset';

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-codiva-primary/30';

export default function OpsChangePasswordForm() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error(t('ops.settings.passwordMismatch'));
      return;
    }
    setLoading(true);
    const toastId = toast.loading(t('ops.settings.passwordSaving'));
    const result = await changeStaffPassword(currentPassword, newPassword);
    setLoading(false);
    if (result.ok) {
      toast.success(result.message, { id: toastId });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } else {
      toast.error(result.message, { id: toastId });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ops-current-password">
          {t('ops.settings.currentPassword')}
        </label>
        <input
          id="ops-current-password"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ops-new-password">
          {t('ops.settings.newPassword')}
        </label>
        <input
          id="ops-new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="ops-confirm-password">
          {t('ops.settings.confirmPassword')}
        </label>
        <input
          id="ops-confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-codiva-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? t('ops.settings.passwordSaving') : t('ops.settings.passwordSave')}
      </button>
    </form>
  );
}
