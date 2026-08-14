'use client';

import { injectTranslationBundle } from '@/i18n/injectBundle';
import en from '@/i18n/locales/en/career.json';
import es from '@/i18n/locales/es/career.json';

injectTranslationBundle('career', es, en);

export default function CareerI18n({ children }: { children: React.ReactNode }) {
  return children;
}
