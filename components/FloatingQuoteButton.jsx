'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
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
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-codiva-primary px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-codiva-primary-dark"
        >
          {t('quote.button')}
        </motion.button>
      </div>

      <AnimatePresence>
        {open ? (
          <QuoteModal
            key="quote-modal"
            showForm={showForm}
            onShowForm={() => setShowForm(true)}
            onClose={close}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}
