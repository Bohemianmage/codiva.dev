'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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

  const triggerClass =
    trigger === 'button'
      ? 'rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50'
      : trigger === 'link'
        ? 'text-codiva-primary hover:underline'
        : 'inline-flex max-w-full items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200';

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
              className="relative flex h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                <p id={titleId} className="text-sm font-semibold text-zinc-900">
                  {title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={downloadHref}
                    className="rounded-lg bg-codiva-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-codiva-primary-dark"
                  >
                    {downloadLabel || t('ops.careers.pipelinePdf')}
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
              <iframe title={title} src={htmlSrc} className="min-h-0 w-full flex-1 bg-white" />
            </div>
          </div>,
          document.body
        )
      : null;

  const triggerButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={triggerHint ? `${triggerLabel}. ${triggerHint}` : triggerLabel}
      className={triggerClass}
    >
      {triggerLabel}
    </button>
  );

  return (
    <>
      {triggerHint ? (
        <span className="group/tip relative z-10 inline-flex max-w-full hover:z-50 focus-within:z-50">
          {triggerButton}
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-[calc(100%+4px)] left-0 z-50 hidden w-max max-w-[16rem] rounded-md bg-zinc-900 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-white group-hover/tip:block group-focus-within/tip:block"
          >
            {triggerHint}
          </span>
        </span>
      ) : (
        triggerButton
      )}
      {dialog}
    </>
  );
}
