'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const heading = title ?? t('ops.confirm.title');
  const confirmText = confirmLabel ?? t('ops.confirm.ok');
  const cancelText = cancelLabel ?? t('ops.confirm.cancel');

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    (tone === 'danger' ? cancelRef : confirmRef).current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    }

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [open, onCancel, tone]);

  if (!open || typeof document === 'undefined') return null;

  const confirmClass =
    tone === 'primary'
      ? 'rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95'
      : 'rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-zinc-900/40"
        aria-label={cancelText}
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
      >
        <p id={titleId} className="text-base font-semibold text-zinc-900">
          {heading}
        </p>
        <p id={messageId} className="mt-2 text-sm text-zinc-600">
          {message}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {cancelText}
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className={confirmClass}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
