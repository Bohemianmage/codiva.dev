'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  const dialog =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button
              type="button"
              className="absolute inset-0 bg-zinc-900/70"
              aria-label={t('ops.careers.evidenceClose')}
              onClick={close}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="relative flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                <p id={titleId} className="text-sm font-semibold text-zinc-900">
                  {t('ops.careers.cvEmbedTitle', { name })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/api/ops/careers/cv?id=${applicationId}&download=1`}
                    className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-codiva-primary-dark"
                  >
                    {t('ops.careers.downloadCv')}
                  </a>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    {t('ops.careers.evidenceClose')}
                  </button>
                </div>
              </div>
              <iframe
                title={t('ops.careers.cvEmbedTitle', { name })}
                src={`/api/ops/careers/cv?id=${applicationId}`}
                className="min-h-0 w-full flex-1 bg-zinc-100"
              />
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span className="group/tip relative z-10 inline-flex max-w-full hover:z-50 focus-within:z-50">
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
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+4px)] left-0 z-50 hidden w-max max-w-[16rem] rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-white group-hover/tip:block group-focus-within/tip:block"
        >
          {t('ops.careers.viewCvHint')}
        </span>
      </span>
      {dialog}
    </>
  );
}
