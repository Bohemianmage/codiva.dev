'use client';

import { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

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
  const heading = title ?? t('ops.confirm.title');
  const confirmText = confirmLabel ?? t('ops.confirm.ok');
  const cancelText = cancelLabel ?? t('ops.confirm.cancel');

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    return () => {
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={heading}
      titleId={titleId}
      describedBy={messageId}
      closeLabel={cancelText}
    >
      <p id={messageId} className="mt-2 text-sm text-zinc-600">
        {message}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="xs"
          autoFocus={tone === 'danger'}
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={tone === 'primary' ? 'primary' : 'dangerSolid'}
          size="xs"
          autoFocus={tone === 'primary'}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
