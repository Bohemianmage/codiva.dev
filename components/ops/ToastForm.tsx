'use client';

import type { ComponentProps, ReactNode } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import toast from 'react-hot-toast';

type ServerAction = ((formData: FormData) => Promise<unknown>) | (() => Promise<unknown>);

type ToastFormProps = Omit<ComponentProps<'form'>, 'action'> & {
  action: ServerAction;
  success?: string;
  loading?: string;
  children: ReactNode;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'No se pudo completar la acción.';
}

/**
 * Formulario que muestra toast de loading / éxito / error alrededor de una server action.
 * Si la action hace `redirect()`, usa `redirectWithToast` para el mensaje en la página destino.
 */
export default function ToastForm({
  action,
  success = 'Listo',
  loading = 'Guardando…',
  children,
  ...formProps
}: ToastFormProps) {
  return (
    <form
      {...formProps}
      action={async (formData) => {
        const id = toast.loading(loading);
        try {
          await action(formData);
          toast.success(success, { id });
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
