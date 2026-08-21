'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import HintTooltip from '@/components/ui/HintTooltip';
import Modal, { ModalHeader } from '@/components/ui/Modal';

export default function CareerCvLightbox({
  applicationId,
  name,
  srcBase = '/api/ops/careers/cv',
}: {
  applicationId: string;
  name: string;
  srcBase?: string;
}) {
  const { t } = useTranslation();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const title = t('ops.careers.cvEmbedTitle', { name });
  const closeLabel = t('ops.careers.evidenceClose');
  const cvHref = `${srcBase}?id=${applicationId}`;

  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    let objectUrl: string | null = null;
    setBlobUrl(null);
    setLoadError(false);

    (async () => {
      try {
        const res = await fetch(cvHref, { credentials: 'same-origin', signal: ac.signal });
        if (!res.ok) throw new Error('cv');
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (ac.signal.aborted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setBlobUrl(objectUrl);
      } catch {
        if (ac.signal.aborted) return;
        setLoadError(true);
      }
    })();

    return () => {
      ac.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, cvHref]);

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
                <Button as="a" href={`${cvHref}&download=1`} size="xs">
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
        {blobUrl ? (
          <iframe title={title} src={blobUrl} className="min-h-0 w-full flex-1 bg-zinc-100" />
        ) : (
          <p className="m-auto px-6 text-center text-sm text-zinc-600">
            {loadError ? t('ops.careers.cvLoadError') : t('ops.careers.cvLoading')}
          </p>
        )}
      </Modal>
    </>
  );
}
