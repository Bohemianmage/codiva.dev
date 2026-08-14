'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

const QuoteModal = dynamic(() => import('./QuoteModal'), { ssr: false });

export default function FloatingQuoteButton() {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation();

  const close = useCallback(() => {
    setOpen(false);
    setShowForm(false);
  }, []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-codiva-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-105 hover:bg-codiva-primary-dark active:scale-95"
        >
          {t('quote.button')}
        </button>
      </div>

      {open ? (
        <QuoteModal
          key="quote-modal"
          showForm={showForm}
          onShowForm={() => setShowForm(true)}
          onClose={close}
        />
      ) : null}
    </>
  );
}
