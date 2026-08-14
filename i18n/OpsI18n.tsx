'use client';

import { injectTranslationBundle } from '@/i18n/injectBundle';
import en from '@/i18n/locales/en/ops.json';
import es from '@/i18n/locales/es/ops.json';

injectTranslationBundle('ops', es, en);

export default function OpsI18n({ children }: { children: React.ReactNode }) {
  return children;
}
