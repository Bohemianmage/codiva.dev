'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    if (openIndex == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    }
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, showPrev, showNext]);

  if (count < 1) return null;

  const dialog =
    openIndex != null && typeof document !== 'undefined'
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
              className="relative flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            >
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
                <p id={titleId} className="text-sm font-semibold text-zinc-900">
                  {t('ops.careers.evidenceTitle', { n: openIndex + 1, total: count })}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {t('ops.careers.evidenceClose')}
                </button>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-zinc-950 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/ops/careers/hunt-file?id=${reportId}&n=${openIndex}`}
                  alt={t('ops.careers.evidence', { n: openIndex + 1 })}
                  className="max-h-[min(78vh,820px)] max-w-full object-contain"
                />
              </div>
              {count > 1 ? (
                <div className="flex items-center justify-between gap-2 border-t border-zinc-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={showPrev}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t('ops.careers.evidencePrev')}
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    {t('ops.careers.evidenceNext')}
                  </button>
                </div>
              ) : null}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={`${reportId}-${index}`}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
          >
            {t('ops.careers.evidence', { n: index + 1 })}
          </button>
        ))}
      </div>
      {dialog}
    </>
  );
}
