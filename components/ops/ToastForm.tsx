'use client';

import type { ComponentProps, ReactNode } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

type ServerAction = ((formData: FormData) => Promise<unknown>) | (() => Promise<unknown>);

type ToastFormProps = Omit<ComponentProps<'form'>, 'action'> & {
  action: ServerAction;
  success?: string;
  loading?: string;
  confirmMessage?: string;
  children: ReactNode;
};

/**
 * Formulario que muestra toast de loading / éxito / error alrededor de una server action.
 * Si la action hace `redirect()`, usa `redirectWithToast` para el mensaje en la página destino.
 */
export default function ToastForm({
  action,
  success,
  loading,
  confirmMessage,
  children,
  ...formProps
}: ToastFormProps) {
  const { t } = useTranslation();
  const successLabel = success ?? t('ops.toast.ready');
  const loadingLabel = loading ?? t('ops.toast.saving');

  function errorMessage(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    return t('common.status.actionFailed');
  }

  return (
    <form
      {...formProps}
      action={async (formData) => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const id = toast.loading(loadingLabel);
        try {
          await action(formData);
          toast.success(successLabel, { id });
        } catch (err) {
          if (isRedirectError(err)) {
            toast.dismiss(id);
            throw err;
          }
          toast.error(errorMessage(err), { id });
        }
      }}
    >
      {children}
    </form>
  );
}
