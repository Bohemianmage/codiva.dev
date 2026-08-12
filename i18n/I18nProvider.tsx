'use client';

import { useEffect } from 'react';
import i18n from '@/i18n/i18n';
import type { Locale } from '@/i18n/config';

export default function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  if (i18n.resolvedLanguage !== locale && i18n.language !== locale) {
    void i18n.changeLanguage(locale);
  }

  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    if (document.documentElement.lang !== locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return children;
}
