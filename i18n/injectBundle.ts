import i18n from '@/i18n/i18n';

const injected = new Set<string>();

export function injectTranslationBundle(id: string, es: object, en: object) {
  if (injected.has(id)) return;
  injected.add(id);
  i18n.addResourceBundle('es', 'translation', es, true, true);
  i18n.addResourceBundle('en', 'translation', en, true, true);
}
