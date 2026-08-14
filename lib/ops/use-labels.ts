'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveLocale } from '@/i18n/config';
import { labelsFor } from '@/lib/ops/labels';

export function useLabels() {
  const { i18n } = useTranslation();
  return useMemo(() => labelsFor(resolveLocale(i18n.language)), [i18n.language]);
}
