'use client';

import { useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import HintTooltip from '@/components/ui/HintTooltip';
import Modal, { ModalHeader } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';

export default function OpsReportLightbox({
  title,
  htmlSrc,
  downloadHref,
  triggerLabel,
  triggerHint,
  downloadLabel,
  trigger = 'tag',
}: {
  title: string;
  htmlSrc: string;
  downloadHref: string;
  triggerLabel: string;
  triggerHint?: string;
  downloadLabel?: string;
  trigger?: 'tag' | 'button' | 'link';
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const closeLabel = t('ops.careers.evidenceClose');

  const triggerClass =
    trigger === 'button'
      ? undefined
      : trigger === 'link'
        ? 'text-codiva-primary hover:underline'
        : 'inline-flex max-w-full items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200';

  const triggerButton =
    trigger === 'button' ? (
      <Button
        type="button"
        variant="secondary"
        size="xs"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerHint ? `${triggerLabel}. ${triggerHint}` : triggerLabel}
      >
        {triggerLabel}
      </Button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={triggerHint ? `${triggerLabel}. ${triggerHint}` : triggerLabel}
        className={cn(triggerClass)}
      >
        {triggerLabel}
      </button>
    );

  return (
    <>
      {triggerHint ? <HintTooltip hint={triggerHint}>{triggerButton}</HintTooltip> : triggerButton}
      <Modal
        open={open}
        onClose={close}
        title={title}
        titleId={titleId}
        size="frame"
        closeLabel={closeLabel}
        backdrop="dark"
        header={
          <ModalHeader
            title={title}
            titleId={titleId}
            actions={
              <>
                <Button as="a" href={downloadHref} size="xs">
                  {downloadLabel || t('ops.careers.pipelinePdf')}
                </Button>
                <Button type="button" variant="secondary" size="xs" onClick={close}>
                  {closeLabel}
                </Button>
              </>
            }
          />
        }
      >
        <iframe title={title} src={htmlSrc} className="min-h-0 w-full flex-1 bg-white" />
      </Modal>
    </>
  );
}
