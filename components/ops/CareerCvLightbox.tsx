'use client';

import { useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import HintTooltip from '@/components/ui/HintTooltip';
import Modal, { ModalHeader } from '@/components/ui/Modal';

export default function CareerCvLightbox({
  applicationId,
  name,
}: {
  applicationId: string;
  name: string;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const title = t('ops.careers.cvEmbedTitle', { name });
  const closeLabel = t('ops.careers.evidenceClose');

  return (
    <>
      <HintTooltip hint={t('ops.careers.viewCvHint')}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${t('ops.careers.viewCv')}. ${t('ops.careers.viewCvHint')}`}
          className="inline-flex max-w-full items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
        >
          {t('ops.careers.viewCv')}
        </button>
      </HintTooltip>
      <Modal
        open={open}
        onClose={close}
        title={title}
        titleId={titleId}
        size="frameLg"
        closeLabel={closeLabel}
        backdrop="dark"
        className="h-[min(92vh,900px)]"
        header={
          <ModalHeader
            title={title}
            titleId={titleId}
            actions={
              <>
                <Button as="a" href={`/api/ops/careers/cv?id=${applicationId}&download=1`} size="xs">
                  {t('ops.careers.downloadCv')}
                </Button>
                <Button type="button" variant="secondary" size="xs" onClick={close}>
                  {closeLabel}
                </Button>
              </>
            }
          />
        }
      >
        <iframe title={title} src={`/api/ops/careers/cv?id=${applicationId}`} className="min-h-0 w-full flex-1 bg-zinc-100" />
      </Modal>
    </>
  );
}
