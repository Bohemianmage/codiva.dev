'use client';

import { useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Modal, { ModalHeader } from '@/components/ui/Modal';

export default function HuntEvidenceLightbox({
  reportId,
  count,
}: {
  reportId: string;
  count: number;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);
  const showPrev = useCallback(() => {
    setOpenIndex((current) => {
      if (current == null || count < 2) return current;
      return (current + count - 1) % count;
    });
  }, [count]);
  const showNext = useCallback(() => {
    setOpenIndex((current) => {
      if (current == null || count < 2) return current;
      return (current + 1) % count;
    });
  }, [count]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    },
    [showPrev, showNext]
  );

  if (count < 1) return null;

  const title =
    openIndex != null ? t('ops.careers.evidenceTitle', { n: openIndex + 1, total: count }) : '';
  const closeLabel = t('ops.careers.evidenceClose');

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, index) => (
          <Button
            key={`${reportId}-${index}`}
            type="button"
            variant="secondary"
            size="xs"
            onClick={() => setOpenIndex(index)}
          >
            {t('ops.careers.evidence', { n: index + 1 })}
          </Button>
        ))}
      </div>
      <Modal
        open={openIndex != null}
        onClose={close}
        title={title}
        titleId={titleId}
        size="frameLg"
        closeLabel={closeLabel}
        backdrop="dark"
        onKeyDown={onKeyDown}
        header={
          <ModalHeader
            title={title}
            titleId={titleId}
            actions={
              <Button type="button" variant="secondary" size="xs" onClick={close}>
                {closeLabel}
              </Button>
            }
          />
        }
        footer={
          count > 1 ? (
            <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3">
              <Button type="button" variant="secondary" size="xs" onClick={showPrev}>
                {t('ops.careers.evidencePrev')}
              </Button>
              <Button type="button" variant="secondary" size="xs" onClick={showNext}>
                {t('ops.careers.evidenceNext')}
              </Button>
            </div>
          ) : null
        }
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-zinc-950 p-3">
          {openIndex != null ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/ops/careers/hunt-file?id=${reportId}&n=${openIndex}`}
              alt={t('ops.careers.evidence', { n: openIndex + 1 })}
              className="max-h-[min(78vh,820px)] max-w-full object-contain"
            />
          ) : null}
        </div>
      </Modal>
    </>
  );
}
