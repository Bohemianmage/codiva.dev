'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import i18n from '@/i18n/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '@/hooks/useClickOutside';
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isLocale } from '@/i18n/config';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '/icons/flags/en.svg' },
  { code: 'es', label: 'Español', flag: '/icons/flags/es.svg' },
];

function persistLocale(code) {
  document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
}

export default function LanguageSwitcher() {
  const { t, i18n: i18nHook } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const currentLang = isLocale(i18nHook.resolvedLanguage)
    ? i18nHook.resolvedLanguage
    : isLocale(i18n.resolvedLanguage)
      ? i18n.resolvedLanguage
      : 'es';
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  useClickOutside(dropdownRef, () => setOpen(false));

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const safeFlag =
    LANGUAGES.find((l) => l.code === currentLang)?.flag || LANGUAGES[0].flag;

  async function selectLanguage(code) {
    persistLocale(code);
    await i18n.changeLanguage(code);
    document.documentElement.lang = code;
    setOpen(false);
    router.refresh();
  }

  return (
    <div
      ref={dropdownRef}
      className="relative w-7 h-7"
      onMouseEnter={() => {
        if (isDesktop) {
          clearTimeout(timeoutRef.current);
          setOpen(true);
        }
      }}
      onMouseLeave={() => {
        if (isDesktop) {
          timeoutRef.current = setTimeout(() => setOpen(false), 150);
        }
      }}
    >
      <motion.button
        onClick={() => {
          if (!isDesktop) setOpen((prev) => !prev);
        }}
        aria-label={t('a11y.changeLanguage')}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full h-full rounded-full border border-zinc-300 hover:ring-2 ring-codiva-primary transition shadow-sm bg-white p-0 flex items-center justify-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLang}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            <Image
              src={safeFlag}
              alt={currentLang}
              width={24}
              height={24}
              className="w-full h-full object-cover rounded-full"
              priority
            />
          </motion.div>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-fit min-w-[150px] px-1 py-1 bg-white border border-zinc-200 rounded-xl shadow-lg overflow-hidden z-50 origin-top-right"
          >
            {LANGUAGES.map((lang, index) => (
              <div key={lang.code}>
                <button
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className="flex items-center justify-center gap-3 px-3 py-1.5 w-full hover:bg-zinc-100 text-sm transition rounded-md"
                >
                  <Image
                    src={lang.flag}
                    alt={lang.label}
                    width={20}
                    height={20}
                    className="rounded-sm object-contain"
                    style={{ aspectRatio: '3 / 2' }}
                  />
                  <span className="text-zinc-700 text-[0.875rem] leading-normal">
                    {lang.label}
                  </span>
                </button>

                {index < LANGUAGES.length - 1 && (
                  <div className="border-t border-zinc-200 mx-2 my-1" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
